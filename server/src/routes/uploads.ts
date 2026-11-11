import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { protect, adminOnly } from '../middleware/auth.js';
import { securityEvent, rateLimit } from '../security/index.js';
import sharp from 'sharp';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Files go into client/public/images/uploads, which the server already serves statically
const UPLOAD_DIR = path.resolve(__dirname, '../../../client/public/images/uploads');

const ALLOWED: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// POST /api/uploads  body: { data: "data:image/png;base64,...." }
router.post('/', rateLimit('upload', 60, 10 * 60000), protect, adminOnly, async (req, res) => {
  const dataUrl = req.body?.data;
  if (typeof dataUrl !== 'string') {
    return res.status(400).json({ success: false, message: 'No image received.' });
  }

  const match = /^data:(image\/[a-z]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) return res.status(400).json({ success: false, message: 'Invalid image data.' });

  const mime = match[1].toLowerCase();
  const ext = ALLOWED[mime];
  if (!ext) return res.status(400).json({ success: false, message: 'Only PNG, JPG, WEBP or GIF images are allowed.' });

  const buffer = Buffer.from(match[2], 'base64');
  // Check the real file content, not just the label the browser sent
  const sig = buffer.subarray(0, 12);
  const real =
    sig[0] === 0x89 && sig.toString('ascii', 1, 4) === 'PNG' ? 'png' :
    sig[0] === 0xff && sig[1] === 0xd8 && sig[2] === 0xff ? 'jpg' :
    sig.toString('ascii', 0, 4) === 'RIFF' && sig.toString('ascii', 8, 12) === 'WEBP' ? 'webp' :
    sig.toString('ascii', 0, 4) === 'GIF8' ? 'gif' : '';
  if (!real || real !== ext) {
    securityEvent('upload_rejected', req, 'content does not match type ' + mime);
    return res.status(400).json({ success: false, message: 'This file is not a valid PNG, JPG, WEBP or GIF image.' });
  }
  if (buffer.length > MAX_BYTES) {
    return res.status(400).json({ success: false, message: 'Image is too large (max 5 MB).' });
  }

  // Limit dimensions (protects against decompression bombs)
  try {
    const meta = await sharp(buffer, { limitInputPixels: 50_000_000 }).metadata();
    if (!meta.width || !meta.height || meta.width > 8000 || meta.height > 8000) {
      return res.status(400).json({ success: false, message: 'Image must be at most 8000 × 8000 pixels.' });
    }
  } catch {
    return res.status(400).json({ success: false, message: 'This image could not be read.' });
  }

  try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const fileName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, fileName), buffer);
    res.json({ success: true, data: { url: `/images/uploads/${fileName}` } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Upload failed.' });
  }
});

export default router;
