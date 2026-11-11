import { StockAlerts, PriceAlerts, PriceChanges, getTemplates, getRecovery, fillTemplate, formatRs, toRs, StockAlert, PriceAlert } from './store.js';
import { dispatch } from './notifier.js';
import { sellingPrice, sizeStockLeft } from './pricing.js';

/** Public site address used inside messages */
export async function siteBase(origin?: string) {
  const r = await getRecovery();
  return (r.siteUrl || process.env.SITE_URL || origin || 'http://localhost:5173').replace(/\/$/, '');
}

const productId = (p: any) => p?.id || String(p?._id || '');

/** Channels a subscription can be reached on */
const targets = (s: { email: string; phone: string; pushEndpoint: string }) => [
  ...(s.pushEndpoint ? [{ channel: 'push' as const, to: s.pushEndpoint }] : []),
  ...(s.phone ? [{ channel: 'whatsapp' as const, to: s.phone }] : []),
  ...(s.email ? [{ channel: 'email' as const, to: s.email }] : []),
];

/** Is this size currently in stock? (untracked stock = in stock when the size is offered) */
export const sizeAvailable = (p: any, size: number) => {
  const eu = Array.isArray(p.sizes) ? p.sizes.filter((s: number) => s >= 30) : [];
  if (eu.length && !eu.includes(size)) return false;
  const left = sizeStockLeft(p, size);
  return left === null ? true : left > 0;
};

export async function notifyStockAlert(a: StockAlert, product: any, eventKey: string) {
  const t = (await getTemplates()).back_in_stock;
  const base = await siteBase((a as any).origin);
  const url = `${base}/product/${product.slug || a.productSlug}`;
  const vars = {
    customer_name: 'there', product_name: product.name || a.productName, size: a.size, color: a.color || 'any colour',
    price: formatRs(sellingPrice(product)), product_url: url, store_name: "QADAM Men's Footwear",
  };
  let sent = 0;
  for (const tg of targets(a)) {
    const m = await dispatch({
      kind: 'back_in_stock', channel: tg.channel, to: tg.to, name: '',
      subject: fillTemplate(t.subject, vars), body: fillTemplate(t.body, vars), link: url,
      refId: a.id, dedupeKey: `stock:${a.id}:${eventKey}:${tg.channel}`,
    });
    if (m) sent++;
  }
  return sent;
}

export async function notifyPriceAlert(a: PriceAlert, product: any, oldPrice: number, newPrice: number) {
  const t = (await getTemplates()).price_drop;
  const base = await siteBase((a as any).origin);
  const url = `${base}/product/${product.slug || a.productSlug}`;
  const vars = {
    customer_name: 'there', product_name: product.name || a.productName,
    price: formatRs(newPrice), old_price: formatRs(oldPrice), target_price: a.targetPriceRs ? `Rs. ${a.targetPriceRs.toLocaleString('en-PK')}` : '',
    size: a.size ?? '', product_url: url, store_name: "QADAM Men's Footwear",
  };
  let sent = 0;
  for (const tg of targets(a)) {
    const m = await dispatch({
      kind: 'price_drop', channel: tg.channel, to: tg.to, name: '',
      subject: fillTemplate(t.subject, vars), body: fillTemplate(t.body, vars), link: url,
      refId: a.id, dedupeKey: `price:${a.id}:${toRs(newPrice)}:${tg.channel}`,
    });
    if (m) sent++;
  }
  return sent;
}

/**
 * Called after the admin saves a product. Detects:
 *  - sizes that came back in stock  → back-in-stock alerts (only once per restock)
 *  - a genuine drop in selling price → price-drop alerts (never for increases)
 */
export async function onProductUpdated(before: any, after: any) {
  if (!before || !after) return;
  const pid = productId(after);
  try {
    // Back in stock
    const waiting = await StockAlerts.find(a => a.productId === pid && a.status === 'waiting');
    const sizes = [...new Set(waiting.map(a => a.size))];
    for (const size of sizes) {
      const was = sizeAvailable(before, size);
      const now = sizeAvailable(after, size);
      if (!now) continue;                              // still sold out → nothing to send
      if (was) continue;                               // it was already available before this save
      const eventKey = `${size}:${Date.now()}`;
      for (const a of waiting.filter(x => x.size === size)) {
        await notifyStockAlert(a, after, eventKey);
        await StockAlerts.update(a.id, { status: 'notified', notifiedAt: new Date().toISOString() });
      }
    }

    // Price drop
    const oldPrice = sellingPrice(before);
    const newPrice = sellingPrice(after);
    if (!(newPrice > 0) || toRs(newPrice) >= toRs(oldPrice)) return; // increase or no real change
    const subs = await PriceAlerts.find(a => a.productId === pid && a.status === 'active');
    let notified = 0;
    for (const a of subs) {
      if (a.lastNotifiedPrice && toRs(a.lastNotifiedPrice) <= toRs(newPrice)) continue; // already told about this (or a lower) price
      if (a.targetPriceRs > 0 && toRs(newPrice) > a.targetPriceRs) continue;           // target not reached yet
      const sent = await notifyPriceAlert(a, after, oldPrice, newPrice);
      if (sent) notified++;
      await PriceAlerts.update(a.id, {
        lastNotifiedPrice: newPrice,
        notifiedAt: new Date().toISOString(),
        notifyCount: (a.notifyCount || 0) + 1,
        status: a.targetPriceRs > 0 ? 'fulfilled' : 'active',
      });
    }
    await PriceChanges.insert({
      productId: pid, productName: after.name, oldPrice, newPrice,
      subscribers: subs.length, notified, createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[Marketing] product alert check failed:', e);
  }
}
