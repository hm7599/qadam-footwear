import { DataStore } from '../config/store.js';
import {
  Coupon, Coupons, CouponUsages, getShipping, toBase, toRs, customerKeys, normEmail, normPhone,
} from './store.js';

export interface QuoteInputItem { productId: string; size: number; color: string; quantity: number }
export interface QuoteInput {
  items: QuoteInputItem[];
  couponCode?: string;
  shippingMethod?: 'standard' | 'express';
  customer?: { email?: string; phone?: string };
  forOrder?: boolean;                 // stricter checks when actually placing the order
}

export interface QuoteLine {
  productId: string; name: string; slug: string; image: string; category: string;
  color: string; size: number; quantity: number;
  price: number; listPrice: number; onSale: boolean; lineTotal: number;
}

// Keep enough precision so Rs amounts (stored ÷ 280) convert back exactly
const round2 = (n: number) => Math.round(n * 1e6) / 1e6;

/** Effective selling price of a product in base units */
export const sellingPrice = (p: any) => {
  const sale = Number(p.salePrice);
  return sale > 0 && sale < Number(p.price) ? sale : Number(p.price);
};

/** Units of a size left; null = stock is not tracked per size for this product */
export const sizeStockLeft = (p: any, size: number): number | null => {
  const ss = p.sizeStock;
  if (!ss || typeof ss !== 'object') return null;
  const v = ss instanceof Map ? ss.get(String(size)) : ss[String(size)];
  return v === undefined || v === null || v === '' ? null : Math.max(0, Number(v) || 0);
};

async function countPastOrders(keys: string[]) {
  if (!keys.length) return 0;
  const orders: any[] = await DataStore.getOrders({});
  return orders.filter(o =>
    o.orderStatus !== 'cancelled' &&
    (keys.includes(normEmail(o.customer?.email)) || keys.includes(normPhone(o.customer?.phone)))
  ).length;
}

export const describeCoupon = (c: Coupon) =>
  c.type === 'percent' ? `${c.value}% off`
    : c.type === 'fixed' ? `Rs. ${Number(c.value).toLocaleString('en-PK')} off`
    : 'free delivery';

const couponAppliesTo = (c: Coupon, l: QuoteLine) =>
  (!c.productIds?.length || c.productIds.includes(l.productId)) &&
  (!c.categories?.length || c.categories.includes(l.category)) &&
  (c.stackWithSale || !l.onSale);

/** Checks a coupon against the cart. Returns an error message, or the discount result. */
export async function evaluateCoupon(
  coupon: Coupon | undefined,
  lines: QuoteLine[],
  subtotal: number,
  customer: { email?: string; phone?: string } | undefined,
  forOrder: boolean,
): Promise<{ error: string } | { discount: number; freeShipping: boolean; coupon: Coupon }> {
  if (!coupon) return { error: 'This code is not valid.' };
  const now = Date.now();
  if (!coupon.active) return { error: 'This code is no longer active.' };
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) return { error: 'This code is not active yet.' };
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now) return { error: 'This code has expired.' };

  const usages = await CouponUsages.find(u => u.couponId === coupon.id);
  if (coupon.usageLimit > 0 && usages.length >= coupon.usageLimit) return { error: 'This code has reached its usage limit.' };

  const keys = customerKeys(customer || {});
  if (forOrder && (coupon.perCustomerLimit > 0 || coupon.firstOrderOnly) && !keys.length) {
    return { error: 'Please enter your email or phone to use this code.' };
  }
  if (coupon.perCustomerLimit > 0 && keys.length) {
    const mine = usages.filter(u => keys.includes(u.customerKey)).length;
    if (mine >= coupon.perCustomerLimit) return { error: 'You have already used this code.' };
  }
  if (coupon.firstOrderOnly && keys.length && (await countPastOrders(keys)) > 0) {
    return { error: 'This code is only for your first order.' };
  }

  if (coupon.minOrderRs > 0 && toRs(subtotal) < coupon.minOrderRs) {
    return { error: `Add Rs. ${(coupon.minOrderRs - toRs(subtotal)).toLocaleString('en-PK')} more to use this code (minimum Rs. ${Number(coupon.minOrderRs).toLocaleString('en-PK')}).` };
  }

  const eligible = lines.filter(l => couponAppliesTo(coupon, l));
  const eligibleSum = eligible.reduce((s, l) => s + l.lineTotal, 0);
  if (coupon.type !== 'free_shipping' && eligibleSum <= 0) {
    return { error: coupon.stackWithSale ? 'This code does not apply to the items in your bag.' : 'This code does not apply to sale items or the items in your bag.' };
  }

  let discount = 0;
  if (coupon.type === 'percent') discount = eligibleSum * Math.min(100, Math.max(0, coupon.value)) / 100;
  if (coupon.type === 'fixed') discount = toBase(coupon.value);
  if (coupon.maxDiscountRs > 0) discount = Math.min(discount, toBase(coupon.maxDiscountRs));
  discount = round2(Math.max(0, Math.min(discount, eligibleSum))); // never more than the items it applies to

  return { discount, freeShipping: coupon.type === 'free_shipping', coupon };
}

export async function findCouponByCode(code: string) {
  const clean = String(code || '').trim().toUpperCase();
  if (!clean) return undefined;
  return Coupons.findOne(c => c.code === clean);
}

/** Active free-delivery threshold (a running campaign can lower or change it). */
export function activeThreshold(s: Awaited<ReturnType<typeof getShipping>>) {
  const now = Date.now();
  const running = (s.campaigns || []).filter(c =>
    c.active && (!c.startsAt || new Date(c.startsAt).getTime() <= now) && (!c.endsAt || new Date(c.endsAt).getTime() >= now));
  if (!running.length) return { thresholdRs: Number(s.thresholdRs) || 0, campaign: '' };
  const best = running.reduce((a, b) => (Number(b.thresholdRs) < Number(a.thresholdRs) ? b : a));
  return { thresholdRs: Number(best.thresholdRs) || 0, campaign: best.name };
}

export async function quote(input: QuoteInput) {
  const errors: string[] = [];
  const lines: QuoteLine[] = [];

  for (const raw of (input.items || []).slice(0, 50)) {
    const qty = Math.floor(Number(raw.quantity));
    if (!raw?.productId || !(qty > 0) || qty > 20) { errors.push('Invalid quantity in bag.'); continue; }
    const p: any = await DataStore.getProductByIdOrSlug(String(raw.productId));
    if (!p || p.status === 'draft') { errors.push('An item in your bag is no longer available.'); continue; }
    const size = Number(raw.size);
    // Only enforce the size list when the product has EU sizes (older products store US sizes and
    // the website then offers every standard EU size — same rule as the product page).
    const euSizes = Array.isArray(p.sizes) ? p.sizes.filter((s: number) => s >= 30) : [];
    if (input.forOrder && euSizes.length && !euSizes.includes(size)) {
      errors.push(`${p.name}: size ${size} is not available.`); continue;
    }
    const left = sizeStockLeft(p, size);
    if (input.forOrder && left !== null && left < qty) {
      errors.push(left === 0 ? `${p.name} (size ${size}) is out of stock.` : `Only ${left} left of ${p.name} (size ${size}).`); continue;
    }
    const price = sellingPrice(p);
    const color = String(raw.color || p.colors?.[0]?.name || 'Standard');
    const variant = (p.colors || []).find((c: any) => c.name === color);
    lines.push({
      productId: p.id || String(p._id), name: p.name, slug: p.slug, category: p.category,
      image: variant?.previewImage || p.images?.[0] || '',
      color, size, quantity: qty,
      price, listPrice: Number(p.price), onSale: price < Number(p.price),
      lineTotal: round2(price * qty),
    });
  }

  const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));

  // Coupon
  let discount = 0;
  let couponFreeShipping = false;
  let applied: null | { code: string; type: string; description: string; offer: string; discount: number } = null;
  let couponError = '';
  if (input.couponCode) {
    const c = await findCouponByCode(input.couponCode);
    const r = await evaluateCoupon(c, lines, subtotal, input.customer, !!input.forOrder);
    if ('error' in r) couponError = r.error;
    else {
      discount = r.discount;
      couponFreeShipping = r.freeShipping;
      applied = { code: r.coupon.code, type: r.coupon.type, description: r.coupon.description, offer: describeCoupon(r.coupon), discount };
    }
  }

  // Shipping
  const s = await getShipping();
  const { thresholdRs, campaign } = activeThreshold(s);
  const isEligible = (l: QuoteLine) =>
    !(s.excludedProducts || []).includes(l.productId) &&
    (!(s.eligibleCategories || []).length || s.eligibleCategories.includes(l.category)) &&
    (!(s.eligibleProducts || []).length || s.eligibleProducts.includes(l.productId));
  const eligibleSubtotal = round2(lines.filter(isEligible).reduce((a, l) => a + l.lineTotal, 0));
  const hasExcluded = lines.some(l => !isEligible(l));
  const threshold = toBase(thresholdRs);
  const reached = s.enabled && threshold > 0 && eligibleSubtotal >= threshold - 1e-9;
  const blockedByCoupon = reached && !s.combineWithCoupons && !!applied && applied.type !== 'free_shipping' && discount > 0;
  const freeByThreshold = reached && !blockedByCoupon;

  const method = input.shippingMethod === 'express' ? 'express' : 'standard';
  const standardFee = toBase(s.standardFeeRs);
  const expressFee = toBase(s.expressFeeRs);
  let shippingCost = 0;
  if (lines.length) {
    if (method === 'express') shippingCost = expressFee;
    else shippingCost = freeByThreshold || couponFreeShipping ? 0 : standardFee;
  }
  if (applied && applied.type === 'free_shipping' && method === 'standard') applied.discount = round2(standardFee);

  const total = round2(Math.max(0, subtotal - discount) + shippingCost);

  return {
    lines,
    errors,
    subtotal,
    discount,
    shippingMethod: method,
    shippingCost: round2(shippingCost),
    standardFee: round2(standardFee),
    expressFee: round2(expressFee),
    total,
    coupon: applied,
    couponError,
    freeShipping: {
      enabled: s.enabled && threshold > 0,
      threshold,
      eligibleSubtotal,
      remaining: round2(Math.max(0, threshold - eligibleSubtotal)),
      unlocked: freeByThreshold || couponFreeShipping,
      byCoupon: couponFreeShipping && !freeByThreshold,
      hasExcluded,
      blockedByCoupon,
      campaign,
    },
  };
}

/** Public offers shown in the cart */
export async function publicOffers() {
  const now = Date.now();
  const list = await Coupons.find(c => c.active && (c as any).showInCart &&
    (!c.startsAt || new Date(c.startsAt).getTime() <= now) && (!c.expiresAt || new Date(c.expiresAt).getTime() >= now));
  return list.map(c => ({ code: c.code, description: c.description || describeCoupon(c), offer: describeCoupon(c), minOrderRs: c.minOrderRs, expiresAt: c.expiresAt }));
}
