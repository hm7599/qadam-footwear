import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Product } from '../../types';

/**
 * Sends small, anonymous activity events for the admin "Live Visitors" page.
 * - No names, emails, phones or form inputs are ever sent.
 * - Skipped for admins, on /admin pages, when the browser asks "Do Not Track",
 *   or when the visitor turned analytics off (localStorage 'aura_analytics_off' = '1').
 * - Fire-and-forget with keepalive / sendBeacon; never blocks the page.
 */
const SESSION_MS = 30 * 60000;
const HEARTBEAT_MS = 15000;

const rid = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, '0')).join('');
const store = {
  get: (k: string, s: Storage = localStorage) => { try { return s.getItem(k); } catch { return null; } },
  set: (k: string, v: string, s: Storage = localStorage) => { try { s.setItem(k, v); } catch { /* ignore */ } },
};

function ids() {
  let isNew = false;
  let vid = store.get('aura_vid');
  if (!vid) { vid = rid(); isNew = true; store.set('aura_vid', vid); }
  // One session shared by all tabs, ends after 30 min without activity
  let sid = '';
  try {
    const raw = JSON.parse(store.get('aura_sid') || 'null');
    if (raw && raw.exp > Date.now()) sid = raw.id;
  } catch { /* new session */ }
  if (!sid) sid = rid();
  store.set('aura_sid', JSON.stringify({ id: sid, exp: Date.now() + SESSION_MS }));
  let tab = store.get('aura_tab', sessionStorage);
  if (!tab) { tab = rid(); store.set('aura_tab', tab, sessionStorage); }
  // 'New' visitor = this is the first session this browser ever had
  if (isNew) store.set('aura_first_sid', sid);
  return { vid, sid, tab, isNew: store.get('aura_first_sid') === sid };
}

const disabled = () =>
  store.get('aura_analytics_off') === '1' || (navigator as any).doNotTrack === '1' || (window as any).doNotTrack === '1';

let cachedGeo: { city?: string; region?: string; country?: string } | null = null;
function getCachedGeo(): { city?: string; region?: string; country?: string } | null {
  if (cachedGeo) return cachedGeo;
  try {
    const raw = sessionStorage.getItem('aura_geo');
    if (raw) {
      cachedGeo = JSON.parse(raw);
      return cachedGeo;
    }
  } catch {}
  return null;
}

function initGeo() {
  if (getCachedGeo()) return;
  fetch('/api/live/geo')
    .then(r => r.json())
    .then(d => {
      if (d?.success && d.city) {
        cachedGeo = { city: d.city, region: d.region, country: d.country };
        try { sessionStorage.setItem('aura_geo', JSON.stringify(cachedGeo)); } catch {}
      }
    })
    .catch(() => {});
}

function send(body: Record<string, any>, beacon = false) {
  const payload = JSON.stringify(body);
  try {
    if (beacon && navigator.sendBeacon) {
      navigator.sendBeacon('/api/live/hit', new Blob([payload], { type: 'text/plain' }));
      return;
    }
    fetch('/api/live/hit', { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
  } catch { /* never break the page */ }
}

export const VisitorTracker: React.FC<{ products: Product[] }> = ({ products }) => {
  const location = useLocation();
  const { totalCount, isCheckoutOpen } = useCart();
  const { user } = useAuth();
  const skip = useRef(true);
  const lastCart = useRef(totalCount);
  const firstPage = useRef(true);

  const isAdminPath = location.pathname.startsWith('/admin');
  skip.current = isAdminPath || user?.role === 'admin' || disabled();

  useEffect(() => {
    initGeo();
  }, []);

  const base = () => {
    const i = ids();
    const g = getCachedGeo();
    return {
      vid: i.vid,
      sid: i.sid,
      tab: i.tab,
      isNew: i.isNew,
      path: location.pathname,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      city: g?.city,
      region: g?.region,
      country: g?.country,
    };
  };

  // Page views
  useEffect(() => {
    if (skip.current) return;
    const t = setTimeout(() => {
      const slug = location.pathname.startsWith('/product/') ? decodeURIComponent(location.pathname.split('/')[2] || '') : '';
      const p = slug ? products.find(x => x.slug === slug) : undefined;
      const params = new URLSearchParams(location.search);
      const first = firstPage.current;
      firstPage.current = false;
      send({
        ...base(), type: 'page',
        product: slug ? { slug, name: p?.name || slug } : undefined,
        category: params.get('category') || (location.pathname.startsWith('/new-arrivals') ? 'New Arrivals' : location.pathname.startsWith('/best-sellers') ? 'Best Sellers' : location.pathname.startsWith('/mens') ? 'Men' : ''),
        ref: first ? document.referrer : '',
        utm: first ? params.get('utm_source') || '' : '',
      });
    }, 300); // let the page settle; never delays rendering
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, products.length]);

  // Heartbeat while the tab is visible + "leave" when it closes
  useEffect(() => {
    const beat = () => { if (!skip.current && document.visibilityState === 'visible') send({ ...base(), type: 'ping' }); };
    const iv = setInterval(beat, HEARTBEAT_MS);
    const onVis = () => { if (document.visibilityState === 'visible') beat(); };
    const onHide = () => { if (!skip.current) send({ ...base(), type: 'leave' }, true); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onHide);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('pagehide', onHide); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Cart & checkout activity
  useEffect(() => {
    if (!skip.current && totalCount !== lastCart.current) send({ ...base(), type: 'cart', cartCount: totalCount });
    lastCart.current = totalCount;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCount]);
  useEffect(() => {
    if (!skip.current && isCheckoutOpen) send({ ...base(), type: 'checkout' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckoutOpen]);

  return null;
};
