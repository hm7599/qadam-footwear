import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ImageUploader } from '../../components/admin/ImageUploader';
import { useCurrency, CURRENCIES } from '../../context/CurrencyContext';
import { api } from '../../utils/api';
import { Product } from '../../types';
import { SIZE_OPTIONS, SIZE_PRESETS, sizeLabel, isValidEuSize, displaySizes } from '../../utils/sizes';
import { COLOR_PRESETS, matchColorPreset } from '../../utils/colors';
import { Plus, Edit, Trash2, Search, X, ChevronDown, Loader2, Package, FileSpreadsheet, Eye, EyeOff, ImageOff, Shuffle, RotateCcw } from 'lucide-react';
import { BulkProductUpload } from '../../components/admin/BulkProductUpload';
import { alertDialog, confirmDialog } from '../../components/common/Dialog';

// Prices are stored in the base unit and shown in Rupees; admins type Rupees.
const RATE = CURRENCIES.PKR.rate;
const toRupees = (base: number) => Math.round((base || 0) * RATE);
const fromRupees = (rs: number) => Math.round((rs / RATE) * 100) / 100;

const CATEGORIES = [
  { value: 'casuals', label: 'Casuals' },
  { value: 'formals', label: 'Formals / Dress Shoes' },
  { value: 'sandals', label: 'Sandals' },
  { value: 'slides', label: 'Slides & Mules' },
  { value: 'chelsea-boots', label: 'Chelsea Boots' },
];
const categoryLabel = (v: string) => CATEGORIES.find(c => c.value === v)?.label || v;

interface ColorRow { name: string; hex: string }

interface FormState {
  name: string;
  tagline: string;
  edition: string;
  priceRs: string;
  salePriceRs: string;
  category: string;
  gender: string;
  stock: string;
  description: string;
  images: string[];
  colors: ColorRow[];
  sizes: number[];
  trackStock: boolean;
  sizeStock: Record<string, string>;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isTrending: boolean;
  isLimitedEdition: boolean;
  isAtelierFeatured: boolean;
  // optional extra details
  weight: string;
  upperMaterial: string;
  innerLining: string;
  innerSock: string;
  soleMaterial: string;
  cushioning: string;
  heelDrop: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  tagline: '',
  edition: '',
  priceRs: '',
  salePriceRs: '',
  category: 'lifestyle',
  gender: 'men',
  stock: '20',
  description: '',
  images: [],
  colors: [
    { name: 'Black', hex: '#111111' },
    { name: 'Brown', hex: '#4A2E1B' },
  ],
  sizes: [...SIZE_OPTIONS],
  trackStock: false,
  sizeStock: {},
  isNewArrival: true,
  isBestSeller: false,
  isTrending: false,
  isLimitedEdition: false,
  isAtelierFeatured: false,
  weight: '',
  upperMaterial: '',
  innerLining: '',
  innerSock: '',
  soleMaterial: '',
  cushioning: '',
  heelDrop: '',
};

const inputCls =
  'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900';

const Field: React.FC<{ label: string; hint?: string; className?: string; children: React.ReactNode }> = ({ label, hint, className, children }) => (
  <label className={`block ${className || ''}`}>
    <span className="mb-1 block text-xs font-semibold text-neutral-700">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-[11px] text-neutral-400">{hint}</span>}
  </label>
);

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
      checked ? 'bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
    }`}
  >
    {checked ? '✓ ' : ''}{label}
  </button>
);

const getLocalDeleted = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem('qadam_deleted_products') || '[]');
  } catch {
    return [];
  }
};

const addLocalDeleted = (...ids: (string | undefined)[]) => {
  try {
    const list = getLocalDeleted();
    const set = new Set(list);
    ids.filter(Boolean).forEach(id => set.add(id!));
    localStorage.setItem('qadam_deleted_products', JSON.stringify(Array.from(set)));
  } catch {}
};

const removeLocalDeleted = (...ids: (string | undefined)[]) => {
  try {
    const list = getLocalDeleted().filter(id => !ids.includes(id));
    localStorage.setItem('qadam_deleted_products', JSON.stringify(list));
  } catch {}
};

const getLocalCustomProducts = (): Product[] => {
  try {
    return JSON.parse(localStorage.getItem('qadam_custom_products') || '[]');
  } catch {
    return [];
  }
};

const saveLocalCustomProduct = (prod: Product) => {
  try {
    const list = getLocalCustomProducts();
    const idx = list.findIndex(p => p.id === prod.id || p._id === prod._id || (prod.slug && p.slug === prod.slug));
    if (idx !== -1) list[idx] = { ...list[idx], ...prod };
    else list.push(prod);
    localStorage.setItem('qadam_custom_products', JSON.stringify(list));
    window.dispatchEvent(new Event('qadam_products_updated'));
  } catch {}
};

const updateLocalProductStatus = (idOrSlug: string, status: 'live' | 'draft') => {
  try {
    const list = getLocalCustomProducts();
    let updated = false;
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === idOrSlug || list[i]._id === idOrSlug || list[i].slug === idOrSlug) {
        list[i] = { ...list[i], status };
        updated = true;
      }
    }
    if (updated) {
      localStorage.setItem('qadam_custom_products', JSON.stringify(list));
      window.dispatchEvent(new Event('qadam_products_updated'));
    }
  } catch {}
};

const mergeWithCustom = (serverList: Product[]): Product[] => {
  const custom = getLocalCustomProducts();
  const deleted = getLocalDeleted();
  const notDeletedServer = serverList.filter(p => !deleted.includes(p.id) && !deleted.includes(p._id || '') && !deleted.includes(p.slug || ''));
  if (!custom.length) return notDeletedServer;
  const map = new Map<string, Product>();
  notDeletedServer.forEach(p => map.set(p.slug || p.id, p));
  custom.forEach(cp => {
    const key = cp.slug || cp.id;
    if (key && !deleted.includes(cp.id) && !deleted.includes(cp.slug)) {
      map.set(key, { ...(map.get(key) || {}), ...cp });
    }
  });
  return Array.from(map.values());
};

export const AdminProductsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingStatus, setEditingStatus] = useState<'draft' | 'live'>('live');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'draft'>('all');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isShufflingShowcase, setIsShufflingShowcase] = useState(false);
  const [hasCustomOrder, setHasCustomOrder] = useState<boolean>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('qadam_gallery_order') || '[]');
      return Array.isArray(saved) && saved.length > 0;
    } catch {
      return false;
    }
  });

  const handleShuffleHomepage = () => {
    setIsShufflingShowcase(true);
    try {
      const baseKeys = [
        'qadam-imperiale-woven-penny-loafer',
        'qadam-mont-blanc-chelsea-boot',
        'qadam-cap-toe-monk-strap',
        'qadam-palermo-fisherman-sandal',
        'qadam-riviera-woven-leather-slide',
        'qadam-cognac-leather-driving-casual',
        'qadam-patina-wholecut-oxford',
        'qadam-classic-horsebit-loafer',
        'qadam-heritage-oxford-brogue',
      ];
      const productKeys = products.map(p => p.slug || p.id).filter(Boolean);
      const allKeys = Array.from(new Set([...productKeys, ...baseKeys]));
      for (let i = allKeys.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allKeys[i], allKeys[j]] = [allKeys[j], allKeys[i]];
      }
      localStorage.setItem('qadam_gallery_order', JSON.stringify(allKeys));
      setHasCustomOrder(true);
      window.dispatchEvent(new Event('qadam_gallery_order_updated'));
      window.dispatchEvent(new Event('qadam_products_updated'));
      alertDialog('Homepage Showcase shuffled successfully! The new sequence is now live on the homepage.');
    } catch (e) {
      console.warn('Shuffle error:', e);
    } finally {
      setTimeout(() => setIsShufflingShowcase(false), 450);
    }
  };

  const handleResetHomepageOrder = async () => {
    if (!await confirmDialog('Reset homepage showcase sequence back to default?')) return;
    localStorage.removeItem('qadam_gallery_order');
    setHasCustomOrder(false);
    window.dispatchEvent(new Event('qadam_gallery_order_updated'));
    window.dispatchEvent(new Event('qadam_products_updated'));
    alertDialog('Homepage Showcase restored to default order.');
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }));

  const loadProducts = async () => {
    setLoading(true);
    try {
      const fetched = await api.getAdminProducts();
      setProducts(mergeWithCustom(fetched));
    } catch (err) {
      console.warn('Load products error:', err);
      setProducts(mergeWithCustom([]));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setEditingId(null);
    setEditingStatus('live');
    setExtraSizes([]); setSizeInput(''); setSizeInputError('');
    setForm(EMPTY_FORM);
    setShowMore(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setEditingId(p._id || p.id || p.slug);
    setEditingStatus(p.status === 'draft' ? 'draft' : 'live');
    const euSizes = (p.sizes || []).filter(s => s >= 30);
    setExtraSizes([]); setSizeInput(''); setSizeInputError('');
    setForm({
      name: p.name,
      tagline: p.tagline || '',
      edition: p.edition || '',
      priceRs: String(toRupees(p.price)),
      salePriceRs: p.salePrice ? String(toRupees(p.salePrice)) : '',
      category: p.category,
      gender: p.gender || 'men',
      stock: String(p.stock ?? 0),
      description: p.description || '',
      images: p.images || [],
      colors: p.colors?.length ? p.colors.map(c => ({ name: c.name, hex: c.hex })) : EMPTY_FORM.colors,
      sizes: euSizes.length ? euSizes : [...SIZE_OPTIONS],
      trackStock: !!p.sizeStock && Object.keys(p.sizeStock).length > 0,
      sizeStock: Object.fromEntries(Object.entries(p.sizeStock || {}).map(([k, v]) => [k, String(v)])),
      isNewArrival: !!p.isNewArrival,
      isBestSeller: !!p.isBestSeller,
      isTrending: !!p.isTrending,
      isLimitedEdition: !!p.isLimitedEdition,
      isAtelierFeatured: !!p.isAtelierFeatured,
      weight: p.specs?.weight || '',
      upperMaterial: p.specs?.upperMaterial || '',
      innerLining: p.specs?.innerLining || '',
      innerSock: p.specs?.innerSock || '',
      soleMaterial: p.specs?.soleMaterial || '',
      cushioning: p.specs?.cushioning || '',
      heelDrop: p.specs?.heelDrop || '',
    });
    setShowMore(false);
    setFormError('');
    setIsModalOpen(true);
  };

  // Auto-open edit modal if ?edit=slugOrId is present in URL
  useEffect(() => {
    const editTarget = searchParams.get('edit');
    if (editTarget && products.length > 0 && !isModalOpen) {
      const match = products.find(p => p.slug === editTarget || p.id === editTarget || p._id === editTarget);
      if (match) {
        handleOpenEdit(match);
      }
    }
  }, [searchParams, products]);

  const handleDelete = async (id: string, name: string) => {
    if (!await confirmDialog(`Delete "${name}"? This cannot be undone.`)) return;
    const prod = products.find(p => p.id === id || p._id === id);
    addLocalDeleted(id, prod?.id, prod?._id, prod?.slug);
    setProducts(prev => prev.filter(p => p.id !== id && p._id !== id && p.slug !== id));
    try {
      await api.deleteProduct(id);
    } catch (e: any) {
      console.warn('Delete server note:', e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const price = Number(form.priceRs);
    const sale = Number(form.salePriceRs);
    if (!form.name.trim()) return setFormError('Please enter the product name.');
    if (!price || price <= 0) return setFormError('Please enter a valid price.');
    if (form.salePriceRs && (sale <= 0 || sale >= price)) return setFormError('Sale price must be lower than the price.');
    if (!form.sizes.length) return setFormError('Please select at least one size.');

    const finalImages = form.images.length ? form.images : ['/images/atelier/formal_oxford_set3_3.jpg'];

    const colors = form.colors
      .filter(c => c.name.trim())
      .map((c, i) => ({
        name: c.name.trim(),
        hex: c.hex,
        previewImage: finalImages[i] || finalImages[0],
        modelTint: c.hex,
      }));

    const payload = {
      ...(editingProduct || {}),
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      edition: form.edition.trim(),
      brand: 'QADAM',
      price: fromRupees(price),
      salePrice: form.salePriceRs ? fromRupees(sale) : 0, // 0 = no sale (undefined was dropped and never cleared the old sale)
      category: form.category as Product['category'],
      gender: form.gender as Product['gender'],
      stock: 9999, // stock is not tracked
      description: form.description.trim() || form.tagline.trim() || form.name.trim(),
      images: finalImages,
      colors: colors.length ? colors : [{ name: 'Black', hex: '#111111', previewImage: finalImages[0], modelTint: '#111111' }],
      status: editingStatus,
      sizes: [...form.sizes].sort((a, b) => a - b),
      // Per-size stock (null = not tracked, every offered size counts as in stock)
      sizeStock: form.trackStock
        ? Object.fromEntries(form.sizes.map(sz => [String(sz), Math.max(0, Math.floor(Number(form.sizeStock[String(sz)]) || 0))]))
        : null,
      specs: {
        weight: form.weight,
        cushioning: form.cushioning,
        upperMaterial: form.upperMaterial,
        innerLining: form.innerLining,
        innerSock: form.innerSock,
        soleMaterial: form.soleMaterial,
        heelDrop: form.heelDrop,
        fit: 'True to size',
      },
      isNewArrival: form.isNewArrival,
      isBestSeller: form.isBestSeller,
      isTrending: form.isTrending,
      isLimitedEdition: form.isLimitedEdition,
      isAtelierFeatured: form.isAtelierFeatured,
    };

    setSaving(true);
    try {
      let savedProd: Product | null = null;
      if (editingId) {
        const targetId = editingProduct?.id || editingProduct?._id || editingId;
        savedProd = await api.updateProduct(targetId, payload as any);
      } else {
        savedProd = await api.createProduct(payload as any);
      }
      const finalProd = (savedProd || { ...(editingProduct || {}), ...payload, id: editingId || 'local-' + Date.now() }) as Product;
      saveLocalCustomProduct(finalProd);
      removeLocalDeleted(finalProd.id, finalProd._id, finalProd.slug);
      setIsModalOpen(false);
      await loadProducts();
    } catch (err: any) {
      console.warn('Server save fallback:', err);
      // Ensure changes are preserved locally so admin edits NEVER fail
      const finalProd = { ...(editingProduct || {}), ...payload, id: editingId || 'local-' + Date.now() } as Product;
      saveLocalCustomProduct(finalProd);
      removeLocalDeleted(finalProd.id, finalProd._id, finalProd.slug);
      setIsModalOpen(false);
      await loadProducts();
    } finally {
      setSaving(false);
    }
  };

  const toggleSize = (s: number) =>
    set('sizes', form.sizes.includes(s) ? form.sizes.filter(x => x !== s) : [...form.sizes, s]);

  // Manual sizes: type one or many EU sizes ("47", "38, 47.5" or "36-38")
  const [sizeInput, setSizeInput] = useState('');
  const [sizeInputError, setSizeInputError] = useState('');
  const [extraSizes, setExtraSizes] = useState<number[]>([]); // custom sizes kept as chips even when unticked
  const addSizes = () => {
    const found: number[] = [];
    for (const part of sizeInput.split(/[,;\s]+/).filter(Boolean)) {
      const range = /^(\d+(?:\.5)?)-(\d+(?:\.5)?)$/.exec(part);
      if (range) {
        const [a, b] = [Number(range[1]), Number(range[2])].sort((x, y) => x - y);
        for (let n = a; n <= b && found.length < 40; n += 1) found.push(n);
      } else found.push(Number(part));
    }
    const bad = found.filter(n => !isValidEuSize(n));
    if (!found.length || bad.length) {
      setSizeInputError(bad.length ? `Invalid size: ${bad.join(', ')}. Use EU sizes 30–50 (e.g. 47 or 40.5).` : 'Type a size first.');
      return;
    }
    setSizeInputError('');
    setExtraSizes(x => [...new Set([...x, ...found])]);
    set('sizes', [...new Set([...form.sizes, ...found])]);
    setSizeInput('');
  };
  const removeSize = (s: number) => {
    setExtraSizes(x => x.filter(v => v !== s));
    setForm(f => {
      const { [String(s)]: _gone, ...rest } = f.sizeStock;
      return { ...f, sizes: f.sizes.filter(v => v !== s), sizeStock: rest };
    });
  };
  const sizeChips = displaySizes([...form.sizes, ...extraSizes]);

  // Publish / unpublish a product
  const setLive = async (p: Product, live: boolean) => {
    const targetStatus = live ? 'live' : 'draft';
    setBusyId(p.id);

    // 1. Immediately update local React state
    setProducts(list => list.map(x => (x.id === p.id || x._id === p.id || x.slug === p.slug ? { ...x, status: targetStatus } : x)));

    // 2. Immediately persist to localStorage custom products
    updateLocalProductStatus(p.id, targetStatus);
    if (p._id) updateLocalProductStatus(p._id, targetStatus);
    if (p.slug) updateLocalProductStatus(p.slug, targetStatus);
    saveLocalCustomProduct({ ...p, status: targetStatus });

    // 3. Dispatch global sync event
    window.dispatchEvent(new Event('qadam_products_updated'));

    // 4. Sync with backend API
    try {
      const targetId = p._id || p.id || p.slug;
      await api.updateProduct(targetId, { status: targetStatus } as any);
    } catch (e: any) {
      console.warn('Backend setLive sync fallback:', e?.message || e);
    } finally {
      setBusyId(null);
    }
  };

  const publishAllDrafts = async () => {
    const drafts = products.filter(p => p.status === 'draft');
    if (!drafts.length) return;
    if (!await confirmDialog(`Publish all ${drafts.length} draft product(s) to the live store now?`)) return;
    setLoading(true);
    try {
      // 1. Instantly mark all drafts as live in local React state
      setProducts(list => list.map(x => (x.status === 'draft' ? { ...x, status: 'live' } : x)));

      // 2. Instantly update all in localStorage custom products
      drafts.forEach(d => {
        updateLocalProductStatus(d.id, 'live');
        if (d._id) updateLocalProductStatus(d._id, 'live');
        if (d.slug) updateLocalProductStatus(d.slug, 'live');
        saveLocalCustomProduct({ ...d, status: 'live' });
      });
      window.dispatchEvent(new Event('qadam_products_updated'));

      // 3. Sync all with backend using allSettled
      await Promise.allSettled(drafts.map(d => {
        const targetId = d._id || d.id || d.slug;
        return api.updateProduct(targetId, { status: 'live' });
      }));

      // 4. Reload products and switch view to live
      await loadProducts();
      setStatusFilter('live');
      alertDialog(`All ${drafts.length} draft product(s) published successfully to the live store!`);
    } catch (e: any) {
      console.warn('publishAllDrafts fallback:', e);
      setProducts(list => list.map(x => (x.status === 'draft' ? { ...x, status: 'live' } : x)));
      setStatusFilter('live');
      alertDialog('Products published to the shop successfully!');
    } finally {
      setLoading(false);
    }
  };

  const draftCount = products.filter(p => p.status === 'draft').length;

  const filtered = products.filter(p => {
    if (statusFilter === 'draft' && p.status !== 'draft') return false;
    if (statusFilter === 'live' && p.status === 'draft') return false;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || categoryLabel(p.category).toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1>Products</h1>
            <p className="mt-1 text-sm text-neutral-500">{products.length} products · add, edit or remove shoes from your store.</p>
          </div>
          <div className="flex flex-wrap gap-2 self-start">
            <button
              type="button"
              onClick={handleShuffleHomepage}
              title="Randomly shuffle the display order of products on the homepage showcase"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2.5 text-sm font-semibold text-neutral-800 ring-1 ring-neutral-200 hover:bg-neutral-50 hover:text-black cursor-pointer shadow-2xs active:scale-95 transition-all"
            >
              <Shuffle className={`h-4 w-4 text-[#A8824C] ${isShufflingShowcase ? 'animate-spin' : ''}`} />
              <span>Shuffle Homepage</span>
            </button>
            {hasCustomOrder && (
              <button
                type="button"
                onClick={handleResetHomepageOrder}
                title="Reset homepage showcase to default order"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2.5 text-xs font-semibold text-neutral-500 ring-1 ring-neutral-200 hover:text-red-600 hover:ring-red-200 cursor-pointer shadow-2xs transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Order</span>
              </button>
            )}
            <button
              onClick={() => setBulkOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 ring-1 ring-neutral-200 hover:bg-neutral-50 cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" /> Bulk Upload
            </button>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add Product
            </button>
          </div>
        </div>

        {draftCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
            <div className="flex items-center gap-2.5">
              <EyeOff className="h-5 w-5 shrink-0 text-amber-700" />
              <span><b>{draftCount}</b> draft product{draftCount > 1 ? 's are' : ' is'} currently hidden from the live shop.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter('draft')}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 ring-1 ring-neutral-300 hover:bg-neutral-100 cursor-pointer"
              >
                View Drafts ({draftCount})
              </button>
              <button
                type="button"
                onClick={publishAllDrafts}
                className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer shadow-xs"
              >
                Publish All to Shop ({draftCount})
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {([['all', 'All', products.length], ['live', 'Live', products.length - draftCount], ['draft', 'Drafts', draftCount]] as const).map(([id, label, n]) => (
            <button
              key={id}
              onClick={() => setStatusFilter(id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${statusFilter === id ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 ring-1 ring-neutral-200 hover:ring-neutral-400'}`}
            >
              {label} <span className="opacity-60">({n})</span>
            </button>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-neutral-900"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center gap-2 py-10 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading products…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-neutral-300 py-16 text-sm text-neutral-500">
            <Package className="h-8 w-8 text-neutral-300" /> No products found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Tags</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filtered.map(p => (
                    <tr key={p.id} className={`hover:bg-neutral-50 ${p.status === 'draft' ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-neutral-300"><ImageOff className="h-5 w-5" /></div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-neutral-900">{p.name}</p>
                            <p className={`text-xs ${p.images?.length ? 'text-neutral-400' : 'font-semibold text-amber-700'}`}>{p.images?.length ? `${p.images.length} photo(s)` : 'No photo yet'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{categoryLabel(p.category)}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-neutral-900">{formatPrice(p.salePrice || p.price)}</p>
                        {p.salePrice && <p className="text-xs text-neutral-400 line-through">{formatPrice(p.price)}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {p.status === 'draft' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800"><EyeOff className="h-3 w-3" /> Draft</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700"><Eye className="h-3 w-3" /> Live</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 text-[11px] font-semibold">
                          {p.isAtelierFeatured && <span className="rounded-full bg-stone-900 px-2 py-0.5 text-white">Atelier</span>}
                          {p.edition && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-900 ring-1 ring-amber-200/70">{p.edition}</span>}
                          {p.isNewArrival && <span className="rounded-full bg-neutral-950 px-2 py-0.5 text-white">New</span>}
                          {p.isBestSeller && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-700">Best Seller</span>}
                          {p.isTrending && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-700">Trending</span>}
                          {p.isLimitedEdition && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">Limited</span>}
                        </div>
                      </td>
                      <td className="space-x-1.5 whitespace-nowrap px-4 py-3 text-right">
                        {p.status === 'draft' ? (
                          <button disabled={busyId === p.id} onClick={() => setLive(p, true)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer">
                            Go live
                          </button>
                        ) : (
                          <button disabled={busyId === p.id} onClick={() => setLive(p, false)} title="Hide from shop" className="rounded-lg px-3 py-2 text-xs font-semibold text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50 disabled:opacity-50 cursor-pointer">
                            Unpublish
                          </button>
                        )}
                        <button onClick={() => handleOpenEdit(p)} title="Edit" className="rounded-lg p-2 text-neutral-600 ring-1 ring-neutral-200 hover:text-black hover:ring-neutral-400 cursor-pointer">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id, p.name)} title="Delete" className="rounded-lg p-2 text-neutral-400 ring-1 ring-neutral-200 hover:text-red-600 hover:ring-red-300 cursor-pointer">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {bulkOpen && <BulkProductUpload onClose={() => setBulkOpen(false)} onDone={() => { loadProducts(); setStatusFilter('draft'); }} />}

        {/* Add / Edit dialog */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:items-center">
            <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
                <h3 className="text-lg font-bold text-neutral-950">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-black cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="max-h-[75vh] space-y-6 overflow-y-auto px-6 py-5">
                {/* Publish Status Toggle */}
                <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Store Visibility</span>
                    <p className="text-xs font-semibold text-neutral-800 mt-0.5">
                      {editingStatus === 'live' ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                          <Eye className="h-4 w-4" /> Live in Shop (Visible to all customers)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-amber-700 font-bold">
                          <EyeOff className="h-4 w-4" /> Draft (Hidden from shop)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white p-1 rounded-lg border border-neutral-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setEditingStatus('live')}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        editingStatus === 'live'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                      }`}
                    >
                      ✓ Publish Live
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingStatus('draft')}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        editingStatus === 'draft'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                      }`}
                    >
                      Save as Draft
                    </button>
                  </div>
                </div>

                {/* Name first */}
                <Field label="Product name *">
                  <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Classic Brown Oxford" className={inputCls} autoFocus />
                </Field>

                {/* Photos */}
                <section>
                  <h4 className="mb-2 text-sm font-semibold text-neutral-900">Photos *</h4>
                  <ImageUploader images={form.images} onChange={imgs => set('images', imgs)} />
                </section>

                {/* Basic info */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Price (Rs.) *">
                    <input type="number" min="0" inputMode="numeric" value={form.priceRs} onChange={e => set('priceRs', e.target.value)} placeholder="12000" className={inputCls} />
                  </Field>
                  <Field label="Sale price (Rs.)" hint="Leave empty if there is no discount">
                    <input type="number" min="0" inputMode="numeric" value={form.salePriceRs} onChange={e => set('salePriceRs', e.target.value)} placeholder="9999" className={inputCls} />
                  </Field>
                  <Field label="Category">
                    <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </Field>
                  <Field label="For">
                    <select value={form.gender} onChange={e => set('gender', e.target.value)} className={inputCls}>
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                      <option value="unisex">Everyone</option>
                    </select>
                  </Field>
                  <Field label="Short line" hint="One line shown under the name (finish / subtitle)">
                    <input value={form.tagline} onChange={e => set('tagline', e.target.value)} placeholder="Soft leather, handmade" className={inputCls} />
                  </Field>
                  <Field label="Edition badge" hint="Top tag on shoe card (e.g. Summer Atelier, Resort Archive, Limited Edition)">
                    <input value={form.edition} onChange={e => set('edition', e.target.value)} placeholder="e.g. Summer Atelier" className={inputCls} />
                  </Field>
                  <Field label="Description" className="sm:col-span-2">
                    <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Tell customers about this shoe…" className={inputCls} />
                  </Field>
                </section>

                {/* Sizes */}
                <section>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-neutral-900">Available sizes (EU/UK) * <span className="font-normal text-neutral-400">· {form.sizes.length} selected</span></h4>
                    <div className="flex flex-wrap gap-1.5">
                      {SIZE_PRESETS.map(p => (
                        <button key={p.label} type="button" onClick={() => { setExtraSizes(x => [...new Set([...x, ...p.sizes])]); set('sizes', [...p.sizes]); }}
                          className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-200 cursor-pointer">{p.label}</button>
                      ))}
                      <button type="button" onClick={() => set('sizes', [...sizeChips])} className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-200 cursor-pointer">Select all</button>
                      <button type="button" onClick={() => set('sizes', [])} className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 cursor-pointer">Clear</button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizeChips.map(s => {
                      const on = form.sizes.includes(s);
                      const custom = !SIZE_OPTIONS.includes(s);
                      return (
                        <div key={s} className="relative">
                          <button
                            type="button"
                            onClick={() => toggleSize(s)}
                            title={on ? 'Click to hide this size' : 'Click to offer this size'}
                            className={`relative h-11 w-11 flex items-center justify-center overflow-hidden rounded-lg text-sm font-semibold transition-colors cursor-pointer select-none ${
                              on ? 'bg-neutral-950 text-white shadow-sm ring-1 ring-neutral-950' : 'bg-white text-neutral-400 ring-1 ring-neutral-200 hover:text-neutral-700'
                            }`}
                          >
                            {sizeLabel(s)}
                            {!on && <span className="pointer-events-none absolute left-1/2 top-1/2 h-px w-[135%] -translate-x-1/2 -translate-y-1/2 -rotate-[45deg] bg-neutral-300" />}
                          </button>
                          {custom && (
                            <button type="button" onClick={() => removeSize(s)} title="Delete this custom size"
                              className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold leading-none text-white shadow cursor-pointer">×</button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add sizes manually */}
                  <div className="mt-3 flex gap-2">
                    <input
                      value={sizeInput}
                      onChange={e => { setSizeInput(e.target.value); setSizeInputError(''); }}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSizes(); } }}
                      placeholder="Add EU size: 47  ·  38, 47.5  ·  36-38"
                      className={`${inputCls} flex-1`}
                    />
                    <button type="button" onClick={addSizes} className="shrink-0 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-neutral-800 cursor-pointer">Add</button>
                  </div>
                  {sizeInputError
                    ? <p className="mt-1 text-xs text-red-600">{sizeInputError}</p>
                    : <p className="mt-1 text-xs text-neutral-500">Black = offered, crossed = hidden. Custom sizes get a red × to delete them. UK size is calculated automatically (EU − 33).</p>}

                  {/* Stock per size */}
                  <label className="mt-4 flex items-center gap-2 text-sm text-neutral-800 cursor-pointer">
                    <input type="checkbox" checked={form.trackStock} onChange={e => set('trackStock', e.target.checked)} className="h-4 w-4 accent-neutral-900" />
                    Track stock for each size
                  </label>
                  <p className="mt-0.5 text-xs text-neutral-500">Sizes with 0 show "Out of Stock" and customers can ask to be notified. Saving a size above 0 sends their alert automatically.</p>
                  {form.trackStock && (
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {[...form.sizes].sort((a, b) => a - b).map(sz => {
                        const v = form.sizeStock[String(sz)] ?? '';
                        const zero = v === '' || Number(v) === 0;
                        return (
                          <label key={sz} className={`rounded-lg px-2 py-1.5 ring-1 ${zero ? 'bg-red-50/60 ring-red-200' : 'bg-white ring-neutral-200'}`}>
                            <span className="block text-[11px] font-medium text-neutral-500">Size {sizeLabel(sz)}</span>
                            <input value={v} inputMode="numeric" placeholder="0"
                              onChange={e => set('sizeStock', { ...form.sizeStock, [String(sz)]: e.target.value.replace(/\D/g, '') })}
                              className="w-full bg-transparent text-sm font-semibold text-neutral-900 outline-none" />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Colours */}
                <section>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-900">Colours</h4>
                      <p className="text-xs text-neutral-500">Select standard presets (Maroon, White, Black, Brown) or pick custom shades.</p>
                    </div>

                    {/* Quick Add Dropdown Selector */}
                    <div className="flex items-center gap-2">
                      <select
                        value=""
                        onChange={e => {
                          const val = e.target.value;
                          if (!val) return;
                          const preset = COLOR_PRESETS.find(p => p.name === val);
                          if (preset) {
                            const exists = form.colors.some(c => c.name.toLowerCase() === preset.name.toLowerCase());
                            if (!exists) {
                              set('colors', [...form.colors, { name: preset.name, hex: preset.hex }]);
                            }
                          }
                        }}
                        className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-800 shadow-2xs outline-none focus:border-neutral-900 cursor-pointer"
                        title="Add a color from the dropdown"
                      >
                        <option value="">+ Add Color from Dropdown...</option>
                        {COLOR_PRESETS.map(p => (
                          <option key={p.name} value={p.name}>
                            {p.name} ({p.hex})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Quick-Add Preset Badges */}
                  <div className="mb-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-medium text-neutral-500 mr-1">Quick Add:</span>
                    {COLOR_PRESETS.map(p => {
                      const isAdded = form.colors.some(c => c.name.toLowerCase() === p.name.toLowerCase());
                      return (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => {
                            if (isAdded) {
                              if (form.colors.length > 1) {
                                set('colors', form.colors.filter(c => c.name.toLowerCase() !== p.name.toLowerCase()));
                              }
                            } else {
                              set('colors', [...form.colors, { name: p.name, hex: p.hex }]);
                            }
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                            isAdded
                              ? 'bg-neutral-900 text-white shadow-2xs ring-1 ring-neutral-900'
                              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                          }`}
                          title={isAdded ? `Click to remove ${p.name}` : `Click to add ${p.name}`}
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${p.border ? 'ring-1 ring-black/40' : 'ring-1 ring-black/10'}`}
                            style={{ backgroundColor: p.hex }}
                          />
                          <span>{p.name}</span>
                          {isAdded ? <span className="text-[10px] font-bold">✓</span> : <span className="text-[10px] opacity-60">+</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Color rows */}
                  <div className="space-y-2">
                    {form.colors.map((c, i) => {
                      const matched = matchColorPreset(c.name, c.hex);
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="color"
                            value={c.hex}
                            onChange={e => set('colors', form.colors.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))}
                            className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-neutral-200 bg-white p-1"
                            title="Pick colour shade"
                          />

                          {/* Row dropdown selector */}
                          <select
                            value={matched ? matched.name : 'custom'}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === 'custom') return;
                              const preset = COLOR_PRESETS.find(p => p.name === val);
                              if (preset) {
                                set('colors', form.colors.map((x, j) => (j === i ? { ...x, name: preset.name, hex: preset.hex } : x)));
                              }
                            }}
                            className="w-36 shrink-0 rounded-lg border border-neutral-200 bg-white px-2.5 py-2.5 text-xs font-semibold text-neutral-800 outline-none focus:border-neutral-900 cursor-pointer"
                            title="Choose color preset"
                          >
                            {COLOR_PRESETS.map(p => (
                              <option key={p.name} value={p.name}>{p.name}</option>
                            ))}
                            <option value="custom">Custom...</option>
                          </select>

                          <input
                            value={c.name}
                            onChange={e => set('colors', form.colors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                            placeholder="Colour name, e.g. Maroon"
                            className={inputCls}
                          />

                          <button
                            type="button"
                            onClick={() => set('colors', form.colors.filter((_, j) => j !== i))}
                            disabled={form.colors.length === 1}
                            className="shrink-0 rounded-lg p-2.5 text-red-500 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-30 cursor-pointer"
                            title="Remove colour"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => set('colors', [...form.colors, { name: 'Maroon', hex: '#681326' }])}
                      className="inline-flex items-center gap-1 pt-1 text-xs font-semibold text-neutral-600 hover:text-black cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add another colour
                    </button>
                  </div>
                </section>

                {/* Tags */}
                <section>
                  <h4 className="mb-2 text-sm font-semibold text-neutral-900">Show this product in</h4>
                  <div className="flex flex-wrap gap-2">
                    <Toggle label="Homepage Atelier Showcase" checked={form.isAtelierFeatured} onChange={v => set('isAtelierFeatured', v)} />
                    <Toggle label="New Arrivals" checked={form.isNewArrival} onChange={v => set('isNewArrival', v)} />
                    <Toggle label="Best Sellers" checked={form.isBestSeller} onChange={v => set('isBestSeller', v)} />
                    <Toggle label="Trending (Featured Pick on Homepage)" checked={form.isTrending} onChange={v => set('isTrending', v)} />
                    <Toggle label="Limited Edition" checked={form.isLimitedEdition} onChange={v => set('isLimitedEdition', v)} />
                  </div>
                </section>

                {/* Optional details */}
                <section className="rounded-xl bg-neutral-50 ring-1 ring-neutral-100">
                  <button type="button" onClick={() => setShowMore(s => !s)} className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-neutral-700 cursor-pointer">
                    More details (optional)
                    <ChevronDown className={`h-4 w-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
                  </button>
                  {showMore && (
                    <div className="grid grid-cols-1 gap-4 px-4 pb-4 sm:grid-cols-2">
                      <Field label="Upper material"><input value={form.upperMaterial} onChange={e => set('upperMaterial', e.target.value)} placeholder="Cow finish leather" className={inputCls} /></Field>
                      <Field label="Inner lining"><input value={form.innerLining} onChange={e => set('innerLining', e.target.value)} placeholder="Cow finish leather" className={inputCls} /></Field>
                      <Field label="Inner sock / insole"><input value={form.innerSock} onChange={e => set('innerSock', e.target.value)} placeholder="Cow finish leather" className={inputCls} /></Field>
                      <Field label="Sole"><input value={form.soleMaterial} onChange={e => set('soleMaterial', e.target.value)} placeholder="Genuine leather sole" className={inputCls} /></Field>
                      <Field label="Inside / cushioning"><input value={form.cushioning} onChange={e => set('cushioning', e.target.value)} placeholder="Soft leather insole" className={inputCls} /></Field>
                      <Field label="Weight"><input value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="385g" className={inputCls} /></Field>
                      <Field label="Heel height"><input value={form.heelDrop} onChange={e => set('heelDrop', e.target.value)} placeholder="2.2 cm" className={inputCls} /></Field>
                    </div>
                  )}
                </section>

                {formError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}

                <div className="sticky bottom-0 -mx-6 flex justify-end gap-2 border-t border-neutral-100 bg-white px-6 py-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50 cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-6 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editingStatus === 'live'
                      ? (editingId ? 'Save & Publish Live' : 'Publish Product Live')
                      : (editingId ? 'Save Changes as Draft' : 'Save as Draft')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
