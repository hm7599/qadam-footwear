import { useEffect, useState } from 'react';

/**
 * The site ships two separate installable apps on the same domain:
 *  - Customer store  → /manifest.json        (scope "/")
 *  - Admin panel     → /manifest-admin.json  (scope "/admin")
 * index.html picks the right one on first load; this keeps it correct during in-app navigation.
 */
export function applyPwaMode(isAdmin: boolean) {
  const set = (id: string, attr: string, value: string) => {
    const el = document.getElementById(id);
    if (el && el.getAttribute(attr) !== value) el.setAttribute(attr, value);
  };
  set('app-manifest', 'href', isAdmin ? '/manifest-admin.json' : '/manifest.json');
  set('app-theme', 'content', isAdmin ? '#0a0a0a' : '#ffffff');
  set('app-apple-title', 'content', isAdmin ? 'QADAM Admin' : "QADAM Men's Footwear");
  set('app-apple-icon', 'href', isAdmin ? '/icons/admin-192.png' : '/icons/apple-touch-icon.png');
}

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

// The browser fires this event once per page load, so capture it globally as early as possible
let deferredPrompt: any = null;
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e;
    listeners.forEach(l => l());
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    listeners.forEach(l => l());
  });
}

/** Hook: whether the app can be installed right now, and a function to show the install dialog */
export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(!!deferredPrompt);

  useEffect(() => {
    const update = () => setCanInstall(!!deferredPrompt);
    listeners.add(update);
    update();
    return () => { listeners.delete(update); };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    setCanInstall(false);
    return outcome === 'accepted';
  };

  return { canInstall, install, installed: isStandalone() };
}
