import { DataStore } from '../config/store.js';
import { webpush } from '../utils/push.js';
import { Messages, MarketingMessage, isValidEmail, isValidPhone, normPhone, normEmail } from './store.js';

type Channel = MarketingMessage['channel'];

export interface Outgoing {
  kind: MarketingMessage['kind'];
  channel: Channel;
  to: string;               // email, phone or push endpoint
  name: string;
  subject: string;
  body: string;
  link: string;
  refId: string;
  dedupeKey: string;        // same key = never sent twice
}

/** Opted-out contacts (abandoned-cart "stop reminders") */
import { Collection } from '../config/collection.js';
export const Suppressions = new Collection<{ id: string; key: string; createdAt: string }>('MarketingOptOut', { key: { type: String, unique: true } });

export async function isSuppressed(to: string) {
  const key = normEmail(to).includes('@') ? normEmail(to) : normPhone(to);
  if (!key) return false;
  return !!(await Suppressions.findOne(s => s.key === key));
}

async function sendPush(endpoint: string, subject: string, body: string, link: string, tag: string) {
  const subs: any[] = await DataStore.getAllSubscribers();
  const sub = subs.find(s => s.endpoint === endpoint);
  if (!sub?.keys) throw new Error('This browser is no longer subscribed to notifications.');
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: sub.keys },
      JSON.stringify({ title: subject, body: body.split('\n')[0].slice(0, 180), url: link, icon: '/icons/icon-192.png', badge: '/favicon-32.png', tag }),
    );
  } catch (err: any) {
    if (err?.statusCode === 404 || err?.statusCode === 410) await DataStore.removeSubscriber(sub.endpoint);
    throw new Error(err?.body || err?.message || 'Push failed');
  }
}

/**
 * Creates one message. Push is delivered right away; WhatsApp / email are queued
 * for the admin to send with one click (no paid API needed).
 * Returns null when it was a duplicate or the contact is not valid.
 */
export async function dispatch(m: Outgoing): Promise<MarketingMessage | null> {
  if (!m.to) return null;
  if (m.channel === 'email' && !isValidEmail(m.to)) return null;
  if (m.channel === 'whatsapp' && !isValidPhone(m.to)) return null;
  if (await Messages.findOne(x => x.dedupeKey === m.dedupeKey)) return null;
  if (m.channel !== 'push' && (await isSuppressed(m.to))) return null;

  const base: Omit<MarketingMessage, 'id'> = {
    ...m,
    status: m.channel === 'push' ? 'sent' : 'queued',
    error: '',
    createdAt: new Date().toISOString(),
    sentAt: null,
  };
  if (m.channel === 'push') {
    try {
      await sendPush(m.to, m.subject, m.body, m.link, m.dedupeKey);
      base.sentAt = new Date().toISOString();
    } catch (e: any) {
      base.status = 'failed';
      base.error = String(e.message || e).slice(0, 200);
    }
  }
  try {
    return await Messages.insert(base);
  } catch {
    return null; // unique dedupeKey hit by a parallel call
  }
}

/** WhatsApp / mailto link the admin opens to send a queued message */
export function sendLink(m: MarketingMessage) {
  if (m.channel === 'whatsapp') return `https://wa.me/${normPhone(m.to)}?text=${encodeURIComponent(m.body)}`;
  if (m.channel === 'email') return `mailto:${m.to}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.body)}`;
  return '';
}
