import crypto from 'crypto';
import { AbandonedCarts, AbandonedCart, getRecovery, getTemplates, fillTemplate, formatRs, isValidEmail, isValidPhone, normEmail, normPhone } from './store.js';
import { dispatch, isSuppressed, Suppressions } from './notifier.js';
import { quote } from './pricing.js';
import { siteBase } from './alerts.js';
import { createLock } from '../config/collection.js';

const lock = createLock();
const newToken = () => crypto.randomBytes(24).toString('base64url');

/** Saves the shopper's bag (called by the website while they shop / fill checkout). */
export async function syncCart(input: {
  cartId: string; items: any[]; contact?: { name?: string; email?: string; phone?: string };
  consent?: boolean; pushEndpoint?: string; origin?: string;
}) {
  const cartId = String(input.cartId || '').slice(0, 64);
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(cartId)) throw new Error('Invalid cart id.');
  return lock(async () => {
    const q = await quote({ items: input.items || [] });
    const items = q.lines.map(l => ({ productId: l.productId, name: l.name, slug: l.slug, image: l.image, color: l.color, size: l.size, quantity: l.quantity, price: l.price }));
    const existing = await AbandonedCarts.findOne(c => c.cartId === cartId);
    const now = new Date().toISOString();
    const r = await getRecovery();

    const c = input.contact || {};
    const contact = {
      name: String(c.name ?? existing?.contact.name ?? '').slice(0, 80),
      email: isValidEmail(normEmail(c.email)) ? normEmail(c.email) : (existing?.contact.email || ''),
      phone: isValidPhone(String(c.phone || '')) ? String(c.phone).trim() : (existing?.contact.phone || ''),
    };

    if (existing) {
      // A finished / opted-out cart is never reopened; an empty bag just stays as it is
      if (['converted', 'opted_out'].includes(existing.status)) return existing;
      const patch: Partial<AbandonedCart> = {
        contact,
        consent: input.consent ?? existing.consent,
        pushEndpoint: input.pushEndpoint || existing.pushEndpoint,
        origin: input.origin || existing.origin,
      };
      if (items.length) {
        const changed = JSON.stringify(items) !== JSON.stringify(existing.items);
        Object.assign(patch, { items, total: q.subtotal, lastActivity: now });
        // Shopper came back and changed the bag → treat as active again (reminder steps restart)
        if (changed && existing.status === 'abandoned') Object.assign(patch, { status: 'active', abandonedAt: null, remindersSent: 0 });
      }
      return AbandonedCarts.update(existing.id, patch);
    }
    if (!items.length) return null;
    return AbandonedCarts.insert({
      cartId, items, total: q.subtotal, contact,
      consent: !!input.consent, pushEndpoint: input.pushEndpoint || '', origin: input.origin || '',
      status: 'active', lastActivity: now, abandonedAt: null, remindersSent: 0, reminderHistory: [],
      token: newToken(), tokenExpiresAt: new Date(Date.now() + r.tokenDays * 86400000).toISOString(),
      recoveredOrder: '', recoveredRevenue: 0, createdAt: now,
    });
  });
}

/** Called after an order is placed: stops reminders and records recovered revenue. */
export async function markCartOrdered(cartId: string | undefined, orderNumber: string, total: number, contact: { email?: string; phone?: string }) {
  const keys = [normEmail(contact.email), normPhone(contact.phone)].filter(Boolean);
  const carts = await AbandonedCarts.find(c =>
    ['active', 'abandoned'].includes(c.status) &&
    ((!!cartId && c.cartId === cartId) || keys.includes(normEmail(c.contact.email)) || keys.includes(normPhone(c.contact.phone))));
  for (const c of carts) {
    const recovered = c.status === 'abandoned';
    await AbandonedCarts.update(c.id, {
      status: recovered ? 'recovered' : 'converted',
      recoveredOrder: orderNumber,
      recoveredRevenue: recovered ? total : 0,
    });
  }
}

const reachable = (c: AbandonedCart) => c.consent && (c.contact.email || c.contact.phone || c.pushEndpoint);

/** Builds and sends (or queues) one reminder step for a cart. */
export async function sendCartReminder(c: AbandonedCart, step: number, manual = false) {
  const r = await getRecovery();
  const t = (await getTemplates()).abandoned_cart;
  const base = await siteBase(c.origin);
  // Refresh an expired token so the link in a new reminder works
  let token = c.token;
  if (new Date(c.tokenExpiresAt).getTime() < Date.now()) {
    token = newToken();
    await AbandonedCarts.update(c.id, { token, tokenExpiresAt: new Date(Date.now() + r.tokenDays * 86400000).toISOString() });
  }
  const recovery = `${base}/recover-cart/${token}`;
  const optOut = `${base}/api/marketing/opt-out/${token}`;
  const vars = {
    customer_name: c.contact.name || 'there', recovery_link: recovery, opt_out_link: optOut,
    cart_total: formatRs(c.total), product_name: c.items[0]?.name || 'your shoes',
    item_count: c.items.reduce((n, i) => n + i.quantity, 0), store_name: "QADAM Men's Footwear",
  };
  const channels = [
    ...(r.channels.push && c.pushEndpoint ? [{ channel: 'push' as const, to: c.pushEndpoint }] : []),
    ...(r.channels.whatsapp && c.contact.phone ? [{ channel: 'whatsapp' as const, to: c.contact.phone }] : []),
    ...(r.channels.email && c.contact.email ? [{ channel: 'email' as const, to: c.contact.email }] : []),
  ];
  const history = [...(c.reminderHistory || [])];
  const stamp = manual ? `manual-${Date.now()}` : `step-${step}`;
  for (const ch of channels) {
    const m = await dispatch({
      kind: 'abandoned_cart', channel: ch.channel, to: ch.to, name: c.contact.name,
      subject: fillTemplate(t.subject, vars), body: fillTemplate(t.body, vars), link: recovery,
      refId: c.id, dedupeKey: `cart:${c.id}:${stamp}:${ch.channel}`,
    });
    if (m) history.push({ at: m.createdAt, channel: ch.channel, status: m.status, step });
  }
  await AbandonedCarts.update(c.id, { reminderHistory: history, ...(manual ? {} : { remindersSent: step + 1 }) });
  return history.length - (c.reminderHistory || []).length;
}

/** Background job: marks carts abandoned and sends due reminders. Runs every minute. */
export async function runRecoveryJob() {
  const r = await getRecovery();
  if (!r.enabled) return;
  const now = Date.now();
  const carts = await AbandonedCarts.find(c => c.status === 'active' || c.status === 'abandoned');
  for (const c of carts) {
    if (!c.items.length) continue;
    if (c.status === 'active' && now - new Date(c.lastActivity).getTime() >= r.abandonAfterMinutes * 60000) {
      await AbandonedCarts.update(c.id, { status: 'abandoned', abandonedAt: new Date().toISOString() });
      c.status = 'abandoned';
      c.abandonedAt = new Date().toISOString();
    }
    if (c.status !== 'abandoned' || !reachable(c)) continue;
    const step = c.remindersSent || 0;
    const hours = r.reminderHours[step];
    if (hours === undefined) continue;
    if (now - new Date(c.abandonedAt!).getTime() < hours * 3600000) continue;
    if (c.contact.email && (await isSuppressed(c.contact.email))) continue;
    if (c.contact.phone && (await isSuppressed(c.contact.phone))) continue;
    await sendCartReminder(c, step);
  }
}

let timer: NodeJS.Timeout | null = null;
export function startRecoveryJob() {
  if (timer) return;
  const tick = () => runRecoveryJob().catch(e => console.warn('[Marketing] recovery job failed:', e.message));
  timer = setInterval(tick, 60000);
  setTimeout(tick, 5000);
  console.log('🛒 [Marketing] Abandoned-cart job running (every minute).');
}

/** Restore link: only returns what is needed to refill the bag (no contact details). */
export async function cartForToken(token: string) {
  const c = await AbandonedCarts.findOne(x => x.token === token);
  if (!c || new Date(c.tokenExpiresAt).getTime() < Date.now()) return null;
  return c.items.map(i => ({ productId: i.productId, color: i.color, size: i.size, quantity: i.quantity }));
}

export async function optOut(token: string) {
  const c = await AbandonedCarts.findOne(x => x.token === token);
  if (!c) return false;
  await AbandonedCarts.update(c.id, { status: c.status === 'recovered' || c.status === 'converted' ? c.status : 'opted_out', consent: false });
  for (const key of [normEmail(c.contact.email), normPhone(c.contact.phone)].filter(Boolean)) {
    if (!(await Suppressions.findOne(s => s.key === key))) await Suppressions.insert({ key, createdAt: new Date().toISOString() });
  }
  return true;
}
