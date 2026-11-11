import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Bell,
  BellOff,
  X,
  ShoppingBag,
  MapPin,
  Phone,
  Volume2,
  VolumeX,
  Monitor,
  Settings2,
  Mic,
  Smartphone,
  CheckCircle2,
  Radio,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../utils/api';
import { Order } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { sizeLabel } from '../../utils/sizes';
import {
  AlertPrefs,
  loadPrefs,
  savePrefs,
  playOrderChime,
  unlockAudio,
  requestDesktopPermission,
  showDesktopNotification,
  speakOrder,
  speechSupported,
  getDevicePushState,
  enableDevicePush,
  disableDevicePush,
  sendTestPush,
  notificationsSupported,
} from '../../utils/orderAlerts';

const POLL_MS = 15000;

// Kept outside the component so switching admin pages (which remounts the layout) does not lose track
const seenGlobal: { set: Set<string> | null } = { set: null };

/**
 * Watches for new orders while the admin panel is open.
 * New order → popup with customer name & details + chime + desktop notification.
 * Also renders a bell button that opens a true modal dialog with alert settings
 * and recent order alerts.
 */
export const NewOrderAlert: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  const [prefs, setPrefs] = useState<AlertPrefs>(loadPrefs);
  const [popups, setPopups] = useState<Order[]>([]);
  const [recent, setRecent] = useState<Order[]>([]);
  const [unread, setUnread] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [permission, setPermission] = useState<string>(notificationsSupported() ? Notification.permission : 'unsupported');

  const seen = { get current() { return seenGlobal.set; }, set current(v) { seenGlobal.set = v; } };
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  const updatePrefs = (patch: Partial<AlertPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    savePrefs(next);
    window.dispatchEvent(new Event('qadam-alert-prefs')); // keep the header bell in sync with the Settings page
  };
  useEffect(() => {
    const sync = () => setPrefs(loadPrefs());
    window.addEventListener('qadam-alert-prefs', sync);
    return () => window.removeEventListener('qadam-alert-prefs', sync);
  }, []);

  // Lock body scroll and handle ESC key when modal is open
  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [panelOpen]);

  // Unlock audio on the first click anywhere (browser autoplay rule)
  useEffect(() => {
    const h = () => unlockAudio();
    window.addEventListener('pointerdown', h, { once: true });
    return () => window.removeEventListener('pointerdown', h);
  }, []);

  const check = useCallback(async () => {
    let list: Order[];
    try {
      list = await api.getOrders();
    } catch {
      return; // offline / logged out – try again next round
    }
    // First load: remember existing orders without alerting, and show recent orders
    if (!seen.current) {
      seen.current = new Set(list.map(o => o.orderNumber));
      const sorted = [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      setRecent(sorted.slice(0, 20));
      return;
    }
    const fresh = list.filter(o => !seen.current!.has(o.orderNumber));
    if (!fresh.length) return;
    fresh.forEach(o => seen.current!.add(o.orderNumber));
    fresh.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    setRecent(r => [...fresh, ...r].slice(0, 20));
    setUnread(n => n + fresh.length);
    window.dispatchEvent(new CustomEvent('qadam-new-orders', { detail: fresh }));

    const p = prefsRef.current;
    if (!p.enabled) return;
    setPopups(prev => [...fresh, ...prev].slice(0, 3));
    if (p.sound) playOrderChime(p.volume);
    if (p.voice) {
      // Read each new order out loud, one after another, after the chime
      fresh.slice(0, 3).forEach((o, idx) =>
        speakOrder(
          {
            name: o.customer.name,
            city: o.customer.city,
            items: o.items.reduce((n, i) => n + i.quantity, 0),
            total: formatPrice(o.totalAmount),
            orderNumber: o.orderNumber,
          },
          { lang: p.voiceLang, volume: p.volume, delayMs: (p.sound ? 1700 : 0) + idx * 200 }
        )
      );
    }
    if (p.desktop) {
      fresh.slice(0, 3).forEach(o => {
        const items = o.items.reduce((n, i) => n + i.quantity, 0);
        showDesktopNotification(
          `🛍️ New order from ${o.customer.name}`,
          `${o.orderNumber} · ${items} item(s) · ${formatPrice(o.totalAmount)}\n${o.customer.city}`,
          '/admin/orders',
          `order-${o.orderNumber}` // same tag as the server push, so it never shows twice
        );
      });
    }
  }, [formatPrice]);

  // A server push arrived while this tab is open → check right away (popup + sound + voice)
  useEffect(() => {
    if (embedded || !('serviceWorker' in navigator)) return;
    const onMsg = (e: MessageEvent) => { if ((e.data?.type === 'QADAM_PUSH' || e.data?.type === 'AURA_PUSH') && e.data.payload?.kind === 'new-order') check(); };
    navigator.serviceWorker.addEventListener('message', onMsg);
    return () => navigator.serviceWorker.removeEventListener('message', onMsg);
  }, [check]);

  // Background alerts for this device (server push)
  const [devicePush, setDevicePush] = useState<'unsupported' | 'off' | 'on' | 'busy'>('off');
  const [pushMsg, setPushMsg] = useState('');
  useEffect(() => { getDevicePushState().then(setDevicePush).catch(() => setDevicePush('unsupported')); }, []);
  const toggleDevicePush = async () => {
    const was = devicePush;
    setDevicePush('busy');
    setPushMsg('');
    try {
      if (was === 'on') { await disableDevicePush(); setDevicePush('off'); }
      else { await enableDevicePush(); setDevicePush('on'); setPermission('granted'); setPushMsg('This device will now receive order alerts even when the browser is closed.'); }
    } catch (e: any) {
      setDevicePush(was === 'busy' ? 'off' : was);
      setPushMsg(e.message || 'Could not change push notification setting.');
    }
  };
  const testPush = async () => {
    setPushMsg('');
    try {
      const n = await sendTestPush();
      setPushMsg(n ? `Test push sent to ${n} device(s).` : 'No devices registered yet.');
    } catch (e: any) { setPushMsg(e.message); }
  };

  useEffect(() => {
    if (embedded) return;
    check();
    const id = setInterval(check, POLL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [check]);

  // Auto-hide each popup after 25s
  useEffect(() => {
    if (!popups.length) return;
    const t = setTimeout(() => setPopups(p => p.slice(0, -1)), 25000);
    return () => clearTimeout(t);
  }, [popups]);

  const dismiss = (num: string) => setPopups(p => p.filter(o => o.orderNumber !== num));
  const viewOrder = (num: string) => {
    dismiss(num);
    setPanelOpen(false);
    navigate(`/admin/orders?highlight=${encodeURIComponent(num)}`);
  };

  const enableDesktop = async () => {
    const res = await requestDesktopPermission();
    setPermission(res);
    if (res === 'granted') updatePrefs({ desktop: true });
  };

  const testAlert = () => {
    unlockAudio();
    if (prefs.sound) playOrderChime(prefs.volume);
    const demo: Order = {
      orderNumber: 'TEST-0001',
      customer: { name: 'Ali Khan', email: 'ali@example.com', phone: '03001234567', address: 'House 12, Street 5, Gulberg', city: 'Lahore', postalCode: '54000', country: 'Pakistan' },
      items: [{ productId: 'x', name: 'QADAM Phantom Oxford Brogue', slug: '', price: 395, color: 'Nero Black', size: 42, quantity: 1, image: '/images/shoes/oxford-brogue-transparent.png' }],
      subtotal: 395, shippingCost: 0, discount: 0, totalAmount: 395,
      shippingMethod: 'Express TCS', paymentMethod: 'cod', paymentStatus: 'pending', orderStatus: 'pending',
      statusHistory: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    } as unknown as Order;
    setPopups(p => [demo, ...p].slice(0, 3));
    if (prefs.voice) {
      speakOrder(
        { name: 'Ali Khan', city: 'Lahore', items: 1, total: formatPrice(395) },
        { lang: prefs.voiceLang, volume: prefs.volume, delayMs: prefs.sound ? 1700 : 0 }
      );
    }
    if (prefs.desktop) showDesktopNotification('🛍️ New order from Ali Khan', 'TEST-0001 · 1 item(s) · Lahore (Cash on Delivery)', '/admin/orders', 'order-TEST-0001');
  };

  const settingsBody = (
                    <div className="space-y-5">
                      {/* Section 1: In-App Alerts */}
                      <div className="rounded-2xl border border-neutral-100 bg-neutral-50/50 p-4 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                            Audio & Voice Broadcast
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Radio className="h-3 w-3 animate-pulse" /> Live
                          </span>
                        </div>

                        <Toggle
                          label="Show popup alert on incoming orders"
                          description="Slide-in card with buyer name, city & total"
                          icon={prefs.enabled ? Bell : BellOff}
                          checked={prefs.enabled}
                          onChange={v => updatePrefs({ enabled: v })}
                        />

                        <Toggle
                          label="Play luxury chime"
                          description="Pleasant double chime upon new order receipt"
                          icon={prefs.sound ? Volume2 : VolumeX}
                          checked={prefs.sound}
                          onChange={v => updatePrefs({ sound: v })}
                        />

                        {speechSupported() && (
                          <Toggle
                            label="Speak customer name & details"
                            description="Browser speech synthesizer announces buyer & city"
                            icon={Mic}
                            checked={prefs.voice}
                            onChange={v => updatePrefs({ voice: v })}
                          />
                        )}

                        {prefs.voice && speechSupported() && (
                          <div className="pt-1">
                            <label className="text-xs font-medium text-neutral-700 block mb-1.5">
                              Speech Language & Accent
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {(['en', 'ur'] as const).map(l => (
                                <button
                                  key={l}
                                  type="button"
                                  onClick={() => updatePrefs({ voiceLang: l })}
                                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold transition-all cursor-pointer ${
                                    prefs.voiceLang === l
                                      ? 'bg-neutral-950 text-white shadow-sm ring-1 ring-neutral-900'
                                      : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
                                  }`}
                                >
                                  {prefs.voiceLang === l && <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />}
                                  {l === 'en' ? 'English voice' : 'Roman Urdu voice'}
                                </button>
                              ))}
                            </div>
                            <p className="mt-1.5 text-[11px] text-neutral-500">
                              {prefs.voiceLang === 'ur'
                                ? 'Urdu announcement: "Naya order aya hai [Name] ka [City] se"'
                                : 'English announcement: "New order received from [Name] in [City]"'}
                            </p>
                          </div>
                        )}

                        {(prefs.sound || prefs.voice) && (
                          <div className="pt-2 border-t border-neutral-200/60">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="font-medium text-neutral-700 flex items-center gap-1.5">
                                <Volume2 className="h-3.5 w-3.5 text-neutral-500" />
                                Alert Volume
                              </span>
                              <span className="font-semibold text-neutral-900">{Math.round(prefs.volume * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min={0.1}
                              max={1}
                              step={0.05}
                              value={prefs.volume}
                              onChange={e => updatePrefs({ volume: Number(e.target.value) })}
                              className="w-full accent-neutral-950 h-1.5 bg-neutral-200 rounded-lg cursor-pointer"
                              aria-label="Volume slider"
                            />
                          </div>
                        )}
                      </div>

                      {/* Section 2: Background Alerts (Server Push) */}
                      {devicePush !== 'unsupported' && (
                        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800">
                              <Smartphone className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-neutral-900">Background Alerts (Tab Closed)</p>
                              <p className="mt-0.5 text-[11px] text-neutral-500 leading-relaxed">
                                Get device notifications even when this browser tab or phone browser is closed.
                              </p>
                              <div className="mt-3 flex gap-2">
                                <button
                                  type="button"
                                  onClick={toggleDevicePush}
                                  disabled={devicePush === 'busy'}
                                  className={`flex-1 rounded-xl py-2 px-3 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer ${
                                    devicePush === 'on'
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                      : 'bg-neutral-950 text-white hover:bg-neutral-800'
                                  }`}
                                >
                                  {devicePush === 'busy'
                                    ? 'Updating…'
                                    : devicePush === 'on'
                                    ? 'Turn off on this device'
                                    : 'Turn on for this device'}
                                </button>
                                {devicePush === 'on' && (
                                  <button
                                    type="button"
                                    onClick={testPush}
                                    className="rounded-xl px-3 py-2 text-xs font-semibold text-neutral-700 border border-neutral-200 hover:bg-neutral-50 cursor-pointer"
                                  >
                                    Test Push
                                  </button>
                                )}
                              </div>
                              {pushMsg && (
                                <p className="mt-2 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                  {pushMsg}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Section 3: Desktop Notifications */}
                      <div className="rounded-2xl border border-neutral-100 bg-neutral-50/50 p-4">
                        {permission === 'granted' ? (
                          <Toggle
                            label="Desktop browser notification"
                            description="System banner with direct link to the order"
                            icon={Monitor}
                            checked={prefs.desktop}
                            onChange={v => updatePrefs({ desktop: v })}
                          />
                        ) : permission === 'denied' ? (
                          <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
                            <span className="font-bold">⚠️</span>
                            <span>Desktop notifications are currently blocked in your browser. Unblock them from the lock icon in your address bar.</span>
                          </div>
                        ) : permission !== 'unsupported' ? (
                          <button
                            type="button"
                            onClick={enableDesktop}
                            className="w-full rounded-xl bg-neutral-950 text-white py-2.5 text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            Enable Desktop System Notifications
                          </button>
                        ) : null}
                      </div>

                      {/* Section 4: Live Audio Test */}
                      <button
                        type="button"
                        onClick={testAlert}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold text-neutral-900 border border-neutral-300 bg-neutral-50 hover:bg-white hover:shadow-sm transition-all cursor-pointer"
                      >
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <span>Play Test Chime & Sample Order Voice</span>
                      </button>
                    </div>);

  // Settings page: only the settings, no bell / popups
  if (embedded) return settingsBody;

  return (
    <>
      {/* ── TOAST POPUPS (portal to <body>) ── */}
      {createPortal(
        <div className="pointer-events-none fixed right-4 top-20 z-[80] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
          <AnimatePresence>
            {popups.map(o => {
              const count = o.items.reduce((n, i) => n + i.quantity, 0);
              const isTest = o.orderNumber.startsWith('TEST-');
              return (
                <motion.div
                  key={o.orderNumber}
                  layout
                  initial={{ opacity: 0, x: 80, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 80, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                  className="pointer-events-auto overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
                >
                  <div className="flex items-center gap-2 bg-neutral-950 px-4 py-2.5 text-white">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </span>
                    <span className="flex-1 text-xs font-semibold uppercase tracking-wider">
                      {isTest ? 'Test alert' : 'New order received'}
                    </span>
                    <button onClick={() => dismiss(o.orderNumber)} className="rounded-full p-1 hover:bg-white/15 cursor-pointer" aria-label="Close">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
                        {o.customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-bold text-neutral-900">{o.customer.name}</p>
                        <p className="text-xs text-neutral-500">{o.orderNumber} · {new Date(o.createdAt).toLocaleTimeString()}</p>
                      </div>
                      <p className="shrink-0 text-base font-bold text-neutral-900">{formatPrice(o.totalAmount)}</p>
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-neutral-600">
                      <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-neutral-400" />{o.customer.city}</p>
                      {o.customer.phone && <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-neutral-400" />{o.customer.phone}</p>}
                      <p className="flex items-center gap-1.5">
                        <ShoppingBag className="h-3.5 w-3.5 text-neutral-400" />
                        {count} item{count > 1 ? 's' : ''} · {o.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid online'}
                      </p>
                    </div>

                    <ul className="mt-3 space-y-1.5 rounded-xl bg-neutral-50 p-2.5">
                      {o.items.slice(0, 2).map((i, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs">
                          {i.image && <img src={i.image} alt="" className="h-8 w-8 rounded-md bg-white object-contain" />}
                          <span className="min-w-0 flex-1 truncate text-neutral-800">{i.name}</span>
                          <span className="shrink-0 text-neutral-500">{sizeLabel(i.size)} × {i.quantity}</span>
                        </li>
                      ))}
                      {o.items.length > 2 && <li className="text-[11px] text-neutral-400">+{o.items.length - 2} more</li>}
                    </ul>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => (isTest ? dismiss(o.orderNumber) : viewOrder(o.orderNumber))}
                        className="flex-1 rounded-lg bg-neutral-950 py-2 text-xs font-semibold text-white hover:bg-neutral-800 cursor-pointer"
                      >
                        View & approve
                      </button>
                      <button
                        onClick={() => dismiss(o.orderNumber)}
                        className="rounded-lg px-3 py-2 text-xs font-medium text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50 cursor-pointer"
                      >
                        Later
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>,
        document.body
      )}

      {/* ── HEADER BELL TRIGGER BUTTON ── */}
      <button
        onClick={() => { setPanelOpen(o => !o); setUnread(0); unlockAudio(); }}
        aria-label="Order notifications"
        className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all cursor-pointer ${
          panelOpen
            ? 'bg-neutral-950 text-white shadow-md'
            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
        }`}
      >
        {prefs.enabled ? (
          <Bell className={`h-[18px] w-[18px] ${unread > 0 ? 'animate-[wiggle_1s_ease-in-out_infinite]' : ''}`} />
        ) : (
          <BellOff className="h-[18px] w-[18px]" />
        )}
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white shadow-sm">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* ── SEPARATE NOTIFICATION MODAL DIALOG (Portal to <body>) ── */}
      {createPortal(
        <AnimatePresence>
          {panelOpen && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="order-notifications-modal-title"
            >
              {/* Full Dark Backdrop Scrim with Blur */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setPanelOpen(false)}
                className="absolute inset-0 bg-neutral-950/70 backdrop-blur-md"
              />

              {/* Modal Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                onClick={e => e.stopPropagation()}
                className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border border-neutral-200/90 max-h-[90vh]"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-neutral-100 bg-white px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-950 text-white shadow-sm">
                      <Bell className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <h2 id="order-notifications-modal-title" className="text-base font-bold text-neutral-900 leading-tight">
                        Order Notifications
                      </h2>
                      <p className="text-xs text-neutral-500">Live order activity & incoming purchases</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {recent.length > 0 && (
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                        {recent.length} {recent.length === 1 ? 'order' : 'orders'}
                      </span>
                    )}
                    <button
                      onClick={() => setPanelOpen(false)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 transition-colors cursor-pointer"
                      aria-label="Close modal"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Modal Body: Dedicated Notifications Feed */}
                <div className="flex-1 overflow-y-auto px-6 py-5 max-h-[65vh]">
                  {recent.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 mb-3">
                        <Clock className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-bold text-neutral-900">No new notifications yet</p>
                      <p className="mt-1 text-xs text-neutral-500 max-w-xs">
                        New orders from customers will appear here in real time. We check for updates every 15 seconds.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {recent.map(o => {
                        const itemCount = o.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
                        const firstItemName = o.items[0]?.name || 'Footwear';
                        return (
                          <div
                            key={o.orderNumber}
                            className="group flex items-center justify-between gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/70 p-3.5 hover:bg-white hover:shadow-sm hover:border-neutral-200 transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-bold text-emerald-800">
                                {o.customer.name.charAt(0).toUpperCase()}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="truncate text-sm font-bold text-neutral-900">
                                    {o.customer.name}
                                  </span>
                                  <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                    o.paymentMethod === 'cod'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}>
                                    {o.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Prepaid'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                                  <span className="font-medium text-neutral-700">{o.orderNumber}</span>
                                  <span>•</span>
                                  <span>{o.customer.city}</span>
                                  <span>•</span>
                                  <span>{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                                  {itemCount} {itemCount === 1 ? 'item' : 'items'} · {firstItemName}{o.items.length > 1 ? ` +${o.items.length - 1} more` : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                              <span className="text-sm font-bold text-neutral-900">
                                {formatPrice(o.totalAmount)}
                              </span>
                              <button
                                type="button"
                                onClick={() => viewOrder(o.orderNumber)}
                                className="flex items-center gap-1 rounded-xl bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                              >
                                <span>View</span>
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/80 px-6 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-[11px] font-medium text-neutral-500">
                      Live sync active (15s cycle)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPanelOpen(false)}
                    className="rounded-xl bg-neutral-950 px-5 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

const Toggle: React.FC<{
  label: string;
  description?: string;
  icon: React.ElementType;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, description, icon: Icon, checked, onChange }) => (
  <div className="flex items-start justify-between gap-3 py-1">
    <div className="flex items-start gap-2.5 min-w-0 flex-1">
      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
        checked ? 'bg-neutral-900 text-white' : 'bg-neutral-200/80 text-neutral-500'
      }`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-semibold text-neutral-900 leading-tight">{label}</p>
        {description && <p className="mt-0.5 text-[11px] text-neutral-500 leading-snug">{description}</p>}
      </div>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
        checked ? 'bg-emerald-500' : 'bg-neutral-300'
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);
