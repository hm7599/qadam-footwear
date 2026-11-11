import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Share, X } from 'lucide-react';
import { useInstallPrompt, isIOS, isStandalone } from '../../utils/pwa';

const DISMISS_KEY = 'aura_install_dismissed_at';
const DISMISS_DAYS = 7;

const recentlyDismissed = () => {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return Date.now() - t < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

/** Small bottom banner inviting customers to install the store as an app */
export const InstallAppBanner: React.FC = () => {
  const { canInstall, install } = useInstallPrompt();
  const [show, setShow] = useState(false);
  const ios = isIOS();

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;
    if (!canInstall && !ios) return;
    const t = setTimeout(() => setShow(true), 8000); // don't interrupt right away
    return () => clearTimeout(t);
  }, [canInstall, ios]);

  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
  };

  const handleInstall = async () => {
    const ok = await install();
    if (ok) setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="fixed bottom-4 left-4 z-40 w-[calc(100vw-2rem)] max-w-sm rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/5 max-sm:bottom-24"
        >
          <button
            onClick={dismiss}
            aria-label="Close"
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3 pr-6">
            <img src="/icons/icon-192.png" alt="" className="h-12 w-12 rounded-xl" />
            <div>
              <p className="text-sm font-semibold text-neutral-900">Get the QADAM app</p>
              <p className="text-xs text-neutral-500">Faster shopping, order updates and offers.</p>
            </div>
          </div>

          {ios && !canInstall ? (
            <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
              Tap <Share className="h-3.5 w-3.5" /> then <b>“Add to Home Screen”</b>
            </p>
          ) : (
            <button
              onClick={handleInstall}
              className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 text-xs font-semibold uppercase tracking-wider text-white hover:bg-neutral-800 cursor-pointer"
            >
              <Download className="h-4 w-4" /> Install App
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
