import { DataStore } from '../config/store.js';
import { webpush } from './push.js';

/** Default push text for each order status (simple English) */
export const ORDER_PUSH_TEXT: Record<string, { title: string; body: string }> = {
  pending: { title: 'Order received 🛍️', body: 'We got your order {order}. We will confirm it soon.' },
  processing: { title: 'Order approved ✅', body: 'Your order {order} is approved and being prepared.' },
  shipped: { title: 'Order shipped 🚚', body: 'Your order {order} is on the way! Tap to track it.' },
  delivered: { title: 'Order delivered 📦', body: 'Your order {order} has been delivered. Enjoy your new shoes!' },
  cancelled: { title: 'Order cancelled', body: 'Your order {order} has been cancelled. Contact us if you have questions.' },
};

/**
 * Sends a push notification to every device that placed / follows this order.
 * Never throws — order updates must not fail because of push problems.
 */
export async function sendOrderPush(
  orderNumber: string,
  opts: { status?: string; title?: string; body?: string; sentBy?: string } = {}
): Promise<{ targeted: number; delivered: number }> {
  try {
    const num = orderNumber.toUpperCase();
    const preset = opts.status ? ORDER_PUSH_TEXT[opts.status] : undefined;
    const title = (opts.title || preset?.title || 'Order update').replace(/\{order\}/g, num);
    const body = (opts.body || preset?.body || 'There is an update on your order {order}.').replace(/\{order\}/g, num);
    const url = `/track-order?orderNumber=${num}`;

    const subs: any[] = await DataStore.getSubscribersForOrder(num);
    if (!subs.length) return { targeted: 0, delivered: 0 };

    const payload = JSON.stringify({ title, body, url, icon: '/icons/icon-192.png', badge: '/favicon-32.png', tag: `order-${num}` });
    let delivered = 0;
    let failed = 0;
    await Promise.allSettled(
      subs.map(async sub => {
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
          delivered++;
        } catch (err: any) {
          failed++;
          if (err?.statusCode === 404 || err?.statusCode === 410) await DataStore.removeSubscriber(sub.endpoint);
        }
      })
    );

    await DataStore.logNotification({
      title,
      body,
      url,
      targetAudience: `order:${num}`,
      recipientCount: subs.length,
      successCount: delivered,
      failureCount: failed,
      sentBy: opts.sentBy || 'Automatic (order update)',
    });
    return { targeted: subs.length, delivered };
  } catch (e) {
    console.warn('[Push] order notification failed:', e);
    return { targeted: 0, delivered: 0 };
  }
}
