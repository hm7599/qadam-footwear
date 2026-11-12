import { Router, Request } from 'express';
import crypto from 'crypto';
import { protect, adminOnly, AuthenticatedRequest } from '../middleware/auth.js';
import { DataStore } from '../config/store.js';
import { SettingsStore } from '../config/settingsStore.js';
import {
  Coupons, CouponUsages, AbandonedCarts, StockAlerts, PriceAlerts, PriceChanges, Messages, Coupon,
  getShipping, getRecovery, getTemplates, DEFAULT_SHIPPING, DEFAULT_RECOVERY, DEFAULT_TEMPLATES, TemplateKey,
  toBase, toRs, normEmail, normPhone, isValidEmail, isValidPhone, fillTemplate,
} from '../marketing/store.js';
import { quote, publicOffers, activeThreshold, describeCoupon, sellingPrice } from '../marketing/pricing.js';
import { syncCart, cartForToken, optOut, sendCartReminder } from '../marketing/recovery.js';
import { sizeAvailable, notifyStockAlert, notifyPriceAlert, siteBase } from '../marketing/alerts.js';
import { dispatch, sendLink } from '../marketing/notifier.js';

const router = Router();
const admin = [protect, adminOnly];
const ok = (res: any, data: any, message?: string) => res.json({ success: true, data, ...(message ? { message } : {}) });
const fail = (res: any, code: number, message: string) => res.status(code).json({ success: false, message });
const wrap = (fn: (req: any, res: any) => Promise<any>) => (req: any, res: any) =>
  fn(req, res).catch((e: any) => { console.warn('[Marketing API]', e); fail(res, 500, e.message || 'Something went wrong.'); });

/** Very small rate limit for public sign-up endpoints */
const hits = new Map<string, number[]>();
const limited = (req: Request, max = 20, windowMs = 10 * 60000) => {
  const key = `${req.path}:${req.ip}`;
  const now = Date.now();
  const list = (hits.get(key) || []).filter(t => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  return list.length > max;
};
const originOf = (req: Request) => String(req.headers.origin || '').replace(/\/$/, '');

// ════════════════ PUBLIC (website) ════════════════

// Price a bag on the server (coupon, delivery, totals)
router.post('/quote', wrap(async (req, res) => {
  const { items, couponCode, shippingMethod, customer } = req.body || {};
  if (!Array.isArray(items)) return fail(res, 400, 'Items are required.');
  ok(res, await quote({ items, couponCode, shippingMethod, customer }));
}));

router.get('/offers', wrap(async (_req, res) => ok(res, await publicOffers())));

router.get('/shipping-info', wrap(async (_req, res) => {
  const s = await getShipping();
  const { thresholdRs, campaign } = activeThreshold(s);
  ok(res, { enabled: s.enabled && thresholdRs > 0, threshold: toBase(thresholdRs), thresholdRs, campaign, standardFee: toBase(s.standardFeeRs), expressFee: toBase(s.expressFeeRs) });
}));

// Save the shopper's bag for abandoned-cart recovery
router.post('/cart', wrap(async (req, res) => {
  if (limited(req, 120)) return fail(res, 429, 'Too many requests.');
  const { cartId, items, contact, consent, pushEndpoint } = req.body || {};
  await syncCart({ cartId, items: Array.isArray(items) ? items : [], contact, consent, pushEndpoint, origin: originOf(req) });
  ok(res, { saved: true });
}));

router.get('/recover/:token', wrap(async (req, res) => {
  const items = await cartForToken(String(req.params.token));
  if (!items) return fail(res, 404, 'This link has expired. Your bag could not be restored.');
  ok(res, { items });
}));

router.get('/opt-out/:token', wrap(async (req, res) => {
  const done = await optOut(String(req.params.token));
  res.set('Content-Type', 'text/html; charset=utf-8').send(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>QADAM Men's Footwear</title>
<body style="font-family:system-ui,sans-serif;background:#FAF8F5;color:#1a1a1a;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px">
<div style="max-width:420px;text-align:center"><h1 style="font-family:Georgia,serif;font-weight:500">${done ? 'You are unsubscribed' : 'Link not found'}</h1>
<p style="color:#666">${done ? 'You will not receive any more bag reminders from QADAM Men\'s Footwear.' : 'This link is not valid.'}</p>
<a href="/" style="color:#8A6A45">Back to QADAM Men's Footwear</a></div></body>`);
}));

const contactFrom = (b: any) => ({
  email: isValidEmail(normEmail(b.email)) ? normEmail(b.email) : '',
  phone: isValidPhone(String(b.phone || '')) ? String(b.phone).trim() : '',
  pushEndpoint: typeof b.pushEndpoint === 'string' ? b.pushEndpoint.slice(0, 600) : '',
});

// Back-in-stock sign-up (only for sizes that are really sold out)
router.post('/stock-alerts', wrap(async (req: AuthenticatedRequest, res) => {
  if (limited(req)) return fail(res, 429, 'Too many requests. Please try again later.');
  const { productId, size, color } = req.body || {};
  const c = contactFrom(req.body || {});
  if (!c.email && !c.phone) return fail(res, 400, 'Please enter a valid email or phone number.');
  const p: any = await DataStore.getProductByIdOrSlug(String(productId || ''));
  if (!p) return fail(res, 404, 'Product not found.');
  const sz = Number(size);
  if (sizeAvailable(p, sz)) return fail(res, 400, 'This size is in stock — you can order it now.');
  const pid = p.id || String(p._id);
  const dup = await StockAlerts.findOne(a => a.productId === pid && a.size === sz && a.status === 'waiting' &&
    ((!!c.email && a.email === c.email) || (!!c.phone && a.phone === c.phone)));
  if (dup) return ok(res, { id: dup.id }, 'You are already on the list for this size.');
  const a = await StockAlerts.insert({
    productId: pid, productName: p.name, productSlug: p.slug, productImage: p.images?.[0] || '',
    size: sz, color: String(color || '').slice(0, 40), ...c, userEmail: normEmail(req.body?.userEmail),
    status: 'waiting', createdAt: new Date().toISOString(), notifiedAt: null, origin: originOf(req),
  } as any);
  ok(res, { id: a.id }, "We'll let you know as soon as it's back.");
}));

// Price-drop sign-up
router.post('/price-alerts', wrap(async (req, res) => {
  if (limited(req)) return fail(res, 429, 'Too many requests. Please try again later.');
  const { productId, targetPriceRs, size } = req.body || {};
  const c = contactFrom(req.body || {});
  if (!c.email && !c.phone) return fail(res, 400, 'Please enter a valid email or phone number.');
  const p: any = await DataStore.getProductByIdOrSlug(String(productId || ''));
  if (!p) return fail(res, 404, 'Product not found.');
  const current = sellingPrice(p);
  const target = Math.max(0, Math.round(Number(targetPriceRs) || 0));
  if (target && target >= toRs(current)) return fail(res, 400, `Target price must be lower than the current price (Rs. ${toRs(current).toLocaleString('en-PK')}).`);
  const pid = p.id || String(p._id);
  const dup = await PriceAlerts.findOne(a => a.productId === pid && a.status === 'active' &&
    ((!!c.email && a.email === c.email) || (!!c.phone && a.phone === c.phone)));
  if (dup) {
    await PriceAlerts.update(dup.id, { targetPriceRs: target });
    return ok(res, { id: dup.id }, 'Your price alert was updated.');
  }
  const a = await PriceAlerts.insert({
    productId: pid, productName: p.name, productSlug: p.slug, productImage: p.images?.[0] || '',
    size: size ? Number(size) : null, targetPriceRs: target, priceAtSignup: current, lastNotifiedPrice: 0,
    ...c, userEmail: normEmail(req.body?.userEmail), status: 'active', createdAt: new Date().toISOString(),
    notifiedAt: null, notifyCount: 0, origin: originOf(req),
  } as any);
  ok(res, { id: a.id }, "We'll tell you when the price drops.");
}));

// Signed-in customer: my alerts (matched by account email)
router.get('/my-alerts', protect, wrap(async (req: AuthenticatedRequest, res) => {
  const email = normEmail(req.user?.email);
  const mine = (a: any) => a.email === email || a.userEmail === email;
  ok(res, {
    stock: (await StockAlerts.find(a => mine(a) && a.status !== 'removed')),
    price: (await PriceAlerts.find(a => mine(a) && a.status !== 'removed')).map(a => ({ ...a, pushEndpoint: undefined })),
  });
}));

router.delete('/my-alerts/:type/:id', protect, wrap(async (req: AuthenticatedRequest, res) => {
  const email = normEmail(req.user?.email);
  const col: any = req.params.type === 'price' ? PriceAlerts : StockAlerts;
  const a = await col.get(String(req.params.id));
  if (!a || (a.email !== email && a.userEmail !== email)) return fail(res, 404, 'Alert not found.');
  await col.update(a.id, { status: 'removed' });
  ok(res, { removed: true });
}));

// ════════════════ ADMIN ════════════════

router.get('/dashboard', ...admin, wrap(async (_req, res) => {
  const [coupons, usages, carts, stock, price, msgs] = await Promise.all([
    Coupons.all(), CouponUsages.all(), AbandonedCarts.all(), StockAlerts.all(), PriceAlerts.all(), Messages.all(),
  ]);
  const now = Date.now();
  ok(res, {
    activeCoupons: coupons.filter(c => c.active && (!c.expiresAt || new Date(c.expiresAt).getTime() >= now)).length,
    couponUses: usages.length,
    totalDiscount: usages.reduce((s, u) => s + (u.discount || 0), 0),
    abandonedCarts: carts.filter(c => c.status === 'abandoned').length,
    recoveredCarts: carts.filter(c => c.status === 'recovered').length,
    recoveredRevenue: carts.reduce((s, c) => s + (c.recoveredRevenue || 0), 0),
    activeStockAlerts: stock.filter(a => a.status === 'waiting').length,
    priceDropSubscribers: price.filter(a => a.status === 'active').length,
    notificationsSent: msgs.filter(m => m.status === 'sent').length,
    queuedMessages: msgs.filter(m => m.status === 'queued').length,
  });
}));

// ── Coupons
const CODE_RE = /^[A-Z0-9_-]{3,30}$/;
const randomCode = () => 'QDM-' + crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);

function cleanCoupon(b: any, existing?: Coupon): { error: string } | Omit<Coupon, 'id' | 'createdAt'> {
  const code = String(b.code ?? existing?.code ?? '').trim().toUpperCase();
  if (!CODE_RE.test(code)) return { error: 'Code must be 3–30 letters, numbers, - or _.' };
  const type = b.type ?? existing?.type;
  if (!['percent', 'fixed', 'free_shipping'].includes(type)) return { error: 'Choose a discount type.' };
  const value = Number(b.value ?? existing?.value ?? 0);
  if (type === 'percent' && !(value > 0 && value <= 100)) return { error: 'Percentage must be between 1 and 100.' };
  if (type === 'fixed' && !(value > 0)) return { error: 'Discount amount must be more than 0.' };
  const date = (v: any) => (v ? (isNaN(new Date(v).getTime()) ? 'bad' : new Date(v).toISOString()) : null);
  const startsAt = date(b.startsAt !== undefined ? b.startsAt : existing?.startsAt);
  const expiresAt = date(b.expiresAt !== undefined ? b.expiresAt : existing?.expiresAt);
  if (startsAt === 'bad' || expiresAt === 'bad') return { error: 'Invalid date.' };
  if (startsAt && expiresAt && new Date(expiresAt) <= new Date(startsAt)) return { error: 'Expiry must be after the start date.' };
  const num = (k: string) => Math.max(0, Math.floor(Number(b[k] ?? (existing as any)?.[k] ?? 0)) || 0);
  const arr = (k: string) => (Array.isArray(b[k]) ? b[k] : (existing as any)?.[k] || []).map(String).slice(0, 500);
  const bool = (k: string, d: boolean) => (b[k] !== undefined ? !!b[k] : (existing as any)?.[k] ?? d);
  return {
    code, type, value: type === 'free_shipping' ? 0 : value,
    description: String(b.description ?? existing?.description ?? '').slice(0, 200),
    minOrderRs: num('minOrderRs'), maxDiscountRs: num('maxDiscountRs'),
    startsAt, expiresAt, usageLimit: num('usageLimit'), perCustomerLimit: num('perCustomerLimit'),
    productIds: arr('productIds'), categories: arr('categories'),
    firstOrderOnly: bool('firstOrderOnly', false), stackWithSale: bool('stackWithSale', true),
    showInCart: bool('showInCart', false), active: bool('active', true),
    updatedAt: new Date().toISOString(),
  };
}

router.get('/coupons', ...admin, wrap(async (_req, res) => {
  const [coupons, usages] = await Promise.all([Coupons.all(), CouponUsages.all()]);
  ok(res, coupons
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(c => {
      const u = usages.filter(x => x.couponId === c.id);
      return { ...c, uses: u.length, totalDiscount: u.reduce((s, x) => s + x.discount, 0), offer: describeCoupon(c) };
    }));
}));

router.get('/coupons/generate-code', ...admin, wrap(async (_req, res) => {
  let code = randomCode();
  while (await Coupons.findOne(c => c.code === code)) code = randomCode();
  ok(res, { code });
}));

router.post('/coupons', ...admin, wrap(async (req, res) => {
  const c = cleanCoupon(req.body || {});
  if ('error' in c) return fail(res, 400, c.error);
  if (await Coupons.findOne(x => x.code === c.code)) return fail(res, 409, 'A coupon with this code already exists.');
  ok(res, await Coupons.insert({ ...c, createdAt: new Date().toISOString() }), 'Coupon created.');
}));

router.put('/coupons/:id', ...admin, wrap(async (req, res) => {
  const existing = await Coupons.get(String(req.params.id));
  if (!existing) return fail(res, 404, 'Coupon not found.');
  const c = cleanCoupon(req.body || {}, existing);
  if ('error' in c) return fail(res, 400, c.error);
  if (c.code !== existing.code && (await Coupons.findOne(x => x.code === c.code))) return fail(res, 409, 'A coupon with this code already exists.');
  ok(res, await Coupons.update(existing.id, c), 'Coupon saved.');
}));

router.delete('/coupons/:id', ...admin, wrap(async (req, res) => {
  if (!(await Coupons.remove(String(req.params.id)))) return fail(res, 404, 'Coupon not found.');
  ok(res, { deleted: true }, 'Coupon deleted. Its usage history is kept.');
}));

router.get('/coupons/:id/usage', ...admin, wrap(async (req, res) => {
  ok(res, (await CouponUsages.find(u => u.couponId === String(req.params.id))).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}));

// Announce a coupon to everyone who allowed push notifications
router.post('/coupons/:id/announce', ...admin, wrap(async (req, res) => {
  const c = await Coupons.get(String(req.params.id));
  if (!c) return fail(res, 404, 'Coupon not found.');
  const t = (await getTemplates()).coupon;
  const base = await siteBase(originOf(req));
  const vars = { customer_name: 'there', coupon_code: c.code, coupon_offer: describeCoupon(c), shop_url: `${base}/shop`, store_name: "QADAM Men's Footwear" };
  const subs: any[] = await DataStore.getAllSubscribers();
  const stamp = Date.now();
  let sent = 0;
  for (const s of subs) {
    const m = await dispatch({ kind: 'coupon', channel: 'push', to: s.endpoint, name: '', subject: fillTemplate(t.subject, vars), body: fillTemplate(t.body, vars).replace(/\*/g, ''), link: `${base}/shop`, refId: c.id, dedupeKey: `coupon:${c.id}:${stamp}:${s.endpoint}` });
    if (m?.status === 'sent') sent++;
  }
  ok(res, { targeted: subs.length, sent }, `Sent to ${sent} of ${subs.length} subscribers.`);
}));

// Helper: Gather all real customer touchpoints across Orders, Users, Abandoned Carts, and WebPush
async function getCustomerAudience() {
  const subs: any[] = await DataStore.getAllSubscribers();
  const rawOrders: any[] = await DataStore.getOrders();
  const orders = rawOrders.map(o => (o.toObject ? o.toObject() : o));
  const rawUsers: any[] = await DataStore.getAllUsers();
  const users = rawUsers.map(u => (u.toObject ? u.toObject() : u));
  const carts: any[] = await AbandonedCarts.all();

  const phoneMap = new Map<string, { phone: string; name: string; source: string }>();
  const emailMap = new Map<string, { email: string; name: string; source: string }>();

  // Extract from customer orders
  for (const o of orders) {
    const p = o.customer?.phone ? String(o.customer.phone).trim() : '';
    const e = o.customer?.email ? String(o.customer.email).trim() : '';
    const name = o.customer?.name ? String(o.customer.name).trim() : 'Valued Client';
    if (p && isValidPhone(p)) {
      const clean = normPhone(p);
      if (!phoneMap.has(clean)) phoneMap.set(clean, { phone: p, name, source: `Order ${o.orderNumber}` });
    }
    if (e && isValidEmail(e)) {
      const clean = normEmail(e);
      if (!emailMap.has(clean)) emailMap.set(clean, { email: e, name, source: `Order ${o.orderNumber}` });
    }
  }

  // Extract from registered users
  for (const u of users) {
    const p = u.phone ? String(u.phone).trim() : '';
    const e = u.email ? String(u.email).trim() : '';
    const name = u.name ? String(u.name).trim() : 'Member';
    if (p && isValidPhone(p)) {
      const clean = normPhone(p);
      if (!phoneMap.has(clean)) phoneMap.set(clean, { phone: p, name, source: 'Account' });
    }
    if (e && isValidEmail(e)) {
      const clean = normEmail(e);
      if (!emailMap.has(clean)) emailMap.set(clean, { email: e, name, source: 'Account' });
    }
  }

  // Extract from carts
  for (const c of carts) {
    const p = c.contact?.phone ? String(c.contact.phone).trim() : '';
    const e = c.contact?.email ? String(c.contact.email).trim() : '';
    const name = c.contact?.name ? String(c.contact.name).trim() : 'Guest';
    if (p && isValidPhone(p)) {
      const clean = normPhone(p);
      if (!phoneMap.has(clean)) phoneMap.set(clean, { phone: p, name, source: 'Cart' });
    }
    if (e && isValidEmail(e)) {
      const clean = normEmail(e);
      if (!emailMap.has(clean)) emailMap.set(clean, { email: e, name, source: 'Cart' });
    }
  }

  return {
    pushSubscribers: subs,
    customerPhones: Array.from(phoneMap.values()),
    customerEmails: Array.from(emailMap.values()),
  };
}

// Promotional offer to all customer touchpoints (WebPush, WhatsApp, Email, Live Banner)
router.post('/promo', ...admin, wrap(async (req, res) => {
  const message = String(req.body?.message || '').trim();
  if (!message) return fail(res, 400, 'Write a message first.');
  const subject = String(req.body?.subject || '').trim() || 'A little something from QADAM';
  const couponCode = String(req.body?.couponCode || '').trim();
  const rawChannels = req.body?.channels || {};
  const channels = {
    push: rawChannels.push !== false,
    whatsapp: rawChannels.whatsapp !== false,
    email: rawChannels.email !== false,
    storefrontBanner: rawChannels.storefrontBanner !== false,
  };

  const t = (await getTemplates()).promo;
  const base = await siteBase(originOf(req));
  const link = String(req.body?.link || '').trim() || `${base}/shop`;
  const stamp = Date.now();

  const audience = await getCustomerAudience();
  let pushSent = 0;
  let whatsappQueued = 0;
  let emailQueued = 0;

  // 1. Browser Push Notifications
  if (channels.push) {
    for (const s of audience.pushSubscribers) {
      const vars = { customer_name: 'there', message, shop_url: link, store_name: "QADAM Men's Footwear", coupon_code: couponCode };
      const m = await dispatch({
        kind: 'promo',
        channel: 'push',
        to: s.endpoint,
        name: '',
        subject: fillTemplate(subject || t.subject, vars),
        body: fillTemplate(t.body, vars),
        link,
        refId: `promo-${stamp}`,
        dedupeKey: `promo:${stamp}:${s.endpoint}`,
      });
      if (m?.status === 'sent') pushSent++;
    }
  }

  // 2. WhatsApp Messages (Queued in Outbox with 1-click wa.me send links)
  if (channels.whatsapp) {
    for (const c of audience.customerPhones) {
      const waText = `*QADAM | ${subject}*\n\nSalam ${c.name}!\n\n${message}${couponCode ? `\n\n🎁 *Promo Code:* ${couponCode}` : ''}\n\n🛍️ *Shop now:* ${link}\n\n_Handcrafted Italian Leather Shoes & Sandals • Cash on Delivery across Pakistan_`;
      const m = await dispatch({
        kind: 'promo',
        channel: 'whatsapp',
        to: c.phone,
        name: c.name,
        subject,
        body: waText,
        link,
        refId: `promo-${stamp}`,
        dedupeKey: `promo:wa:${stamp}:${normPhone(c.phone)}`,
      });
      if (m) whatsappQueued++;
    }
  }

  // 3. Email Messages (Queued in Outbox)
  if (channels.email) {
    for (const c of audience.customerEmails) {
      const emailBody = `Hi ${c.name},\n\n${message}\n\n${couponCode ? `Use coupon code: ${couponCode} at checkout.\n\n` : ''}Explore our footwear: ${link}\n\nWarm regards,\nQADAM Atelier`;
      const m = await dispatch({
        kind: 'promo',
        channel: 'email',
        to: c.email,
        name: c.name,
        subject,
        body: emailBody,
        link,
        refId: `promo-${stamp}`,
        dedupeKey: `promo:email:${stamp}:${normEmail(c.email)}`,
      });
      if (m) emailQueued++;
    }
  }

  // 4. Live Storefront Promotion & Top Announcement Banner
  let bannerActive = false;
  if (channels.storefrontBanner) {
    const promoData = {
      id: `promo-${stamp}`,
      title: subject,
      message,
      link,
      couponCode: couponCode || '',
      active: true,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    };
    await SettingsStore.set('activePromotion', promoData);
    bannerActive = true;
  }

  // Log in notification logs
  await DataStore.logNotification({
    title: subject,
    body: message,
    url: link,
    targetAudience: 'all-customers',
    recipientCount: audience.pushSubscribers.length + audience.customerPhones.length + audience.customerEmails.length,
    successCount: pushSent + whatsappQueued + emailQueued,
    failureCount: 0,
    sentBy: (req as any).user?.name || 'QADAM Admin',
  });

  const parts = [];
  if (channels.push) parts.push(`${pushSent} push notification(s)`);
  if (channels.whatsapp) parts.push(`${whatsappQueued} WhatsApp message(s) queued in Outbox`);
  if (channels.email) parts.push(`${emailQueued} email(s) queued in Outbox`);
  if (bannerActive) parts.push(`Live website promotion banner activated`);

  const summary = parts.length ? parts.join(', ') : 'Offer sent.';
  ok(res, {
    pushSent,
    whatsappQueued,
    emailQueued,
    bannerActive,
    totalAudience: audience.pushSubscribers.length + audience.customerPhones.length + audience.customerEmails.length,
  }, `Successfully dispatched: ${summary}.`);
}));

// Audience info for promo composer
router.get('/promo-audience', ...admin, wrap(async (_req, res) => {
  const aud = await getCustomerAudience();
  const activePromo = await SettingsStore.get('activePromotion');
  ok(res, {
    pushCount: aud.pushSubscribers.length,
    whatsappCount: aud.customerPhones.length,
    emailCount: aud.customerEmails.length,
    totalReach: aud.pushSubscribers.length + aud.customerPhones.length + aud.customerEmails.length,
    sampleCustomers: aud.customerPhones.slice(0, 5),
    activePromotion: activePromo || null,
  });
}));

// Public active promotion endpoint for storefront
router.get('/active-promo', wrap(async (_req, res) => {
  const promo: any = await SettingsStore.get('activePromotion');
  if (!promo || !promo.active) return ok(res, null);
  if (promo.expiresAt && new Date(promo.expiresAt).getTime() < Date.now()) {
    return ok(res, null);
  }
  ok(res, promo);
}));

// Admin clear active promotion
router.delete('/active-promo', ...admin, wrap(async (_req, res) => {
  await SettingsStore.set('activePromotion', null);
  ok(res, null, 'Active website promotional banner removed.');
}));

// ── Settings
const SETTINGS: Record<string, { key: string; get: () => Promise<any>; clean: (b: any) => any }> = {
  shipping: {
    key: 'shipping', get: getShipping,
    clean: b => ({
      enabled: !!b.enabled,
      thresholdRs: Math.max(0, Math.round(Number(b.thresholdRs) || 0)),
      standardFeeRs: Math.max(0, Math.round(Number(b.standardFeeRs) || 0)),
      expressFeeRs: Math.max(0, Math.round(Number(b.expressFeeRs) || 0)),
      eligibleCategories: (b.eligibleCategories || []).map(String),
      eligibleProducts: (b.eligibleProducts || []).map(String),
      excludedProducts: (b.excludedProducts || []).map(String),
      combineWithCoupons: !!b.combineWithCoupons,
      campaigns: (b.campaigns || []).slice(0, 20).map((c: any) => ({
        id: String(c.id || crypto.randomBytes(4).toString('hex')), name: String(c.name || 'Campaign').slice(0, 60),
        thresholdRs: Math.max(0, Math.round(Number(c.thresholdRs) || 0)),
        startsAt: c.startsAt || null, endsAt: c.endsAt || null, active: !!c.active,
      })),
    }),
  },
  recovery: {
    key: 'cartRecovery', get: getRecovery,
    clean: b => ({
      enabled: !!b.enabled,
      abandonAfterMinutes: Math.min(10080, Math.max(5, Math.round(Number(b.abandonAfterMinutes) || 60))),
      reminderHours: (Array.isArray(b.reminderHours) ? b.reminderHours : [1]).map(Number).filter((h: number) => h >= 0 && h <= 720).slice(0, 5).sort((a: number, b: number) => a - b),
      channels: { push: !!b.channels?.push, whatsapp: !!b.channels?.whatsapp, email: !!b.channels?.email },
      tokenDays: Math.min(60, Math.max(1, Math.round(Number(b.tokenDays) || 7))),
      siteUrl: String(b.siteUrl || '').trim().replace(/\/$/, '').slice(0, 200),
    }),
  },
  templates: {
    key: 'marketingTemplates', get: getTemplates,
    clean: b => Object.fromEntries((Object.keys(DEFAULT_TEMPLATES) as TemplateKey[]).map(k => [k, {
      subject: String(b?.[k]?.subject ?? DEFAULT_TEMPLATES[k].subject).slice(0, 200),
      body: String(b?.[k]?.body ?? DEFAULT_TEMPLATES[k].body).slice(0, 2000),
    }])),
  },
};
void DEFAULT_SHIPPING; void DEFAULT_RECOVERY;

router.get('/settings/:name', ...admin, wrap(async (req, res) => {
  const s = SETTINGS[String(req.params.name)];
  if (!s) return fail(res, 404, 'Unknown setting.');
  ok(res, await s.get());
}));

router.put('/settings/:name', ...admin, wrap(async (req, res) => {
  const s = SETTINGS[String(req.params.name)];
  if (!s) return fail(res, 404, 'Unknown setting.');
  await SettingsStore.set(s.key, s.clean(req.body || {}));
  ok(res, await s.get(), 'Saved.');
}));

// ── Abandoned carts
router.get('/carts', ...admin, wrap(async (_req, res) => {
  const carts = (await AbandonedCarts.all()).filter(c => c.items.length);
  ok(res, carts
    .sort((a, b) => b.lastActivity.localeCompare(a.lastActivity))
    .map(({ token, tokenExpiresAt, pushEndpoint, ...c }) => ({ ...c, hasPush: !!pushEndpoint })));
}));

router.post('/carts/:id/remind', ...admin, wrap(async (req, res) => {
  const c = await AbandonedCarts.get(String(req.params.id));
  if (!c) return fail(res, 404, 'Cart not found.');
  if (['recovered', 'converted', 'opted_out'].includes(c.status)) return fail(res, 400, 'This cart is finished or the customer opted out.');
  if (!c.contact.email && !c.contact.phone && !c.pushEndpoint) return fail(res, 400, 'No contact details for this cart.');
  if (!c.consent) return fail(res, 400, 'The customer did not agree to reminders.');
  const n = await sendCartReminder(c, c.remindersSent || 0, true);
  ok(res, { created: n }, n ? 'Reminder created. WhatsApp / email messages are waiting in the Outbox.' : 'Nothing new to send.');
}));

// ── Stock alerts
router.get('/stock-alerts', ...admin, wrap(async (_req, res) => {
  ok(res, (await StockAlerts.find(a => a.status !== 'removed')).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}));

router.post('/stock-alerts/:id/notify', ...admin, wrap(async (req, res) => {
  const a = await StockAlerts.get(String(req.params.id));
  if (!a) return fail(res, 404, 'Alert not found.');
  const p: any = await DataStore.getProductByIdOrSlug(a.productId);
  if (!p) return fail(res, 404, 'Product no longer exists.');
  if (!sizeAvailable(p, a.size) && !req.body?.force) return fail(res, 400, `Size ${a.size}/${Number(a.size) - 33} is still out of stock. Restock it first.`);
  const n = await notifyStockAlert(a, p, `manual-${Date.now()}`);
  await StockAlerts.update(a.id, { status: 'notified', notifiedAt: new Date().toISOString() });
  ok(res, { created: n }, 'Alert sent / queued.');
}));

router.delete('/stock-alerts/:id', ...admin, wrap(async (req, res) => {
  if (!(await StockAlerts.update(String(req.params.id), { status: 'removed' }))) return fail(res, 404, 'Alert not found.');
  ok(res, { removed: true });
}));

// ── Price alerts
router.get('/price-alerts', ...admin, wrap(async (_req, res) => {
  const [subs, changes] = await Promise.all([PriceAlerts.find(a => a.status !== 'removed'), PriceChanges.all()]);
  const products: Record<string, any> = {};
  for (const s of subs) {
    const g = products[s.productId] ||= { productId: s.productId, productName: s.productName, productImage: s.productImage, subscribers: 0, active: 0 };
    g.subscribers++;
    if (s.status === 'active') g.active++;
  }
  for (const g of Object.values(products)) {
    const p: any = await DataStore.getProductByIdOrSlug(g.productId);
    g.currentPrice = p ? sellingPrice(p) : null;
    const last = changes.filter(c => c.productId === g.productId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    g.previousPrice = last ? last.oldPrice : null;
    g.notificationsSent = changes.filter(c => c.productId === g.productId).reduce((n, c) => n + c.notified, 0);
  }
  ok(res, {
    products: Object.values(products),
    subscriptions: subs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(s => ({ ...s, pushEndpoint: s.pushEndpoint ? 'yes' : '' })),
    history: changes.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 200),
  });
}));

router.post('/price-alerts/:id/notify', ...admin, wrap(async (req, res) => {
  const a = await PriceAlerts.get(String(req.params.id));
  if (!a) return fail(res, 404, 'Alert not found.');
  const p: any = await DataStore.getProductByIdOrSlug(a.productId);
  if (!p) return fail(res, 404, 'Product no longer exists.');
  const now = sellingPrice(p);
  const n = await notifyPriceAlert(a, p, a.priceAtSignup, now);
  await PriceAlerts.update(a.id, { lastNotifiedPrice: now, notifiedAt: new Date().toISOString(), notifyCount: (a.notifyCount || 0) + 1 });
  ok(res, { created: n }, n ? 'Alert sent / queued.' : 'Already sent for this price.');
}));

router.delete('/price-alerts/:id', ...admin, wrap(async (req, res) => {
  if (!(await PriceAlerts.update(String(req.params.id), { status: 'removed' }))) return fail(res, 404, 'Alert not found.');
  ok(res, { removed: true });
}));

// ── Outbox / notification log
router.get('/messages', ...admin, wrap(async (req, res) => {
  const status = String(req.query.status || '');
  const list = (await Messages.find(m => !status || m.status === status)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 500);
  ok(res, list.map(m => ({ ...m, to: m.channel === 'push' ? 'Browser notification' : m.to, sendLink: sendLink(m) })));
}));

router.post('/messages/:id/:action', ...admin, wrap(async (req, res) => {
  const action = String(req.params.action);
  if (!['sent', 'skip'].includes(action)) return fail(res, 404, 'Unknown action.');
  const m = await Messages.update(String(req.params.id), action === 'sent'
    ? { status: 'sent', sentAt: new Date().toISOString() }
    : { status: 'skipped' });
  if (!m) return fail(res, 404, 'Message not found.');
  ok(res, m);
}));

export default router;
