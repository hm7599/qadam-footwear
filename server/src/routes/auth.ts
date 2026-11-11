import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { DataStore } from '../config/store.js';
import { generateToken, protect, revokeToken, AuthenticatedRequest } from '../middleware/auth.js';
import { rateLimit, securityEvent, clientIp } from '../security/index.js';

const router = Router();

// A real bcrypt hash used to spend the same time when the email does not exist (no account enumeration by timing)
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password-' + Date.now(), 12);

// ── Brute-force protection: lock an account+IP after repeated failures ──
const fails = new Map<string, { count: number; until: number; first: number }>();
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60000;
const failKey = (email: string, ip: string) => `${email}|${ip}`;
const accountFails = new Map<string, { count: number; first: number }>(); // across IPs (credential stuffing)

function lockedFor(email: string, ip: string) {
  const f = fails.get(failKey(email, ip));
  if (f && f.until > Date.now()) return Math.ceil((f.until - Date.now()) / 60000);
  const a = accountFails.get(email);
  if (a && a.count >= 20 && Date.now() - a.first < 3600000) return 15;
  return 0;
}
function recordFail(email: string, ip: string) {
  const k = failKey(email, ip);
  const now = Date.now();
  const f = fails.get(k);
  const next = f && now - f.first < LOCK_MS ? { ...f, count: f.count + 1 } : { count: 1, until: 0, first: now };
  if (next.count >= MAX_FAILS) next.until = now + LOCK_MS;
  fails.set(k, next);
  const a = accountFails.get(email);
  accountFails.set(email, a && now - a.first < 3600000 ? { ...a, count: a.count + 1 } : { count: 1, first: now });
  return next.count;
}
function clearFails(email: string, ip: string) { fails.delete(failKey(email, ip)); }

const userOut = (u: any) => {
  const { passwordHash, __v, ...rest } = u?.toObject ? u.toObject() : u;
  return rest;
};

export const passwordProblem = (p: string) => {
  if (typeof p !== 'string' || p.length < 8) return 'Password must be at least 8 characters.';
  if (p.length > 128) return 'Password is too long.';
  if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return 'Password must contain letters and numbers.';
  if (/^(password|12345678|aura1234|qadam1234|qwerty12)/i.test(p)) return 'Please choose a less common password.';
  return '';
};

// POST Register
router.post('/register', rateLimit('register', 5, 60 * 60000), async (req, res) => {
  try {
    const { name, email, password, phone, shippingAddress } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!name || !cleanEmail || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 120) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }
    const pw = passwordProblem(password);
    if (pw) return res.status(400).json({ success: false, message: pw });

    if (await DataStore.findUserByEmail(cleanEmail)) {
      // Same answer shape as a normal failure; does not confirm more than "can't register this email"
      return res.status(400).json({ success: false, message: 'We could not create an account with this email. Try signing in instead.' });
    }

    const newUser = await DataStore.createUser({
      name: String(name).slice(0, 80),
      email: cleanEmail,
      password,
      role: 'customer', // never taken from the request
      phone: phone ? String(phone).slice(0, 30) : undefined,
      shippingAddress: shippingAddress && typeof shippingAddress === 'object' ? {
        address: String(shippingAddress.address || '').slice(0, 200), apartment: String(shippingAddress.apartment || '').slice(0, 100),
        city: String(shippingAddress.city || '').slice(0, 60), state: String(shippingAddress.state || '').slice(0, 60),
        postalCode: String(shippingAddress.postalCode || '').slice(0, 20), country: String(shippingAddress.country || '').slice(0, 60),
      } : undefined,
    });

    res.status(201).json({ success: true, message: 'Account registered successfully.', token: generateToken(newUser), user: userOut(newUser) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST Login
router.post('/login', rateLimit('login', 30, 15 * 60000), async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    // The admin portal signs in with the short username "admin".
    const rawEmail = email.trim().toLowerCase();
    const id = rawEmail === 'admin' || rawEmail === 'admin@aurashoes.com' ? 'admin@qadamshoes.com' : rawEmail;
    const ip = clientIp(req);

    const wait = lockedFor(id, ip);
    if (wait) {
      securityEvent('login_locked', req, '', id);
      return res.status(429).json({ success: false, message: `Too many failed attempts. Try again in ${wait} minute(s).` });
    }

    const user: any = (await DataStore.findUserByEmail(id))
      || (id === 'admin@qadamshoes.com' ? await DataStore.findUserByEmail('admin@aurashoes.com') : null);
    const ok = await bcrypt.compare(password.slice(0, 128), user?.passwordHash || DUMMY_HASH);
    if (!user || !ok) {
      const n = recordFail(id, ip);
      securityEvent(user?.role === 'admin' ? 'admin_login_failed' : 'login_failed', req, `attempt ${n}`, id);
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    clearFails(id, ip);
    if (user.role === 'admin') securityEvent('admin_login', req, '', id);

    res.json({ success: true, message: 'Logged in successfully.', token: generateToken(user), user: userOut(user) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST Logout — the token stops working immediately
router.post('/logout', protect, async (req: AuthenticatedRequest, res) => {
  await revokeToken(req.tokenInfo?.jti || '', req.tokenInfo?.exp || 0);
  res.json({ success: true, message: 'Signed out.' });
});

// GET Me
router.get('/me', protect, async (req: AuthenticatedRequest, res) => {
  res.json({ success: true, user: userOut(req.user) });
});

export default router;
