import { Router } from 'express';
import { DataStore } from '../config/store.js';

// Search-engine files, generated from the live catalogue
const router = Router();
const base = (req: any) => (process.env.SITE_URL || `${String(req.headers['x-forwarded-proto'] || req.protocol).split(',')[0]}://${req.headers.host}`).replace(/\/$/, '');
const esc = (s: string) => s.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string));

router.get('/robots.txt', (req, res) => {
  res.type('text/plain').set('Cache-Control', 'public, max-age=86400').send(
    ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /api/', 'Disallow: /cart', 'Disallow: /checkout', 'Disallow: /account', 'Disallow: /orders', 'Disallow: /recover-cart/', 'Disallow: /_img', '', `Sitemap: ${base(req)}/sitemap.xml`, ''].join('\n'));
});

router.get('/sitemap.xml', async (req, res) => {
  const b = base(req);
  const products: any[] = await DataStore.getProducts({});
  const pages = ['/', '/shop', '/new-arrivals', '/best-sellers', '/mens', '/size-guide', '/contact', '/privacy', '/terms'];
  const urls = [
    ...pages.map(p => `<url><loc>${esc(b + p)}</loc><changefreq>${p === '/' || p === '/shop' ? 'daily' : 'monthly'}</changefreq></url>`),
    ...products.map(p => {
      const mod = p.updatedAt || p.createdAt;
      const img = p.images?.[0] ? `<image:image><image:loc>${esc(new URL(p.images[0], b).href)}</image:loc></image:image>` : '';
      return `<url><loc>${esc(`${b}/product/${encodeURIComponent(p.slug)}`)}</loc>${mod ? `<lastmod>${new Date(mod).toISOString().slice(0, 10)}</lastmod>` : ''}<changefreq>weekly</changefreq>${img}</url>`;
    }),
  ];
  res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`);
});

export default router;
