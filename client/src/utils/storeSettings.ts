import { useEffect, useState } from 'react';
import { api } from './api';

// ── Store information (Admin → Settings → Store information) ──
export interface StoreBranch { city: string; name: string; address: string; hours: string; phone: string }
export interface StoreInfo {
  storeName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  hours: string;
  mapsUrl: string;
  branches: StoreBranch[];
  socials: { instagram: string; facebook: string; tiktok: string; youtube: string };
}

export const DEFAULT_STORE: StoreInfo = {
  storeName: "QADAM Men's Footwear",
  email: 'support@qadamshoes.com',
  phone: '+92 300 8888000',
  address: 'Online Footwear Atelier',
  city: 'Lahore, Pakistan (Online Operations)',
  hours: 'Online Orders: 24/7 | WhatsApp Support: 10:00 – 22:00',
  mapsUrl: '',
  branches: [],
  socials: { instagram: 'https://instagram.com', facebook: 'https://facebook.com', tiktok: 'https://tiktok.com', youtube: '' },
};

export const normalizeStore = (raw: any): StoreInfo => ({
  ...DEFAULT_STORE,
  ...(raw && typeof raw === 'object' ? raw : {}),
  branches: Array.isArray(raw?.branches) ? raw.branches : DEFAULT_STORE.branches,
  socials: { ...DEFAULT_STORE.socials, ...(raw?.socials || {}) },
});

// ── Payments (Admin → Settings → Payments) ──
export interface PaymentSettings {
  codEnabled: boolean;
  codNote: string;
  onlineEnabled: boolean;
  bank: { enabled: boolean; bankName: string; accountTitle: string; accountNumber: string; iban: string };
  easypaisa: { enabled: boolean; accountTitle: string; number: string };
  jazzcash: { enabled: boolean; accountTitle: string; number: string };
  raast: { enabled: boolean; raastId: string };
  instructions: string;
}

export const DEFAULT_PAYMENTS: PaymentSettings = {
  codEnabled: true,
  codNote: 'Pay in cash when your order arrives.',
  onlineEnabled: true,
  bank: { enabled: true, bankName: '', accountTitle: '', accountNumber: '', iban: '' },
  easypaisa: { enabled: false, accountTitle: '', number: '' },
  jazzcash: { enabled: false, accountTitle: '', number: '' },
  raast: { enabled: false, raastId: '' },
  instructions: 'After placing your order, send the payment screenshot with your order number on WhatsApp. We confirm and ship.',
};

export const normalizePayments = (raw: any): PaymentSettings => {
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    ...DEFAULT_PAYMENTS, ...r,
    bank: { ...DEFAULT_PAYMENTS.bank, ...(r.bank || {}) },
    easypaisa: { ...DEFAULT_PAYMENTS.easypaisa, ...(r.easypaisa || {}) },
    jazzcash: { ...DEFAULT_PAYMENTS.jazzcash, ...(r.jazzcash || {}) },
    raast: { ...DEFAULT_PAYMENTS.raast, ...(r.raast || {}) },
  };
};

/** Names of the online methods that are switched on, e.g. ["Bank Transfer", "Easypaisa"] */
export const onlineMethodNames = (p: PaymentSettings) => [
  p.bank.enabled && 'Bank Transfer', p.easypaisa.enabled && 'Easypaisa', p.jazzcash.enabled && 'JazzCash', p.raast.enabled && 'Raast',
].filter(Boolean) as string[];

// ── Hooks (cached for the session, refreshed when an admin saves) ──
const cache: Record<string, any> = {};
function useSetting<T>(key: string, normalize: (r: any) => T): T {
  const [v, setV] = useState<T>(() => normalize(cache[key]));
  useEffect(() => {
    let alive = true;
    const load = () => api.getSetting(key).then(r => { cache[key] = r; if (alive) setV(normalize(r)); }).catch(() => {});
    if (cache[key] === undefined) load();
    const onSaved = (e: Event) => { if ((e as CustomEvent).detail === key) load(); };
    window.addEventListener('qadam-settings-saved', onSaved);
    return () => { alive = false; window.removeEventListener('qadam-settings-saved', onSaved); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return v;
}
export const useStoreInfo = () => useSetting('store', normalizeStore);
export const usePaymentSettings = () => useSetting('payments', normalizePayments);
export const notifySettingsSaved = (key: string) => window.dispatchEvent(new CustomEvent('qadam-settings-saved', { detail: key }));
