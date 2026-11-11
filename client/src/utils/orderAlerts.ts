// Admin new-order alert preferences + sound. Preferences are per device (localStorage).

export interface AlertPrefs {
  enabled: boolean;   // show popup for new orders
  sound: boolean;     // play chime
  desktop: boolean;   // system notification (works when the tab is in background)
  volume: number;     // 0..1
  voice: boolean;     // read the order out loud
  voiceLang: 'en' | 'ur';
}

const KEY = 'aura_admin_order_alerts';
export const DEFAULT_PREFS: AlertPrefs = { enabled: true, sound: true, desktop: true, volume: 0.7, voice: true, voiceLang: 'en' };

export function loadPrefs(): AlertPrefs {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(p: AlertPrefs) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent('qadam-alert-prefs', { detail: p }));
}

// ── Sound: a pleasant 3-note "cash register" style chime, generated in the browser (no file needed)
let ctx: AudioContext | null = null;
const getCtx = () => {
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
};

/** Browsers only allow sound after the user has clicked once; call this on any click to unlock it */
export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

export function playOrderChime(volume = 0.7) {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  const notes = [880, 1174.66, 1567.98]; // A5, D6, G6
  const start = c.currentTime + 0.02;
  // play the 3-note chime twice so it's noticeable
  [0, 0.75].forEach(offset => {
    notes.forEach((freq, i) => {
      const t = start + offset + i * 0.13;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.5), t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.55);
    });
  });
}

export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window;

export async function requestDesktopPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

export async function showDesktopNotification(title: string, body: string, url: string, tag?: string) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  const options: NotificationOptions = {
    body,
    icon: '/icons/admin-192.png',
    badge: '/icons/admin-192.png',
    tag: tag || url,
    requireInteraction: true,
    data: { url },
  };
  try {
    // Prefer the service worker (works for installed admin PWA); fall back to a page notification
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return reg.showNotification(title, options);
    const n = new Notification(title, options);
    n.onclick = () => { window.focus(); window.location.href = url; n.close(); };
  } catch { /* ignore */ }
}

// ── Voice: read the order out loud (browser text-to-speech, no extra service needed)
export const speechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

function pickVoice(lang: 'en' | 'ur'): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  if (lang === 'ur') return voices.find(v => /^ur/i.test(v.lang)) || voices.find(v => /^hi/i.test(v.lang));
  return (
    voices.find(v => /en-(GB|IN|PK)/i.test(v.lang) && /female|zira|hazel|heera|google/i.test(v.name)) ||
    voices.find(v => /^en/i.test(v.lang))
  );
}

export interface SpokenOrder {
  name: string;
  city?: string;
  items: number;
  total: string; // e.g. "Rs. 110,600"
  orderNumber?: string;
}

/** Builds the sentence that will be spoken */
export function orderSentence(o: SpokenOrder, lang: 'en' | 'ur'): string {
  const amount = o.total.replace(/^Rs\.?\s*/i, '');
  if (lang === 'ur') {
    return `Naya order aaya hai. ${o.name}${o.city ? `, ${o.city} se` : ''}. ${o.items} item${o.items > 1 ? 's' : ''}. Total ${amount} rupay.`;
  }
  return `New order from ${o.name}${o.city ? `, ${o.city}` : ''}. ${o.items} item${o.items > 1 ? 's' : ''}, total ${amount} rupees.`;
}

export function speakOrder(o: SpokenOrder, opts: { lang: 'en' | 'ur'; volume: number; delayMs?: number }) {
  if (!speechSupported()) return;
  const say = () => {
    const u = new SpeechSynthesisUtterance(orderSentence(o, opts.lang));
    const v = pickVoice(opts.lang);
    if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = opts.lang === 'ur' ? 'ur-PK' : 'en-GB'; }
    u.rate = 0.95;
    u.volume = Math.max(0.1, Math.min(1, opts.volume));
    window.speechSynthesis.speak(u);
  };
  // voices load asynchronously the first time
  if (!window.speechSynthesis.getVoices().length) {
    window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; };
  }
  setTimeout(say, opts.delayMs ?? 0);
}

// ── Background push for this admin device (works even when the admin panel is closed)
const urlB64ToUint8 = (b64: string) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
};

// Read JSON safely: an empty or non-JSON reply (server down / restarting) gives a clear message instead of a crash
const readJson = async (res: Response): Promise<any> => {
  const text = await res.text();
  if (!text) throw new Error(res.ok ? 'Empty reply from server. Please try again.' : `Server is not responding (${res.status}). Make sure the backend is running, then try again.`);
  try { return JSON.parse(text); } catch { throw new Error(`Unexpected reply from server (${res.status}). Please try again.`); }
};

const authHeaders = (): HeadersInit => {
  const t = localStorage.getItem('aura_token');
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
};

export async function getDevicePushState(): Promise<'unsupported' | 'off' | 'on'> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported';
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return 'off';
  try { return localStorage.getItem('aura_admin_push_endpoint') === sub.endpoint ? 'on' : 'off'; } catch { return 'off'; }
}

export async function enableDevicePush(): Promise<void> {
  const perm = await requestDesktopPermission();
  if (perm !== 'granted') throw new Error('Notifications are blocked. Allow them from the lock icon in the address bar.');
  const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register('/sw.js'));
  await navigator.serviceWorker.ready;
  const keyRes = await fetch('/api/notifications/vapid-key');
  const keyData = await readJson(keyRes);
  const publicKey: string = keyData.publicKey || keyData.data?.publicKey || keyData.data || keyData.key;
  if (!publicKey) throw new Error('Server did not return a push key.');
  let sub = await reg.pushManager.getSubscription();
  // If this browser was subscribed with an older server key, start fresh
  if (sub) {
    const cur = sub.options?.applicationServerKey;
    const want = urlB64ToUint8(publicKey);
    const same = cur && new Uint8Array(cur).length === want.length && new Uint8Array(cur).every((b, i) => b === want[i]);
    if (!same) { await sub.unsubscribe(); sub = null; }
  }
  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8(publicKey) });
  }
  const res = await fetch('/api/admin-push/subscribe', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ subscription: sub.toJSON(), label: navigator.userAgent.slice(0, 120) }),
  });
  const out = await readJson(res);
  if (!res.ok) throw new Error(out.message || 'Could not register this device');
  try { localStorage.setItem('aura_admin_push_endpoint', sub.endpoint); } catch { /* ignore */ }
}

export async function disableDevicePush(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await fetch('/api/admin-push/unsubscribe', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ endpoint: sub.endpoint }) });
  }
  try { localStorage.removeItem('aura_admin_push_endpoint'); } catch { /* ignore */ }
}

export async function sendTestPush(): Promise<number> {
  const res = await fetch('/api/admin-push/test', { method: 'POST', headers: authHeaders() });
  const d = await readJson(res);
  if (!res.ok) throw new Error(d.message || 'Test failed');
  return d.data?.sent ?? 0;
}

/** Speaks any sentence with the admin's chosen voice settings. */
export function speakText(text: string, opts: { lang: 'en' | 'ur'; volume: number; delayMs?: number }) {
  if (!speechSupported()) return;
  setTimeout(() => {
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(opts.lang);
    if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = opts.lang === 'ur' ? 'ur-PK' : 'en-GB'; }
    u.rate = 0.95;
    u.volume = Math.max(0.1, Math.min(1, opts.volume));
    window.speechSynthesis.speak(u);
  }, opts.delayMs ?? 0);
}
