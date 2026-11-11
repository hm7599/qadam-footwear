import './env.js';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, isMongoConnected } from './config/db.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import settingsRoutes from './routes/settings.js';
import uploadRoutes from './routes/uploads.js';
import adminPushRoutes from './routes/adminPush.js';
import marketingRoutes from './routes/marketing.js';
import securityRoutes from './routes/security.js';
import liveRoutes from './routes/live.js';
import imageRoutes from './utils/images.js';
import seoRoutes from './routes/seo.js';
import backupRoutes from './routes/backup.js';
import chatRoutes from './routes/chat.js';
import { startBackupJob } from './backup/backup.js';
import { startRecoveryJob } from './marketing/recovery.js';
import { attachLiveSocket, startLiveAnalytics } from './analytics/live.js';
import {
  IS_PROD, securityHeaders, forceHttps, sanitizeInput, hideServerErrors, errorHandler, adminAudit, rateLimit, securityEvent,
} from './security/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5050;

// ── Hardening ─────────────────────────────────────────
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY : 'loopback');
app.use(forceHttps);
app.use(securityHeaders);
app.use(compression({ threshold: 1024 }));

// CORS: only our own site(s). In development the Vite dev server is allowed too.
const allowed = new Set(
  (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean)
    .concat(IS_PROD ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173', `http://localhost:${PORT}`])
);
// Same-origin requests (our own pages, scripts, styles) are always fine.
// Other origins may only call the API if listed in ALLOWED_ORIGINS.
const sameOrigin = (req: express.Request, origin: string) => {
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol).split(',')[0];
  return origin === `${proto}://${req.headers.host}`;
};
app.use('/api', cors((req, cb) => {
  const origin = String(req.headers.origin || '');
  const devLocal = !IS_PROD && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
  if (!origin || devLocal || allowed.has(origin) || sameOrigin(req as express.Request, origin)) {
    return cb(null, { origin: !!origin, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], maxAge: 600 });
  }
  cb(new Error('Not allowed by CORS'));
}));

// Small bodies everywhere; only image upload and bulk product import may send more
app.use(['/api/uploads', '/api/products/bulk'], express.json({ limit: '12mb' }));
app.use('/api/live/hit', express.text({ limit: '4kb', type: 'text/plain' })); // navigator.sendBeacon
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(sanitizeInput);
app.use(hideServerErrors);
app.use('/api', adminAudit);
app.use('/api', rateLimit('api', 600, 60000)); // generous global ceiling per IP

// Slow-request guard
app.use((req, res, next) => {
  res.setTimeout(30000, () => { if (!res.headersSent) res.status(503).json({ success: false, message: 'Request timed out.' }); });
  next();
});

// Production: never take orders or accounts that can't be saved permanently
app.use('/api', (req, res, next) => {
  if (!IS_PROD || isMongoConnected || req.method === 'GET') return next();
  if (req.path.startsWith('/live/')) return next(); // analytics can be dropped safely
  securityEvent('db_unavailable_write_blocked', req, req.path);
  return res.status(503).json({ success: false, expose: true, message: 'Our store is temporarily unavailable. Please try again in a few minutes — nothing was charged or saved.' });
});

// ── Static files with sensible caching ────────────────
const clientPublicPath = path.resolve(__dirname, '../../client/public');
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use('/_img', imageRoutes);
app.use(seoRoutes); // /robots.txt, /sitemap.xml
// Hashed build files never change → cache for a year
app.use('/assets', express.static(path.join(clientDistPath, 'assets'), { immutable: true, maxAge: '365d', index: false }));
const staticOpts = {
  index: false,
  dotfiles: 'deny' as const,
  setHeaders: (res: express.Response, file: string) => {
    // Files that announce a new version must never be cached
    if (/[\\/](sw\.js|version\.json|boot\.js|sw-register\.js|fonts\.js|manifest[^\\/]*\.json|index\.html)$/.test(file)) res.setHeader('Cache-Control', 'no-cache');
    else if (/[\\/]images[\\/]/.test(file)) res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
    else res.setHeader('Cache-Control', 'public, max-age=86400');
  },
};
app.use(express.static(clientDistPath, staticOpts));
app.use(express.static(clientPublicPath, staticOpts));

// ── API ───────────────────────────────────────────────
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin-push', adminPushRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/backups', backupRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ status: isMongoConnected ? 'healthy' : (IS_PROD ? 'degraded' : 'healthy'), mongoConnected: isMongoConnected, timestamp: new Date().toISOString() });
});

// Unknown API routes → JSON 404 (not the HTML app)
app.use('/api', (_req, res) => res.status(404).json({ success: false, message: 'Not found.' }));

// SPA fallback: any non-API page (e.g. /admin, /shop, /product/x) serves the React app
app.get(/^\/(?!api\/).*/, (req, res, next) => {
  if (path.extname(req.path)) return next(); // real missing files should 404
  res.set('Cache-Control', 'no-cache');
  res.sendFile(path.join(clientDistPath, 'index.html'), err => { if (err) next(); });
});

app.use(errorHandler);

// ── Start ─────────────────────────────────────────────
async function startServer() {
  await connectDB();
  if (IS_PROD && !isMongoConnected) {
    console.error('❌ [QADAM Server] MongoDB is not connected. In production, orders and accounts will be refused until the database is back.');
  }
  startRecoveryJob();
  startBackupJob();
  const server = http.createServer(app);
  server.headersTimeout = 20000;
  server.requestTimeout = 30000;
  attachLiveSocket(server, allowed);
  startLiveAnalytics();
  server.listen(PORT, () => {
    console.log(`✨ [QADAM Server] Live and running on http://localhost:${PORT} (${IS_PROD ? 'production' : 'development'})`);
  });
}

startServer();
