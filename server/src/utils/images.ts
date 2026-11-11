import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

/**
 * On-the-fly image resizing for the shop: /_img?src=/images/shoe.png&w=480
 * - Only files inside client/public/images (no path traversal, no remote URLs → no SSRF)
 * - Returns WebP (or AVIF when asked with &f=avif and the browser accepts it)
 * - Results are cached on disk and in the browser, so each size is made once
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../../../client/public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const CACHE_DIR = path.resolve(process.env.QADAM_DATA_DIR || process.env.AURA_DATA_DIR || path.resolve(__dirname, '../../data'), 'img-cache');
const WIDTHS = [160, 240, 320, 400, 480, 640, 800, 960, 1200, 1600, 1920];
const inFlight = new Map<string, Promise<Buffer>>();

sharp.cache({ memory: 64, items: 100 });
sharp.concurrency(2);

const router = Router();

router.get('/', async (req, res) => {
  const src = String(req.query.src || '');
  const want = Number(req.query.w) || 640;
  const w = WIDTHS.find(x => x >= want) || WIDTHS[WIDTHS.length - 1];
  const q = Math.min(90, Math.max(50, Number(req.query.q) || 78));
  const accept = String(req.headers.accept || '');
  const fmt: 'avif' | 'webp' = req.query.f === 'avif' && accept.includes('image/avif') ? 'avif' : 'webp';

  // Safe path: must be a local file under /images
  let decoded: string;
  try { decoded = decodeURIComponent(src.split('?')[0]); } catch { return res.status(400).end(); }
  if (!decoded.startsWith('/images/') || decoded.includes('\0')) return res.status(400).json({ success: false, message: 'Invalid image.' });
  const file = path.resolve(PUBLIC_DIR, '.' + decoded);
  if (!file.startsWith(IMAGES_DIR + path.sep)) return res.status(400).json({ success: false, message: 'Invalid image.' });
  if (!/\.(png|jpe?g|webp|gif)$/i.test(file)) return res.redirect(302, decoded); // e.g. SVG: send as is

  let stat: fs.Stats;
  try { stat = fs.statSync(file); } catch { return res.status(404).end(); }

  const key = crypto.createHash('sha1').update(`${file}|${stat.mtimeMs}|${stat.size}|${w}|${q}|${fmt}`).digest('hex');
  const etag = `"${key.slice(0, 20)}"`;
  res.setHeader('Vary', 'Accept');
  res.setHeader('Cache-Control', 'public, max-age=2592000, stale-while-revalidate=86400');
  res.setHeader('ETag', etag);
  if (req.headers['if-none-match'] === etag) return res.status(304).end();

  const cached = path.join(CACHE_DIR, `${key}.${fmt}`);
  try {
    if (fs.existsSync(cached)) {
      res.type(fmt);
      return fs.createReadStream(cached).pipe(res);
    }
    let job = inFlight.get(key);
    if (!job) {
      job = sharp(file, { limitInputPixels: 60_000_000 })
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        [fmt]({ quality: q, effort: fmt === 'avif' ? 3 : 4 })
        .toBuffer();
      inFlight.set(key, job);
    }
    const buf = await job.finally(() => inFlight.delete(key));
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFile(cached, buf, () => {});
    res.type(fmt).send(buf);
  } catch (e: any) {
    console.warn('[images] resize failed, sending original:', decoded, e.message);
    res.redirect(302, decoded);
  }
});

export default router;
