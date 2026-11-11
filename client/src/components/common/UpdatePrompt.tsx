import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, RefreshCw, X, Sparkles } from 'lucide-react';

declare const __APP_VERSION__: string;

const CHECK_EVERY_MS = 60 * 1000;

async function fetchLatestVersion(): Promise<string | null> {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.version === 'string' ? data.version : null;
  } catch {
    return null;
  }
}

/** Clears old cached files, activates the newest service worker and reloads */
async function applyUpdate() {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    await reg?.update();
    reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch { /* ignore */ }
  window.location.reload();
}

/**
 * Bottom popup shown to customers and admins when a new version of the
 * website / app has been deployed while they had it open.
 */
export const UpdatePrompt: React.FC<{ variant?: 'customer' | 'admin' }> = ({ variant = 'customer' }) => {
  const [available, setAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  // "Later" hides the popup for 30 minutes, then it asks again
  useEffect(() => {
    if (!dismissed) return;
    const t = setTimeout(() => setDismissed(false), 30 * 60 * 1000);
    return () => clearTimeout(t);
  }, [dismissed]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) return; // no version file in dev mode

    let stopped = false;
    const check = async () => {
      const latest = await fetchLatestVersion();
      if (!stopped && latest && latest !== __APP_VERSION__) setAvailable(true);
    };

    check();
    const timer = setInterval(check, CHECK_EVERY_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', check);

    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', check);
    };
  }, []);

  const update = () => {
    setUpdating(true);
    applyUpdate();
  };

  const dark = variant === 'admin';

  return (
    <AnimatePresence>
      {available && !dismissed && (
        <motion.div
          initial={{ y: 140, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 140, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4 max-sm:bottom-24"
          role="status"
        >
          <div
            className={`relative flex w-full max-w-md items-center gap-3 rounded-2xl p-3.5 pr-4 shadow-2xl ring-1 ${
              dark ? 'bg-neutral-950 text-white ring-white/10' : 'bg-white text-neutral-900 ring-black/5'
            }`}
          >
            <span className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${dark ? 'bg-white/10' : 'bg-neutral-950 text-white'}`}>
              <Sparkles className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{dark ? 'New admin panel version' : 'New version available'}</p>
              <p className={`text-xs ${dark ? 'text-white/60' : 'text-neutral-500'}`}>
                {dark ? 'Install it to get the latest changes. Unsaved form edits will be lost.' : 'Install it to get the latest look, features and fixes.'}
              </p>
            </div>

            <button
              onClick={update}
              disabled={updating}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-70 ${
                dark ? 'bg-white text-neutral-950 hover:bg-neutral-200' : 'bg-neutral-950 text-white hover:bg-neutral-800'
              }`}
            >
              {updating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              {updating ? 'Installing…' : 'Install new version'}
            </button>

            <button
              onClick={() => setDismissed(true)}
              aria-label="Remind me later"
              title="Remind me in 30 minutes"
              className={`absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full shadow ring-1 cursor-pointer ${
                dark ? 'bg-neutral-800 text-white/70 ring-white/10 hover:text-white' : 'bg-white text-neutral-400 ring-black/5 hover:text-neutral-800'
              }`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
