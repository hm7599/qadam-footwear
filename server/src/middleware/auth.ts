import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DataStore } from '../config/store.js';
import { Collection } from '../config/collection.js';
import { securityEvent, IS_PROD } from '../security/index.js';

export interface AuthenticatedRequest extends Request {
  user?: any;
  tokenInfo?: { jti: string; exp: number; iat: number };
}

// ── Signing secret ─────────────────────────────────────
// Old builds shipped this value in the source code — it must never be accepted.
const KNOWN_LEAKED = new Set(['aura_super_luxury_jwt_secret_2026']);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadSecret(): string {
  const env = process.env.JWT_SECRET || '';
  if (env.length >= 32 && !KNOWN_LEAKED.has(env)) return env;
  if (IS_PROD) {
    throw new Error('JWT_SECRET is missing, too short (< 32 chars) or a known leaked value. Set a long random JWT_SECRET before starting in production.');
  }
  // Development: create a random secret once and keep it in data/ (not in the code)
  const file = path.resolve(process.env.QADAM_DATA_DIR || process.env.AURA_DATA_DIR || path.resolve(__dirname, '../../data'), 'jwt-secret.txt');
  try {
    const saved = fs.readFileSync(file, 'utf-8').trim();
    if (saved.length >= 32) return saved;
  } catch { /* create below */ }
  const fresh = crypto.randomBytes(48).toString('base64url');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, fresh, { mode: 0o600 });
  console.warn('⚠️  [auth] JWT_SECRET was weak or missing — generated a random development secret in data/jwt-secret.txt');
  return fresh;
}
const JWT_SECRET = loadSecret();

// Admin sessions are short; customers stay signed in longer
const ADMIN_TTL = process.env.ADMIN_SESSION_HOURS ? `${Number(process.env.ADMIN_SESSION_HOURS)}h` : '12h';
const CUSTOMER_TTL = '7d';

// Revoked tokens (logout). Entries are kept only until the token would have expired anyway.
const Revoked = new Collection<{ id: string; exp: number }>('RevokedToken', { exp: Number });

export function generateToken(user: any): string {
  return jwt.sign(
    { id: String(user._id || user.id), email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: user.role === 'admin' ? ADMIN_TTL : CUSTOMER_TTL, jwtid: crypto.randomBytes(12).toString('hex'), algorithm: 'HS256' } as jwt.SignOptions
  );
}

export async function revokeToken(jti: string, exp: number) {
  if (!jti) return;
  if (!(await Revoked.get(jti))) await Revoked.insert({ id: jti, exp });
  // forget expired entries
  const now = Math.floor(Date.now() / 1000);
  for (const r of await Revoked.find(r => r.exp < now)) await Revoked.remove(r.id);
}

function readToken(req: Request) {
  const h = req.headers.authorization;
  return h && h.startsWith('Bearer ') ? h.slice(7) : undefined;
}

async function verify(token: string) {
  const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as any;
  if (decoded.jti && (await Revoked.get(decoded.jti))) throw new Error('revoked');
  // Role always comes from the stored user, never from the token
  const user = await DataStore.findUserByEmail(decoded.email);
  if (!user) throw new Error('no user');
  return { user, info: { jti: decoded.jti, exp: decoded.exp, iat: decoded.iat } };
}

export async function protect(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ success: false, message: 'Please sign in.' });
  try {
    const { user, info } = await verify(token);
    req.user = user;
    req.tokenInfo = info;
    next();
  } catch {
    securityEvent('invalid_token', req, req.originalUrl.split('?')[0]);
    return res.status(401).json({ success: false, message: 'Your session has expired. Please sign in again.' });
  }
}

/** Like protect, but continues as a guest when there is no (valid) token */
export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const token = readToken(req);
  if (token) {
    try { const { user, info } = await verify(token); req.user = user; req.tokenInfo = info; } catch { /* guest */ }
  }
  next();
}

export function adminOnly(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user && req.user.role === 'admin') return next();
  securityEvent('forbidden_admin', req, req.originalUrl.split('?')[0], req.user?.email || '');
  return res.status(403).json({ success: false, message: 'Admin privileges required for this action.' });
}

export const isAdmin = (req: AuthenticatedRequest) => req.user?.role === 'admin';

/** Used by the live-analytics socket: resolves a token to an admin user or null */
export async function verifyAdminToken(token: string) {
  try {
    const { user } = await verify(token);
    return user?.role === 'admin' ? user : null;
  } catch {
    return null;
  }
}
