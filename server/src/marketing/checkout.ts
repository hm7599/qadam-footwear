import { DataStore } from '../config/store.js';
import { createLock } from '../config/collection.js';
import { quote, sizeStockLeft, findCouponByCode as findCoupon } from './pricing.js';
import { CouponUsages, customerKeys } from './store.js';
import { markCartOrdered } from './recovery.js';

// One checkout at a time, so usage limits and stock can't be over-used by two orders at once
const lock = createLock();

export async function placeWebsiteOrder(input: {
  customer: any; items: any[]; couponCode?: string; paymentMethod?: string; shippingMethod?: string; cartId?: string;
}): Promise<{ order: any } | { error: string; code: string }> {
  return lock(async () => {
    const q = await quote({
      items: input.items.map((i: any) => ({ productId: i.productId, size: i.size, color: i.color, quantity: i.quantity })),
      couponCode: input.couponCode,
      shippingMethod: input.shippingMethod === 'express' || /express/i.test(String(input.shippingMethod)) ? 'express' : 'standard',
      customer: input.customer,
      forOrder: true,
    });
    if (q.errors.length) return { error: q.errors[0], code: 'ITEMS' };
    if (!q.lines.length) return { error: 'Your bag is empty.', code: 'EMPTY' };
    if (input.couponCode && !q.coupon) return { error: q.couponError || 'This code is not valid.', code: 'COUPON' };

    const order: any = await DataStore.createOrder({
      customer: input.customer,
      items: q.lines.map(l => ({
        productId: l.productId, name: l.name, slug: l.slug, price: l.price,
        color: l.color, size: l.size, quantity: l.quantity, image: l.image || '/favicon-32.png',
      })),
      subtotal: q.subtotal,
      shippingCost: q.shippingCost,
      discount: q.discount,
      totalAmount: q.total,
      couponCode: q.coupon?.code || '',
      paymentMethod: input.paymentMethod === 'cod' ? 'cod' : 'card',
      shippingMethod: q.shippingMethod === 'express' ? 'Express Delivery' : (q.shippingCost === 0 ? 'Free Standard Delivery' : 'Standard Delivery'),
    });

    // Record coupon use (one usage per order per coupon)
    if (q.coupon) {
      const c = await findCoupon(q.coupon.code);
      if (c && !(await CouponUsages.findOne(u => u.orderNumber === order.orderNumber && u.couponId === c.id))) {
        await CouponUsages.insert({
          couponId: c.id, code: c.code, orderNumber: order.orderNumber,
          customerKey: customerKeys(input.customer)[0] || '',
          customerName: String(input.customer.name || ''),
          discount: q.coupon.discount, orderTotal: q.total, createdAt: new Date().toISOString(),
        });
      }
    }

    // Reduce size stock where it is tracked
    for (const l of q.lines) {
      const p: any = await DataStore.getProductByIdOrSlug(l.productId);
      if (!p || sizeStockLeft(p, l.size) === null) continue;
      const ss = p.sizeStock instanceof Map ? Object.fromEntries(p.sizeStock) : { ...p.sizeStock };
      ss[String(l.size)] = Math.max(0, (Number(ss[String(l.size)]) || 0) - l.quantity);
      await DataStore.updateProduct(l.productId, { sizeStock: ss });
    }

    // Stop abandoned-cart reminders and count recovered revenue
    await markCartOrdered(input.cartId, order.orderNumber, q.total, input.customer).catch(() => {});
    return { order };
  });
}
