import { webpush } from './push.js';
import { SettingsStore } from '../config/settingsStore.js';

// Push subscriptions of admin devices (phones/PCs that should be told about new orders).
// Stored with the site settings (MongoDB if connected, otherwise data/site-settings.json).
const KEY = 'adminPushSubscriptions';

export interface AdminPushSub {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  label?: string;
  addedAt: string;
}

export async function getAdminSubs(): Promise<AdminPushSub[]> {
  const v = await SettingsStore.get(KEY);
  return Array.isArray(v) ? v : [];
}

export async function addAdminSub(sub: { endpoint: string; keys: any }, label?: string) {
  const list = (await getAdminSubs()).filter(s => s.endpoint !== sub.endpoint);
  list.push({ endpoint: sub.endpoint, keys: sub.keys, label, addedAt: new Date().toISOString() });
  await SettingsStore.set(KEY, list);
  return list.length;
}

export async function removeAdminSub(endpoint: string) {
  const list = (await getAdminSubs()).filter(s => s.endpoint !== endpoint);
  await SettingsStore.set(KEY, list);
  return list.length;
}

/** Sends a payload to every admin device; removes devices whose subscription has expired */
export async function sendToAdmins(payload: Record<string, any>) {
  const subs = await getAdminSubs();
  if (!subs.length) return { sent: 0, failed: 0 };
  const dead: string[] = [];
  let sent = 0;
  await Promise.all(
    subs.map(async s => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(payload), { TTL: 60 * 60 * 24 });
        sent++;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) dead.push(s.endpoint);
      }
    })
  );
  if (dead.length) await SettingsStore.set(KEY, subs.filter(s => !dead.includes(s.endpoint)));
  return { sent, failed: subs.length - sent };
}

const PKR_RATE = 280; // prices are stored in USD base, shown in PKR

export async function notifyAdminsNewOrder(order: any) {
  const name = order?.customer?.name || 'a customer';
  const city = order?.customer?.city ? ` · ${order.customer.city}` : '';
  const items = (order?.items || []).reduce((n: number, i: any) => n + (i.quantity || 1), 0);
  const total = `Rs. ${Math.round((order?.totalAmount || 0) * PKR_RATE).toLocaleString('en-PK')}`;
  const first = order?.items?.[0]?.name ? `\n${order.items[0].name}${order.items.length > 1 ? ` +${order.items.length - 1} more` : ''}` : '';
  return sendToAdmins({
    kind: 'new-order',
    title: `🛍️ New order from ${name}`,
    body: `${order?.orderNumber || ''} · ${items} item(s) · ${total}${city}${first}`,
    icon: '/icons/admin-192.png',
    badge: '/icons/admin-192.png',
    url: '/admin/orders',
    tag: `order-${order?.orderNumber || Date.now()}`,
    requireInteraction: true,
    order: {
      orderNumber: order?.orderNumber,
      name,
      city: order?.customer?.city || '',
      items,
      total,
    },
  });
}
