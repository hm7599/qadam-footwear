import { Router } from 'express';
import { onProductUpdated } from '../marketing/alerts.js';
import { DataStore } from '../config/store.js';
import { rateLimit } from '../security/index.js';
import { protect, adminOnly, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET all products with filtering & sorting
router.get('/', async (req, res) => {
  try {
    const { category, gender, isNewArrival, isBestSeller, isTrending, isLimitedEdition, search, sort } = req.query;
    
    let products = await DataStore.getProducts({
      category,
      gender,
      isNewArrival,
      isBestSeller,
      isTrending,
      isLimitedEdition,
      search: search as string
    });

    // Sorting
    if (sort === 'price_asc') {
      products.sort((a: any, b: any) => (a.salePrice || a.price) - (b.salePrice || b.price));
    } else if (sort === 'price_desc') {
      products.sort((a: any, b: any) => (b.salePrice || b.price) - (a.salePrice || a.price));
    } else if (sort === 'rating') {
      products.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === 'newest') {
      products.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all products including drafts (Admin)
router.get('/admin/all', protect, adminOnly, async (_req, res) => {
  try {
    const products = await DataStore.getProducts({ includeDrafts: true });
    res.json({ success: true, count: products.length, data: products });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const PKR_RATE = 280; // prices are stored in USD base; bulk sheets are in PKR
const CATEGORIES = ['casuals', 'formals', 'sandals', 'slides', 'chelsea-boots', 'running', 'lifestyle', 'basketball', 'luxury-minimal'];
const CATEGORY_ALIASES: Record<string, string> = {
  formal: 'formals', oxford: 'formals', loafer: 'formals', loafers: 'formals',
  casual: 'casuals', sandal: 'sandals', slide: 'slides', slipper: 'slides', slippers: 'slides',
  boot: 'chelsea-boots', boots: 'chelsea-boots', chelsea: 'chelsea-boots', 'chelsea boots': 'chelsea-boots',
  sneaker: 'lifestyle', sneakers: 'lifestyle', sports: 'basketball', sport: 'basketball', run: 'running',
};
const yes = (v: any) => v === true || /^(1|yes|y|true)$/i.test(String(v ?? '').trim());

// POST bulk create products as drafts (Admin)
// body: { products: [{ name, price, salePrice?, category?, gender?, tagline?, description?, sizes?, colors?, isNewArrival?, ... }] }
router.post('/bulk', protect, adminOnly, async (req: AuthenticatedRequest, res) => {
  const rows: any[] = Array.isArray(req.body?.products) ? req.body.products : [];
  if (!rows.length) return res.status(400).json({ success: false, message: 'No products received.' });
  if (rows.length > 500) return res.status(400).json({ success: false, message: 'Maximum 500 products per upload.' });

  const created: any[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] || {};
    const name = String(r.name || '').trim();
    const pricePkr = Number(String(r.price ?? '').replace(/[^0-9.]/g, ''));
    if (!name) { errors.push({ row: i + 1, message: 'Name is missing' }); continue; }
    if (!pricePkr || pricePkr <= 0) { errors.push({ row: i + 1, message: 'Price is missing or invalid' }); continue; }
    const salePkr = Number(String(r.salePrice ?? '').replace(/[^0-9.]/g, ''));

    let category = String(r.category || '').trim().toLowerCase();
    category = CATEGORY_ALIASES[category] || category;
    if (!CATEGORIES.includes(category)) category = 'casuals';

    const gender = ['men', 'women', 'unisex'].includes(String(r.gender || '').toLowerCase()) ? String(r.gender).toLowerCase() : 'men';
    const sizes = String(r.sizes || '')
      .split(/[,;|s]+/).map(Number).filter(n => Number.isFinite(n) && n > 0);
    const colorNames = String(r.colors || '').split(/[,;|]+/).map((c: string) => c.trim()).filter(Boolean);

    try {
      const product = await DataStore.createProduct({
        name,
        tagline: String(r.tagline || '').trim(),
        description: String(r.description || r.tagline || name).trim(),
        price: Math.round((pricePkr / PKR_RATE) * 100) / 100,
        ...(salePkr > 0 && salePkr < pricePkr ? { salePrice: Math.round((salePkr / PKR_RATE) * 100) / 100 } : {}),
        category,
        gender,
        sizes: sizes.length ? sizes : [39, 40, 41, 42, 43, 44, 45, 46],
        colors: colorNames.map((c: string) => ({ name: c, hex: '#111111', previewImage: '', modelTint: '#FFFFFF' })),
        images: [],
        stock: 9999,
        isNewArrival: yes(r.isNewArrival ?? r.new),
        isBestSeller: yes(r.isBestSeller ?? r.bestseller),
        isTrending: yes(r.isTrending ?? r.trending),
        isLimitedEdition: yes(r.isLimitedEdition ?? r.limited),
        rating: 5,
        reviewCount: 0,
        reviews: [],
        status: 'draft',
      });
      created.push(product);
    } catch (err: any) {
      errors.push({ row: i + 1, message: err.message || 'Could not save' });
    }
  }

  res.status(created.length ? 201 : 400).json({
    success: created.length > 0,
    message: `${created.length} product(s) added as draft.` + (errors.length ? ` ${errors.length} row(s) skipped.` : ''),
    data: { created: created.length, errors },
  });
});

// GET product by id or slug
router.get('/:idOrSlug', async (req, res) => {
  try {
    const idOrSlug = String(req.params.idOrSlug);
    const product = await DataStore.getProductByIdOrSlug(idOrSlug);
    // Drafts are not visible in the shop
    if (!product || (product as any).status === 'draft') {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({
      success: true,
      data: product
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create product (Admin)
router.post('/', protect, adminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, price, description } = req.body;
    if (!name || !price || !description) {
      return res.status(400).json({ success: false, message: 'Name, price and description are required.' });
    }
    const created = await DataStore.createProduct(req.body);
    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: created
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update product (Admin)
router.put('/:id', protect, adminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const id = String(req.params.id);
    // Snapshot before saving so stock / price changes can trigger customer alerts
    const beforeDoc: any = await DataStore.getProductByIdOrSlug(id);
    const before = beforeDoc ? JSON.parse(JSON.stringify(beforeDoc)) : null;
    const updated = await DataStore.updateProduct(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    onProductUpdated(before, JSON.parse(JSON.stringify(updated))).catch(() => {});
    res.json({
      success: true,
      message: 'Product updated successfully.',
      data: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE product (Admin)
router.delete('/:id', protect, adminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const id = String(req.params.id);
    const deleted = await DataStore.deleteProduct(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found or already deleted.' });
    }
    res.json({
      success: true,
      message: 'Product deleted successfully.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST add customer review
router.post('/:id/review', rateLimit('review', 5, 60 * 60000), async (req, res) => {
  try {
    const id = String(req.params.id);
    const { author, rating, title, comment } = req.body || {};
    const stars = Math.round(Number(rating));
    if (!(stars >= 1 && stars <= 5) || typeof comment !== 'string' || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Please give 1–5 stars and write a comment.' });
    }
    const updatedProduct = await DataStore.addReview(id, {
      author: String(author || 'Customer').trim().slice(0, 60) || 'Customer',
      rating: stars,
      title: String(title || '').trim().slice(0, 120),
      comment: comment.trim().slice(0, 2000),
    });
    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.status(201).json({
      success: true,
      message: 'Review recorded. Thank you for your feedback.',
      data: updatedProduct
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
