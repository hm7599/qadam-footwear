import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, ArrowRight } from 'lucide-react';
import { api } from '../utils/api';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

const sameKey = (a: ArrayBuffer | null | undefined, b: Uint8Array) => {
  if (!a) return false;
  const x = new Uint8Array(a);
  return x.length === b.length && x.every((v, i) => v === b[i]);
};

const SUB_FLAG = 'aura_push_customer';        // set when this browser is subscribed to shop alerts
const DISMISS_KEY = 'aura_push_dismissed_at'; // don't nag again for a few days
const DISMISS_DAYS = 3;

export type PushSupport = 'supported' | 'unsupported' | 'ios-needs-install' | 'insecure';

interface NotificationContextType {
  isSubscribed: boolean;
  isPromptOpen: boolean;
  isBusy: boolean;
  permission: NotificationPermission | 'unsupported';
  support: PushSupport;
  openPrompt: () => void;
  closePrompt: () => void;
  subscribeToPush: () => Promise<boolean>;
  unsubscribeFromPush: () => Promise<void>;
  statusMessage: string | null;
  errorMessage: string | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function detectSupport(): PushSupport {
  if (typeof window === 'undefined') return 'unsupported';
  if (!window.isSecureContext) return 'insecure';
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;
  if (isIOS && !standalone) return 'ios-needs-install'; // iPhone only allows push for apps added to the home screen
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported';
  return 'supported';
}

/** Get the service worker, registering it if needed (with a timeout so the button never hangs) */
async function getServiceWorker(): Promise<ServiceWorkerRegistration> {
  let reg = await navigator.serviceWorker.getRegistration();
  if (!reg) reg = await navigator.serviceWorker.register('/sw.js');
  const ready = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>(res => setTimeout(() => res(null), 8000)),
  ]);
  if (!ready) throw new Error('The app is still loading. Please refresh the page and try again.');
  return ready;
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [support] = useState<PushSupport>(detectSupport);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [incomingPush, setIncomingPush] = useState<{ title: string; body: string; url: string } | null>(null);

  // Sync existing browser subscription to server on load (recovers if server restarted)
  useEffect(() => {
    if (support !== 'supported') return;
    let cancelled = false;
    (async () => {
      try {
        const reg = (await navigator.serviceWorker.getRegistration()) || (Notification.permission === 'granted' ? await navigator.serviceWorker.register('/sw.js') : undefined);
        if (!reg) return;
        let prevFlag = '';
        try { prevFlag = localStorage.getItem(SUB_FLAG) || ''; } catch { /* ignore */ }
        if (!prevFlag || Notification.permission !== 'granted') {
          const sub = await reg.pushManager.getSubscription();
          if (!cancelled) setIsSubscribed(!!sub && !!prevFlag && prevFlag === sub?.endpoint && Notification.permission === 'granted');
          return;
        }
        await navigator.serviceWorker.ready;
        const vapidKey = await api.getVapidKey();
        if (!vapidKey || cancelled) return;
        const key = urlBase64ToUint8Array(vapidKey);
        let sub = await reg.pushManager.getSubscription();
        if (sub && !sameKey(sub.options?.applicationServerKey, key)) {
          await sub.unsubscribe().catch(() => {});
          sub = null;
        }
        if (!sub) {
          sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
        }
        await api.subscribePush(sub.toJSON());
        try { localStorage.setItem(SUB_FLAG, sub.endpoint); } catch { /* ignore */ }
        if (!cancelled) {
          setPermission('granted');
          setIsSubscribed(true);
        }
      } catch {
        if (!cancelled) setIsSubscribed(false);
      }
    })();
    return () => { cancelled = true; };
  }, [support]);

  // Show an in-app toast when the Service Worker receives a broadcast push while any QADAM tab is open
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onMsg = (e: MessageEvent) => {
      if ((e.data?.type === 'QADAM_PUSH' || e.data?.type === 'AURA_PUSH') && e.data.payload) {
        const p = e.data.payload;
        if (p.kind === 'new-order') return;
        setIncomingPush({
          title: String(p.title || 'QADAM Notification'),
          body: String(p.body || ''),
          url: String(p.url || '/'),
        });
      }
    };
    navigator.serviceWorker.addEventListener('message', onMsg);
    return () => navigator.serviceWorker.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    if (!incomingPush) return;
    const t = setTimeout(() => setIncomingPush(null), 9000);
    return () => clearTimeout(t);
  }, [incomingPush]);

  // Show the invite once in a while (not on admin pages, not if blocked or already on)
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return;
    if (support === 'unsupported' || support === 'insecure') return;
    if (permission === 'denied' || isSubscribed) return;
    let recentlyDismissed = false;
    try {
      recentlyDismissed = Date.now() - Number(localStorage.getItem(DISMISS_KEY) || 0) < DISMISS_DAYS * 864e5;
    } catch { /* ignore */ }
    if (recentlyDismissed || sessionStorage.getItem('aura_push_prompted')) return;
    const t = setTimeout(() => {
      setIsPromptOpen(true);
      sessionStorage.setItem('aura_push_prompted', '1');
    }, 12000);
    return () => clearTimeout(t);
  }, [support, permission, isSubscribed]);

  const subscribeToPush = async (): Promise<boolean> => {
    setErrorMessage(null);
    setStatusMessage(null);

    if (support === 'ios-needs-install') {
      setErrorMessage('On iPhone, first tap Share → "Add to Home Screen", then open QADAM from your home screen and turn on alerts there.');
      return false;
    }
    if (support === 'insecure') {
      setErrorMessage('Notifications only work on a secure (https) website.');
      return false;
    }
    if (support === 'unsupported') {
      setErrorMessage('This browser does not support notifications. Please try Chrome, Edge or Firefox.');
      return false;
    }

    setIsBusy(true);
    try {
      // 1. Ask permission
      const perm = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
      setPermission(perm);
      if (perm === 'denied') {
        throw new Error('Notifications are blocked for this site. Click the lock icon next to the address bar → Notifications → Allow, then try again.');
      }
      if (perm !== 'granted') throw new Error('Please click "Allow" when your browser asks.');

      // 2. Service worker + server key
      const reg = await getServiceWorker();
      const vapidKey = await api.getVapidKey();
      if (!vapidKey) throw new Error('Could not reach the server. Please check your internet and try again.');
      const key = urlBase64ToUint8Array(vapidKey);

      // 3. Re-use a valid subscription, or replace an old one made with a different server key
      let sub = await reg.pushManager.getSubscription();
      if (sub && !sameKey(sub.options?.applicationServerKey, key)) {
        await sub.unsubscribe();
        sub = null;
      }
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });

      // 4. Save on the server
      await api.subscribePush(sub.toJSON());
      try { localStorage.setItem(SUB_FLAG, sub.endpoint); } catch { /* ignore */ }

      setIsSubscribed(true);
      setStatusMessage('Alerts are on! We will let you know about new drops and offers.');
      setTimeout(() => setIsPromptOpen(false), 1800);

      // Friendly confirmation notification
      reg.showNotification('Alerts are on ✓', {
        body: 'You will now get QADAM drop alerts and special offers.',
        icon: '/icons/icon-192.png',
        tag: 'qadam-welcome',
      }).catch(() => {});
      return true;
    } catch (err: any) {
      console.error('Push registration error:', err);
      const msg = String(err?.message || '');
      setErrorMessage(
        /push service|AbortError|Registration failed/i.test(msg)
          ? 'Your browser could not connect to its notification service. Please try again in a minute, or try another browser.'
          : msg || 'Could not turn on alerts. Please try again.'
      );
      return false;
    } finally {
      setIsBusy(false);
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      // Keep the browser subscription if this device also gets admin order alerts
      const adminEndpoint = localStorage.getItem('aura_admin_push_endpoint');
      if (sub && sub.endpoint !== adminEndpoint) await sub.unsubscribe();
      try { localStorage.removeItem(SUB_FLAG); } catch { /* ignore */ }
      setIsSubscribed(false);
      setStatusMessage('Alerts turned off.');
    } catch (e: any) {
      console.warn('Unsubscribe error:', e);
    }
  };

  const openPrompt = () => { setErrorMessage(null); setStatusMessage(null); setIsPromptOpen(true); };
  const closePrompt = () => {
    setIsPromptOpen(false);
    if (!isSubscribed) {
      try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        isSubscribed,
        isPromptOpen,
        isBusy,
        permission,
        support,
        openPrompt,
        closePrompt,
        subscribeToPush,
        unsubscribeFromPush,
        statusMessage,
        errorMessage,
      }}
    >
      {children}
      {incomingPush && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-5 z-[70] w-[calc(100vw-2.5rem)] max-w-sm rounded-2xl border border-[#D4B483]/40 bg-neutral-950 p-4 text-white shadow-2xl"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D4B483]/20 text-[#D4B483]">
              <Bell className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-[#D4B483]">QADAM Alert</p>
              <p className="mt-0.5 text-sm font-semibold leading-snug text-white">{incomingPush.title}</p>
              {incomingPush.body && (
                <p className="mt-1 text-xs leading-relaxed text-neutral-300 line-clamp-2">{incomingPush.body}</p>
              )}
              <div className="mt-2.5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const target = incomingPush.url || '/';
                    setIncomingPush(null);
                    navigate(target);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-neutral-950 hover:bg-[#F5E6D3] cursor-pointer"
                >
                  Open <ArrowRight className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setIncomingPush(null)}
                  className="text-[11px] text-neutral-400 hover:text-white cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIncomingPush(null)}
              aria-label="Close notification"
              className="rounded-full p-1 text-neutral-400 hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};
