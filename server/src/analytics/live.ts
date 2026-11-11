import crypto from 'crypto';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import { Collection } from '../config/collection.js';
import { SettingsStore } from '../config/settingsStore.js';
import { verifyAdminToken } from '../middleware/auth.js';

/**
 * Real-time visitors.
 * - Storefront sends small "hits" (page view / heartbeat / cart / checkout / leave).
 * - Live sessions are kept in memory; a session ends after `sessionTimeoutSec` without a heartbeat.
 * - Daily totals are aggregated in memory and written once a minute (batched) to AnalyticsDaily.
 * - Admins receive a snapshot over Socket.IO every 5 seconds.
 * No names, emails, phones, IP addresses or form inputs are stored. Visitor ids are random and hashed.
 */

export interface AnalyticsSettings { enabled: boolean; sessionTimeoutSec: number; retentionDays: number }
const DEFAULTS: AnalyticsSettings = { enabled: true, sessionTimeoutSec: 60, retentionDays: 365 };
export async function getAnalyticsSettings(): Promise<AnalyticsSettings> {
  const s = (await SettingsStore.get('analytics')) || {};
  return { ...DEFAULTS, ...s };
}
let settings: AnalyticsSettings = DEFAULTS;
export const refreshSettings = async () => { settings = await getAnalyticsSettings(); };

interface DayDoc {
  id: string;                       // YYYY-MM-DD
  pageviews: number;
  sessions: number;
  visitors: string[];               // hashed visitor ids (unique count)
  newVisitors: number;
  returningVisitors: number;
  totalDurationSec: number;
  endedSessions: number;
  hours: number[];                  // page views per hour
  products: Record<string, { name: string; views: number }>;
  categories: Record<string, number>;
  pages: Record<string, number>;
  sources: Record<string, number>;
  devices: Record<string, number>;
  countries: Record<string, number>;
  regions: Record<string, number>;
  cartAdds: number;
  checkouts: number;
}
export const AnalyticsDaily = new Collection<DayDoc>('AnalyticsDaily', {}, []);

interface LiveSession {
  sid: string;
  vid: string;                      // hashed
  tabs: Map<string, number>;        // tabId -> last seen
  startedAt: number;
  lastSeen: number;
  path: string;
  pageType: string;
  product: { slug: string; name: string } | null;
  category: string;
  cartCount: number;
  inCheckout: boolean;
  device: string;
  browser: string;
  source: string;
  country: string;
  region: string;
  isNew: boolean;
  pageviews: number;
}

const live = new Map<string, LiveSession>();
const feed: Array<{ at: number; sid: string; type: string; text: string; path: string; device: string; country: string }> = [];
let today: DayDoc | null = null;
let dirty = false;

const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);
const blankDay = (id: string): DayDoc => ({
  id, pageviews: 0, sessions: 0, visitors: [], newVisitors: 0, returningVisitors: 0, totalDurationSec: 0, endedSessions: 0,
  hours: Array(24).fill(0), products: {}, categories: {}, pages: {}, sources: {}, devices: {}, countries: {}, regions: {}, cartAdds: 0, checkouts: 0,
});
const bump = (o: Record<string, number>, k: string, n = 1) => { if (k) o[k] = (o[k] || 0) + n; };

async function day(): Promise<DayDoc> {
  const id = dayKey();
  if (today && today.id === id) return today;
  if (today && dirty) await flush();
  today = (await AnalyticsDaily.get(id)) || blankDay(id);
  return today;
}

export async function flush() {
  if (!today || !dirty) return;
  dirty = false;
  const exists = await AnalyticsDaily.get(today.id);
  if (exists) await AnalyticsDaily.update(today.id, today);
  else await AnalyticsDaily.insert(today);
}

// ── Helpers ───────────────────────────────────────────
const hash = (s: string) => crypto.createHash('sha256').update('qadam-v1:' + s).digest('hex').slice(0, 24);
const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

function parseUA(ua: string) {
  const device = /iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua) ? 'Tablet' : /Mobi|Android|iPhone|iPod/i.test(ua) ? 'Mobile' : 'Desktop';
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Other';
  return { device, browser };
}

function sourceOf(ref: string, utm: string, host: string) {
  if (utm) return utm.toLowerCase().slice(0, 30);
  if (!ref) return 'Direct';
  let h = '';
  try { h = new URL(ref).hostname.replace(/^www\./, ''); } catch { return 'Direct'; }
  if (!h || h === host) return 'Direct';
  if (/google\.|bing\.|yahoo\.|duckduckgo\./.test(h)) return 'Search';
  if (/facebook\.|fb\.|instagram\.|tiktok\.|twitter\.|x\.com|t\.co|pinterest\.|youtube\./.test(h)) return 'Social';
  if (/whatsapp|wa\.me/.test(h)) return 'WhatsApp';
  return h.slice(0, 40);
}

// Country from a trusted proxy header if present (e.g. Cloudflare), otherwise from the browser time zone.
const TZ_COUNTRY: Record<string, string> = {
  'Asia/Karachi': 'Pakistan', 'Asia/Kolkata': 'India', 'Asia/Calcutta': 'India', 'Asia/Dubai': 'UAE', 'Asia/Riyadh': 'Saudi Arabia',
  'Asia/Qatar': 'Qatar', 'Asia/Kuwait': 'Kuwait', 'Asia/Muscat': 'Oman', 'Asia/Bahrain': 'Bahrain', 'Asia/Dhaka': 'Bangladesh',
  'Asia/Kabul': 'Afghanistan', 'Asia/Tehran': 'Iran', 'Europe/London': 'United Kingdom', 'Europe/Dublin': 'Ireland', 'Europe/Paris': 'France',
  'Europe/Berlin': 'Germany', 'Europe/Rome': 'Italy', 'Europe/Madrid': 'Spain', 'Europe/Amsterdam': 'Netherlands', 'Europe/Istanbul': 'Turkey',
  'America/New_York': 'United States', 'America/Chicago': 'United States', 'America/Denver': 'United States', 'America/Los_Angeles': 'United States',
  'America/Toronto': 'Canada', 'America/Vancouver': 'Canada', 'Australia/Sydney': 'Australia', 'Australia/Melbourne': 'Australia',
  'Asia/Singapore': 'Singapore', 'Asia/Kuala_Lumpur': 'Malaysia', 'Asia/Shanghai': 'China', 'Asia/Tokyo': 'Japan', 'Africa/Johannesburg': 'South Africa',
};
const COUNTRY_CODES: Record<string, string> = { PK: 'Pakistan', IN: 'India', AE: 'UAE', SA: 'Saudi Arabia', GB: 'United Kingdom', US: 'United States', CA: 'Canada', AU: 'Australia', DE: 'Germany', QA: 'Qatar' };

let cachedLocalGeo: { city: string; region: string; country: string } | null = null;
let lastLocalGeoCheck = 0;

export async function resolveServerGeo(): Promise<{ city: string; region: string; country: string }> {
  if (cachedLocalGeo && Date.now() - lastLocalGeoCheck < 3600000) {
    return cachedLocalGeo;
  }
  try {
    const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false && data.city) {
        cachedLocalGeo = {
          city: String(data.city || 'Lahore'),
          region: String(data.region || 'Punjab'),
          country: String(data.country || 'Pakistan'),
        };
        lastLocalGeoCheck = Date.now();
        return cachedLocalGeo;
      }
    }
  } catch {}
  cachedLocalGeo = cachedLocalGeo || { city: 'Lahore', region: 'Punjab', country: 'Pakistan' };
  return cachedLocalGeo;
}

function geo(tz: string, headerCountry: string, headerCity?: string, clientCity?: string, clientCountry?: string) {
  let country = '';
  if (clientCountry && clientCountry.trim()) {
    country = clientCountry.trim();
  } else if (headerCountry && /^[A-Z]{2}$/i.test(headerCountry) && headerCountry.toUpperCase() !== 'XX') {
    country = COUNTRY_CODES[headerCountry.toUpperCase()] || headerCountry;
  } else if (tz && TZ_COUNTRY[tz]) {
    country = TZ_COUNTRY[tz];
  } else {
    country = tz ? 'Other' : 'Pakistan';
  }

  let region = '';
  if (clientCity && clientCity.trim()) {
    region = clientCity.trim();
  } else if (headerCity && headerCity.trim()) {
    try { region = decodeURIComponent(headerCity.trim()); } catch { region = headerCity.trim(); }
  } else if (tz === 'Asia/Karachi' || country === 'Pakistan') {
    // In Pakistan, standard browser timezone is universally 'Asia/Karachi'.
    // Never label everyone in Pakistan as "Karachi". Use the resolved city (e.g. Lahore).
    region = cachedLocalGeo?.city || 'Lahore';
  } else if (tz && tz.includes('/')) {
    region = tz.split('/').pop()!.replace(/_/g, ' ');
  }

  return { country: country || 'Pakistan', region: region || 'Lahore' };
}

function describe(s: LiveSession) {
  if (s.inCheckout) return 'In checkout';
  if (s.product) return `Viewing ${s.product.name}`;
  if (s.pageType === 'cart') return 'Looking at the bag';
  if (s.category) return `Browsing ${s.category}`;
  return `On ${s.path === '/' ? 'Home' : s.path}`;
}

function pushFeed(s: LiveSession, type: string, text: string) {
  feed.unshift({ at: Date.now(), sid: s.sid.slice(0, 6), type, text, path: s.path, device: s.device, country: s.country });
  if (feed.length > 60) feed.length = 60;
}

// ── Events from the storefront ─────────────────────────
export interface Hit {
  type: 'page' | 'ping' | 'cart' | 'checkout' | 'leave';
  vid: string; sid: string; tab: string;
  path?: string; title?: string; product?: { slug?: string; name?: string }; category?: string;
  cartCount?: number; ref?: string; utm?: string; tz?: string; isNew?: boolean;
  city?: string; region?: string; country?: string;
}

export async function recordHit(
  h: Hit,
  meta: { ua: string; host: string; countryHeader: string; cityHeader?: string }
) {
  if (!settings.enabled) return;
  if (!h || !ID_RE.test(h.vid) || !ID_RE.test(h.sid) || !ID_RE.test(h.tab)) throw new Error('bad ids');
  if (!['page', 'ping', 'cart', 'checkout', 'leave'].includes(h.type)) throw new Error('bad type');
  const path = String(h.path || '/').split('?')[0].slice(0, 120);
  if (path.startsWith('/admin')) return; // admin pages are never counted
  const now = Date.now();
  const d = await day();
  const vid = hash(h.vid);
  let s = live.get(h.sid);

  if (h.type === 'leave') {
    if (s) { s.tabs.delete(h.tab); if (!s.tabs.size) endSession(s, d); }
    return;
  }

  if (!s) {
    const { device, browser } = parseUA(meta.ua);
    const g = geo(
      String(h.tz || '').slice(0, 60),
      meta.countryHeader,
      meta.cityHeader,
      String(h.city || '').slice(0, 60),
      String(h.country || '').slice(0, 60)
    );
    s = {
      sid: h.sid, vid, tabs: new Map(), startedAt: now, lastSeen: now, path, pageType: '', product: null, category: '',
      cartCount: 0, inCheckout: false, device, browser, source: sourceOf(String(h.ref || ''), String(h.utm || ''), meta.host),
      country: g.country, region: g.region, isNew: !!h.isNew, pageviews: 0,
    };
    live.set(h.sid, s);
    d.sessions++;
    if (!d.visitors.includes(vid)) {
      d.visitors.push(vid);
      if (s.isNew) d.newVisitors++; else d.returningVisitors++;
    }
    bump(d.sources, s.source); bump(d.devices, s.device); bump(d.countries, s.country); bump(d.regions, s.region);
    pushFeed(s, 'start', `New visitor${s.source !== 'Direct' ? ` from ${s.source}` : ''}`);
  }
  s.tabs.set(h.tab, now);
  s.lastSeen = now;

  if (h.type === 'page') {
    s.path = path;
    s.pageType = path === '/' ? 'home' : path.split('/')[1] || 'page';
    s.product = h.product?.slug ? { slug: String(h.product.slug).slice(0, 80), name: String(h.product.name || h.product.slug).slice(0, 80) } : null;
    s.category = String(h.category || '').slice(0, 40);
    s.inCheckout = path.startsWith('/checkout');
    s.pageviews++;
    d.pageviews++;
    d.hours[new Date().getUTCHours()]++;
    bump(d.pages, path);
    if (s.product) {
      const p = d.products[s.product.slug] || (d.products[s.product.slug] = { name: s.product.name, views: 0 });
      p.views++;
      pushFeed(s, 'product', `Viewing ${s.product.name}`);
    } else if (s.category) {
      bump(d.categories, s.category);
      pushFeed(s, 'page', `Browsing ${s.category}`);
    } else {
      pushFeed(s, 'page', `Opened ${path === '/' ? 'Home' : path}`);
    }
  }
  if (h.type === 'cart') {
    const n = Math.max(0, Math.min(999, Number(h.cartCount) || 0));
    if (n > s.cartCount) { d.cartAdds++; pushFeed(s, 'cart', 'Added to bag'); }
    s.cartCount = n;
  }
  if (h.type === 'checkout' && !s.inCheckout) {
    s.inCheckout = true;
    d.checkouts++;
    pushFeed(s, 'checkout', 'Started checkout');
  }
  dirty = true;
}

function endSession(s: LiveSession, d: DayDoc) {
  live.delete(s.sid);
  d.totalDurationSec += Math.round((s.lastSeen - s.startedAt) / 1000);
  d.endedSessions++;
  dirty = true;
}

async function expire() {
  const d = await day();
  const cutoff = Date.now() - settings.sessionTimeoutSec * 1000;
  for (const s of live.values()) {
    for (const [tab, seen] of s.tabs) if (seen < cutoff) s.tabs.delete(tab);
    if (!s.tabs.size) endSession(s, d);
  }
}

// ── Snapshots & reports for the admin ─────────────────
export function snapshot() {
  const sessions = [...live.values()];
  const visitors = new Set(sessions.map(s => s.vid)).size;
  const count = (f: (s: LiveSession) => string) => {
    const m: Record<string, number> = {};
    sessions.forEach(s => bump(m, f(s)));
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ key: k, count: v }));
  };
  return {
    at: Date.now(),
    activeSessions: sessions.length,
    activeVisitors: visitors,
    inCheckout: sessions.filter(s => s.inCheckout).length,
    withCart: sessions.filter(s => s.cartCount > 0).length,
    sessions: sessions
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .slice(0, 100)
      .map(s => ({
        id: s.sid.slice(0, 8), activity: describe(s), path: s.path, product: s.product?.name || '', category: s.category,
        cartCount: s.cartCount, inCheckout: s.inCheckout, startedAt: s.startedAt, lastSeen: s.lastSeen, device: s.device,
        browser: s.browser, country: s.country, region: s.region, source: s.source, pageviews: s.pageviews, tabs: s.tabs.size, isNew: s.isNew,
      })),
    pages: count(s => s.path).slice(0, 10),
    products: count(s => s.product?.name || '').slice(0, 10),
    devices: count(s => s.device),
    countries: count(s => s.country),
    feed: feed.slice(0, 30),
  };
}

export async function report(days: number) {
  await flush();
  const all = await AnalyticsDaily.all();
  const since = dayKey(new Date(Date.now() - (days - 1) * 86400000));
  const list = all.filter(d => d.id >= since).sort((a, b) => a.id.localeCompare(b.id));
  const sum = (f: (d: DayDoc) => number) => list.reduce((n, d) => n + f(d), 0);
  const merge = (f: (d: DayDoc) => Record<string, number>) => {
    const m: Record<string, number> = {};
    list.forEach(d => Object.entries(f(d) || {}).forEach(([k, v]) => bump(m, k, v)));
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([key, count]) => ({ key, count }));
  };
  const products: Record<string, { name: string; views: number }> = {};
  list.forEach(d => Object.entries(d.products || {}).forEach(([k, v]) => {
    products[k] = products[k] || { name: v.name, views: 0 };
    products[k].views += v.views;
  }));
  const unique = new Set(list.flatMap(d => d.visitors)).size;
  const ended = sum(d => d.endedSessions);
  return {
    days,
    series: list.map(d => ({ date: d.id, pageviews: d.pageviews, visitors: d.visitors.length, sessions: d.sessions })),
    totals: {
      pageviews: sum(d => d.pageviews), sessions: sum(d => d.sessions), uniqueVisitors: unique,
      newVisitors: sum(d => d.newVisitors), returningVisitors: sum(d => d.returningVisitors),
      avgSessionSec: ended ? Math.round(sum(d => d.totalDurationSec) / ended) : 0,
      cartAdds: sum(d => d.cartAdds), checkouts: sum(d => d.checkouts),
    },
    topProducts: Object.entries(products).sort((a, b) => b[1].views - a[1].views).slice(0, 10).map(([slug, v]) => ({ slug, ...v })),
    categories: merge(d => d.categories),
    pages: merge(d => d.pages),
    sources: merge(d => d.sources),
    devices: merge(d => d.devices),
    countries: merge(d => d.countries),
    regions: merge(d => d.regions),
  };
}

async function prune() {
  const cutoff = dayKey(new Date(Date.now() - settings.retentionDays * 86400000));
  for (const d of await AnalyticsDaily.find(x => x.id < cutoff)) await AnalyticsDaily.remove(d.id);
}

// ── Socket.IO for admins ──────────────────────────────
let io: IOServer | null = null;
export function attachLiveSocket(server: http.Server, allowedOrigins: Set<string>) {
  io = new IOServer(server, {
    path: '/socket.io',
    cors: { origin: true },
    // Same-origin pages or listed origins only
    allowRequest: (req, cb) => {
      const origin = String(req.headers.origin || '');
      const proto = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0];
      cb(null, !origin || allowedOrigins.has(origin) || origin === proto + '://' + req.headers.host);
    },
    serveClient: false,
    maxHttpBufferSize: 10_000,
  });
  const nsp = io.of('/live-admin');
  nsp.use(async (socket, next) => {
    const token = String(socket.handshake.auth?.token || '');
    const admin = token ? await verifyAdminToken(token) : null;
    if (!admin) return next(new Error('unauthorized'));
    next();
  });
  nsp.on('connection', socket => { socket.emit('snapshot', snapshot()); });
}

export async function clearAllAnalytics() {
  live.clear();
  feed.length = 0;
  const id = dayKey();
  today = blankDay(id);
  dirty = false;
  await AnalyticsDaily.clear();
  io?.of('/live-admin').emit('snapshot', snapshot());
}

export function startLiveAnalytics() {
  refreshSettings().catch(() => {});
  resolveServerGeo().catch(() => {});
  setInterval(() => { expire().catch(() => {}); }, 5000).unref();
  setInterval(() => { io?.of('/live-admin').emit('snapshot', snapshot()); }, 5000).unref();
  setInterval(() => { flush().catch(e => console.warn('[analytics] flush failed:', e.message)); }, 60000).unref();
  setInterval(() => { refreshSettings().then(prune).catch(() => {}); }, 6 * 3600000).unref();
  const bye = () => { flush().finally(() => process.exit(0)); };
  process.once('SIGINT', bye);
  process.once('SIGTERM', bye);
}
