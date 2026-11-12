import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { protect, adminOnly } from '../middleware/auth.js';
import { securityEvent, rateLimit } from '../security/index.js';
import { isMongoConnected } from '../config/db.js';
import { UploadedImage } from '../models/UploadedImage.js';
import sharp from 'sharp';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Fallback local disk directory when MongoDB is not connected
const UPLOAD_DIR = path.resolve(__dirname, '../../../client/public/images/uploads');

const ALLOWED: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const EXT_TO_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

function setImageCacheHeaders(req: Request, res: Response, fileName: string, contentType: string): boolean {
  const etag = `"${fileName}"`;
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('ETag', etag);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.headers['if-none-match'] === etag) {
    res.status(304).end();
    return true;
  }
  return false;
}

// GET /api/uploads/:fileName — serve uploaded images from MongoDB (or local disk fallback)
router.get('/:fileName', async (req, res) => {
  const rawName = req.params.fileName;
  const fileName = Array.isArray(rawName) ? rawName[0] : rawName;
  if (!fileName || fileName === '.' || fileName === '..' || !/^[a-zA-Z0-9._-]+$/.test(fileName)) {
    return res.status(400).json({ success: false, message: 'Invalid file name.' });
  }

  try {
    if (isMongoConnected) {
      const doc = await UploadedImage.findOne({ fileName }).select('contentType data');
      if (doc?.data) {
        if (setImageCacheHeaders(req, res, fileName, doc.contentType)) return;
        return res.send(doc.data);
      }
    }

    const diskPath = path.join(UPLOAD_DIR, fileName);
    if (fs.existsSync(diskPath)) {
      const ext = path.extname(fileName).slice(1).toLowerCase();
      const mime = EXT_TO_MIME[ext] || 'application/octet-stream';
      if (setImageCacheHeaders(req, res, fileName, mime)) return;
      return res.sendFile(diskPath);
    }

    return res.status(404).json({ success: false, message: 'Image not found.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to load image.' });
  }
});

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
    const fileName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    if (isMongoConnected) {
      await UploadedImage.create({
        fileName,
        contentType: mime,
        data: buffer,
        size: buffer.length,
      });
    } else {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      fs.writeFileSync(path.join(UPLOAD_DIR, fileName), buffer);
    }
    res.json({ success: true, data: { url: `/api/uploads/${fileName}` } });
  } catch (err: any) {
    const msg =
      err?.code === 'EROFS'
        ? 'Server storage requires an active database connection.'
        : err?.message || 'Upload failed.';
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
