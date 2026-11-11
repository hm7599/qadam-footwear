import { Collection } from '../config/collection.js';
import { SettingsStore } from '../config/settingsStore.js';

/** Product prices are stored in a base unit; the shop shows Rs. = base × RATE (see client CurrencyContext). */
export const RATE = 280;
export const toBase = (rs: number) => (Number(rs) || 0) / RATE;
export const toRs = (base: number) => Math.round((Number(base) || 0) * RATE);

// ── Types ─────────────────────────────────────────────
export interface Coupon {
  id: string;
  code: string;                 // UPPERCASE, unique
  description: string;
  type: 'percent' | 'fixed' | 'free_shipping';
  value: number;                // percent (0-100) or Rs amount
  minOrderRs: number;
  maxDiscountRs: number;        // 0 = no cap
  startsAt: string | null;
  expiresAt: string | null;
  usageLimit: number;           // 0 = unlimited
  perCustomerLimit: number;     // 0 = unlimited
  productIds: string[];         // empty = all
  categories: string[];         // empty = all
  firstOrderOnly: boolean;
  stackWithSale: boolean;       // false = coupon only discounts items that are not already on sale
  showInCart: boolean;          // list it as an offer in the cart
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CouponUsage {
  id: string;
  couponId: string;
  code: string;
  orderNumber: string;
  customerKey: string;          // normalised email / phone
  customerName: string;
  discount: number;             // base units
  orderTotal: number;           // base units
  createdAt: string;
}

export interface CartItemLite { productId: string; name: string; slug: string; image: string; color: string; size: number; quantity: number; price: number }

export interface AbandonedCart {
  id: string;
  cartId: string;               // random id kept in the shopper's browser
  items: CartItemLite[];
  total: number;                // base units
  contact: { name: string; email: string; phone: string };
  consent: boolean;
  pushEndpoint: string;
  origin: string;
  status: 'active' | 'abandoned' | 'recovered' | 'converted' | 'opted_out';
  lastActivity: string;
  abandonedAt: string | null;
  remindersSent: number;
  reminderHistory: Array<{ at: string; channel: string; status: string; step: number }>;
  token: string;                // recovery / opt-out token
  tokenExpiresAt: string;
  recoveredOrder: string;
  recoveredRevenue: number;     // base units
  createdAt: string;
}

export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  size: number;
  color: string;
  email: string;
  phone: string;
  pushEndpoint: string;
  userEmail: string;            // signed-in account (for "My alerts")
  status: 'waiting' | 'notified' | 'removed';
  createdAt: string;
  notifiedAt: string | null;
}

export interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  size: number | null;
  targetPriceRs: number;        // 0 = any drop
  priceAtSignup: number;        // base
  lastNotifiedPrice: number;    // base, prevents duplicates
  email: string;
  phone: string;
  pushEndpoint: string;
  userEmail: string;
  status: 'active' | 'fulfilled' | 'removed';
  createdAt: string;
  notifiedAt: string | null;
  notifyCount: number;
}

export interface PriceChange {
  id: string;
  productId: string;
  productName: string;
  oldPrice: number;             // base
  newPrice: number;             // base
  subscribers: number;
  notified: number;
  createdAt: string;
}

export interface MarketingMessage {
  id: string;
  kind: 'abandoned_cart' | 'back_in_stock' | 'price_drop' | 'promo' | 'coupon';
  channel: 'push' | 'whatsapp' | 'email';
  to: string;
  name: string;
  subject: string;
  body: string;
  link: string;
  status: 'queued' | 'sent' | 'failed' | 'skipped';
  error: string;
  refId: string;
  dedupeKey: string;
  createdAt: string;
  sentAt: string | null;
}

// ── Collections ───────────────────────────────────────
export const Coupons = new Collection<Coupon>('Coupon', { code: { type: String, required: true, unique: true }, type: String, active: Boolean }, [[{ active: 1 }]]);
export const CouponUsages = new Collection<CouponUsage>('CouponUsage', { couponId: { type: String, index: true }, customerKey: String, orderNumber: String }, [[{ couponId: 1, customerKey: 1 }], [{ orderNumber: 1, couponId: 1 }, { unique: true }]]);
export const AbandonedCarts = new Collection<AbandonedCart>('AbandonedCart', { cartId: { type: String, unique: true }, status: String, token: { type: String, index: true } }, [[{ status: 1, lastActivity: 1 }]]);
export const StockAlerts = new Collection<StockAlert>('StockAlertSubscription', { productId: String, size: Number, status: String }, [[{ productId: 1, size: 1, status: 1 }]]);
export const PriceAlerts = new Collection<PriceAlert>('PriceDropSubscription', { productId: String, status: String }, [[{ productId: 1, status: 1 }]]);
export const PriceChanges = new Collection<PriceChange>('PriceChangeHistory', { productId: String }, [[{ productId: 1, createdAt: -1 }]]);
export const Messages = new Collection<MarketingMessage>('MarketingNotificationLog', { dedupeKey: { type: String, unique: true }, status: String, kind: String }, [[{ status: 1, channel: 1 }]]);

// ── Settings (stored with the existing SettingsStore) ─
export interface ShippingSettings {
  enabled: boolean;
  thresholdRs: number;
  standardFeeRs: number;
  expressFeeRs: number;
  eligibleCategories: string[];   // empty = all
  eligibleProducts: string[];     // empty = all (within categories)
  excludedProducts: string[];
  combineWithCoupons: boolean;    // if false, a discount coupon cancels free delivery
  campaigns: Array<{ id: string; name: string; thresholdRs: number; startsAt: string | null; endsAt: string | null; active: boolean }>;
}

export const DEFAULT_SHIPPING: ShippingSettings = {
  enabled: true,
  thresholdRs: 84000,       // matches the old hard-coded 300 base units
  standardFeeRs: 7000,      // old 25 base units
  expressFeeRs: 4200,       // old 15 base units (express fee)
  eligibleCategories: [],
  eligibleProducts: [],
  excludedProducts: [],
  combineWithCoupons: true,
  campaigns: [],
};

export interface RecoverySettings {
  enabled: boolean;
  abandonAfterMinutes: number;
  reminderHours: number[];        // hours after abandonment, one reminder per step
  channels: { push: boolean; whatsapp: boolean; email: boolean };
  tokenDays: number;
  siteUrl: string;                // optional public URL used in links
}

export const DEFAULT_RECOVERY: RecoverySettings = {
  enabled: true,
  abandonAfterMinutes: 60,
  reminderHours: [1, 24],
  channels: { push: true, whatsapp: true, email: true },
  tokenDays: 7,
  siteUrl: '',
};

export type TemplateKey = 'abandoned_cart' | 'back_in_stock' | 'price_drop' | 'promo' | 'coupon';
export type Templates = Record<TemplateKey, { subject: string; body: string }>;

export const DEFAULT_TEMPLATES: Templates = {
  abandoned_cart: {
    subject: 'Your QADAM bag is waiting',
    body: 'Hi {{customer_name}}! You left some beautiful QADAM shoes in your shopping bag. Your selected items are waiting for you.\n\nContinue shopping: {{recovery_link}}\n\nThank you for choosing QADAM.\n\nNo more reminders: {{opt_out_link}}',
  },
  back_in_stock: {
    subject: '{{product_name}} is back in stock',
    body: 'Good news {{customer_name}}! {{product_name}} in size {{size}} ({{color}}) is back in stock.\n\nGet yours before it sells out: {{product_url}}',
  },
  price_drop: {
    subject: 'Price drop: {{product_name}}',
    body: 'Hi {{customer_name}}! {{product_name}} is now {{price}} (was {{old_price}}).\n\nShop now: {{product_url}}',
  },
  promo: {
    subject: 'A little something from QADAM',
    body: 'Hi {{customer_name}}! {{message}}\n\nShop now: {{shop_url}}',
  },
  coupon: {
    subject: 'Your QADAM code: {{coupon_code}}',
    body: 'Hi {{customer_name}}! Use code *{{coupon_code}}* for {{coupon_offer}} on QADAM.\n\nShop now: {{shop_url}}',
  },
};

async function getMerged<T extends object>(key: string, defaults: T): Promise<T> {
  const saved = await SettingsStore.get(key);
  return { ...defaults, ...(saved && typeof saved === 'object' ? saved : {}) };
}

export const getShipping = () => getMerged('shipping', DEFAULT_SHIPPING);
export const getRecovery = async () => {
  const r = await getMerged('cartRecovery', DEFAULT_RECOVERY);
  return { ...r, channels: { ...DEFAULT_RECOVERY.channels, ...(r.channels || {}) } };
};
export const getTemplates = async (): Promise<Templates> => {
  const saved = (await SettingsStore.get('marketingTemplates')) || {};
  const out: any = {};
  for (const k of Object.keys(DEFAULT_TEMPLATES) as TemplateKey[]) out[k] = { ...DEFAULT_TEMPLATES[k], ...(saved[k] || {}) };
  return out;
};

export const fillTemplate = (text: string, vars: Record<string, string | number>) =>
  text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : ''));

export const formatRs = (base: number) => `Rs. ${toRs(base).toLocaleString('en-PK')}`;

/** Normalise an email / phone so limits and duplicates are matched reliably. */
export const normEmail = (e: any) => String(e || '').trim().toLowerCase();
export const normPhone = (p: any) => {
  let d = String(p || '').replace(/\D/g, '');
  if (d.startsWith('0') && d.length === 11) d = '92' + d.slice(1); // 03001234567 → 923001234567
  return d;
};
export const customerKeys = (c: { email?: string; phone?: string }) =>
  [normEmail(c.email), normPhone(c.phone)].filter(Boolean);

export const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
export const isValidPhone = (p: string) => normPhone(p).length >= 10 && normPhone(p).length <= 15;
