import { Request, Response, NextFunction } from 'express';
import { Collection } from '../config/collection.js';

export const IS_PROD = process.env.NODE_ENV === 'production';

// ── Logs ──────────────────────────────────────────────
// Security events (failed logins, blocked requests, rate limits…) and admin audit trail.
// Never store passwords, tokens or full request bodies here.
export const SecurityEvents = new Collection<{ id: string; at: string; type: string; ip: string; detail: string; user: string }>(
  'SecurityEvent', { type: String, at: String }, [[{ at: -1 }]]);
export const AdminAudit = new Collection<{ id: string; at: string; user: string; method: string; path: string; status: number; ip: string }>(
  'AdminAuditLog', { user: String, at: String }, [[{ at: -1 }]]);

const MAX_LOG = 5000;
let eventCount = 0;
export function securityEvent(type: string, req: Request | null, detail = '', user = '') {
  const ip = req ? clientIp(req) : '';
  console.warn(`[security] ${type} ip=${ip}${user ? ` user=${user}` : ''}${detail ? ` ${detail}` : ''}`);
  SecurityEvents.insert({ at: new Date().toISOString(), type, ip, detail: detail.slice(0, 200), user }).catch(() => {});
  // keep the log file small
  if (++eventCount % 200 === 0) trim(SecurityEvents);
}
async function trim(col: Collection<any>) {
  const all = await col.all();
  if (all.length <= MAX_LOG) return;
  for (const e of all.sort((a, b) => a.at.localeCompare(b.at)).slice(0, all.length - MAX_LOG)) await col.remove(e.id);
}

export const clientIp = (req: Request) => String(req.ip || req.socket?.remoteAddress || '').replace('::ffff:', '');

// ── Security headers ──────────────────────────────────
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' ws: wss:",
  "media-src 'self' blob:",
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', req.path.startsWith('/api/') ? "default-src 'none'; frame-ancestors 'none'" : CSP);
  if (IS_PROD) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
}

/** Behind a proxy in production, send plain-HTTP visitors to HTTPS */
export function forceHttps(req: Request, res: Response, next: NextFunction) {
  if (IS_PROD && process.env.FORCE_HTTPS !== 'false' && req.headers['x-forwarded-proto'] === 'http') {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }
  next();
}

// ── Input clean-up (NoSQL operator injection / prototype pollution) ──
// '$' keys are database operators. Dotted keys are only dangerous at the top level (they address nested
// fields in an update), so nested ones like sizeStock['7.5'] are kept.
const BAD_KEY = (k: string, depth = 1) =>
  k.startsWith('$') || (depth === 0 && k.includes('.')) || k === '__proto__' || k === 'constructor' || k === 'prototype';
function clean(v: any, depth = 0): any {
  if (depth > 12 || v === null || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.slice(0, 1000).map(x => clean(x, depth + 1));
  const out: any = {};
  for (const k of Object.keys(v)) if (!BAD_KEY(k, depth)) out[k] = clean(v[k], depth + 1);
  return out;
}
export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') req.body = clean(req.body);
  // Query values must be plain strings (blocks ?category[$ne]=x)
  const q: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.query || {})) {
    if (BAD_KEY(k, 0)) continue;
    const s = Array.isArray(v) ? v[0] : v;
    if (typeof s === 'string') q[k] = s.slice(0, 200);
  }
  Object.defineProperty(req, 'query', { value: q, writable: true, configurable: true });
  next();
}

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── Rate limiting (in-memory, per IP + key) ───────────
const buckets = new Map<string, number[]>();
setInterval(() => {
  const now = Date.now();
  for (const [k, list] of buckets) if (!list.length || now - list[list.length - 1] > 3600000) buckets.delete(k);
}, 600000).unref();

export function rateLimit(name: string, max: number, windowMs: number, keyFn?: (req: Request) => string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${name}:${clientIp(req)}:${keyFn ? keyFn(req) : ''}`;
    const now = Date.now();
    const list = (buckets.get(key) || []).filter(t => now - t < windowMs);
    list.push(now);
    buckets.set(key, list);
    if (list.length > max) {
      if (list.length === max + 1) securityEvent('rate_limit', req, name);
      res.setHeader('Retry-After', String(Math.ceil(windowMs / 1000)));
      return res.status(429).json({ success: false, message: 'Too many requests. Please wait a little and try again.' });
    }
    next();
  };
}

// ── Production: never show internal error text to visitors ──
export function hideServerErrors(_req: Request, res: Response, next: NextFunction) {
  if (!IS_PROD) return next();
  const json = res.json.bind(res);
  res.json = (body: any) => {
    if (res.statusCode >= 500 && body && typeof body === 'object' && !body.expose) {
      console.error('[server error]', body.message);
      body = { success: false, message: 'Something went wrong on our side. Please try again.' };
    } else if (body && typeof body === 'object' && 'expose' in body) {
      const { expose, ...rest } = body; body = rest;
    }
    return json(body);
  };
  next();
}

/** Final error handler (bad JSON, body too large, unexpected crashes) */
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  if (err?.type === 'entity.too.large') return res.status(413).json({ success: false, message: 'Request is too large.' });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ success: false, message: 'Invalid JSON.' });
  if (err?.message === 'Not allowed by CORS') { securityEvent('cors_blocked', req, String(req.headers.origin || '')); return res.status(403).json({ success: false, message: 'Origin not allowed.' }); }
  console.error('[unhandled]', err);
  res.status(500).json({ success: false, message: IS_PROD ? 'Something went wrong on our side.' : String(err?.message || err) });
}

/** Records every admin write (who, what, when) */
export function adminAudit(req: any, res: Response, next: NextFunction) {
  if (req.method === 'GET') return next();
  res.on('finish', () => {
    const user = req.user?.email;
    if (!user || req.user?.role !== 'admin') return;
    AdminAudit.insert({ at: new Date().toISOString(), user, method: req.method, path: req.originalUrl.split('?')[0].slice(0, 200), status: res.statusCode, ip: clientIp(req) }).catch(() => {});
  });
  next();
}
