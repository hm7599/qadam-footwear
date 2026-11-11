// Calls for the marketing features (coupons, free delivery, abandoned carts, stock & price alerts)
const BASE = '/api/marketing';

const headers = (): HeadersInit => {
  let t: string | null = null;
  try { t = localStorage.getItem('aura_token'); } catch { /* ignore */ }
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
};

async function call<T = any>(path: string, opts: RequestInit = {}): Promise<{ data: T; message?: string }> {
  const res = await fetch(BASE + path, { ...opts, headers: { ...headers(), ...(opts.headers || {}) } });
  const text = await res.text();
  let json: any = {};
  try { json = text ? JSON.parse(text) : {}; } catch { throw new Error(`Unexpected reply from server (${res.status}).`); }
  if (!res.ok || json.success === false) throw new Error(json.message || `Request failed (${res.status}).`);
  return { data: json.data, message: json.message };
}

const get = <T = any>(p: string) => call<T>(p).then(r => r.data);
const send = <T = any>(method: string, p: string, body?: any) =>
  call<T>(p, { method, body: body === undefined ? undefined : JSON.stringify(body) });

// ── Types
export interface Quote {
  lines: Array<{ productId: string; name: string; price: number; listPrice: number; onSale: boolean; quantity: number; size: number; color: string; lineTotal: number }>;
  errors: string[];
  subtotal: number;
  discount: number;
  shippingMethod: 'standard' | 'express';
  shippingCost: number;
  standardFee: number;
  expressFee: number;
  total: number;
  coupon: null | { code: string; type: string; description: string; offer: string; discount: number };
  couponError: string;
  freeShipping: { enabled: boolean; threshold: number; eligibleSubtotal: number; remaining: number; unlocked: boolean; byCoupon: boolean; hasExcluded: boolean; blockedByCoupon: boolean; campaign: string };
}

export interface Offer { code: string; description: string; offer: string; minOrderRs: number; expiresAt: string | null }
export interface ShippingInfo { enabled: boolean; threshold: number; thresholdRs: number; campaign: string; standardFee: number; expressFee: number }

export const marketingApi = {
  // public
  quote: (body: any) => send<Quote>('POST', '/quote', body).then(r => r.data),
  offers: () => get<Offer[]>('/offers'),
  shippingInfo: () => get<ShippingInfo>('/shipping-info'),
  syncCart: (body: any) => send('POST', '/cart', body),
  recover: (token: string) => get<{ items: Array<{ productId: string; color: string; size: number; quantity: number }> }>(`/recover/${encodeURIComponent(token)}`),
  stockAlert: (body: any) => send('POST', '/stock-alerts', body),
  priceAlert: (body: any) => send('POST', '/price-alerts', body),
  myAlerts: () => get<{ stock: any[]; price: any[] }>('/my-alerts'),
  removeMyAlert: (type: 'stock' | 'price', id: string) => send('DELETE', `/my-alerts/${type}/${id}`),

  // admin
  dashboard: () => get('/dashboard'),
  coupons: () => get<any[]>('/coupons'),
  generateCode: () => get<{ code: string }>('/coupons/generate-code'),
  createCoupon: (c: any) => send('POST', '/coupons', c),
  updateCoupon: (id: string, c: any) => send('PUT', `/coupons/${id}`, c),
  deleteCoupon: (id: string) => send('DELETE', `/coupons/${id}`),
  couponUsage: (id: string) => get<any[]>(`/coupons/${id}/usage`),
  announceCoupon: (id: string) => send('POST', `/coupons/${id}/announce`, {}),
  sendPromo: (body: any) => send('POST', '/promo', body),
  promoAudience: () => get<{ pushCount: number; whatsappCount: number; emailCount: number; totalReach: number; activePromotion: any }>('/promo-audience'),
  activePromo: () => get<any>('/active-promo'),
  clearActivePromo: () => send('DELETE', '/active-promo', {}),
  getSettings: <T = any>(name: 'shipping' | 'recovery' | 'templates') => get<T>(`/settings/${name}`),
  saveSettings: (name: 'shipping' | 'recovery' | 'templates', v: any) => send('PUT', `/settings/${name}`, v),
  carts: () => get<any[]>('/carts'),
  remindCart: (id: string) => send('POST', `/carts/${id}/remind`, {}),
  stockAlerts: () => get<any[]>('/stock-alerts'),
  notifyStock: (id: string, force = false) => send('POST', `/stock-alerts/${id}/notify`, { force }),
  removeStock: (id: string) => send('DELETE', `/stock-alerts/${id}`),
  priceAlerts: () => get<{ products: any[]; subscriptions: any[]; history: any[] }>('/price-alerts'),
  notifyPrice: (id: string) => send('POST', `/price-alerts/${id}/notify`, {}),
  removePrice: (id: string) => send('DELETE', `/price-alerts/${id}`),
  messages: (status = '') => get<any[]>(`/messages${status ? `?status=${status}` : ''}`),
  markMessage: (id: string, action: 'sent' | 'skip') => send('POST', `/messages/${id}/${action}`, {}),
};

/** The current browser's push endpoint, if the shopper allowed notifications */
export async function currentPushEndpoint(): Promise<string> {
  try {
    if (!('serviceWorker' in navigator)) return '';
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    return sub?.endpoint || '';
  } catch {
    return '';
  }
}
