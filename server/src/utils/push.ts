import webpush from 'web-push';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();

// Generated keys are saved here so push subscriptions keep working after a restart
const KEY_FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data/vapid-keys.json');

let vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:concierge@qadamshoes.com';

if ((!vapidPublicKey || !vapidPrivateKey) && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  [Push] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set. Keys may change on restart and break every push subscription. Set them in the host environment.');
}
if (!vapidPublicKey || !vapidPrivateKey) {
  try {
    const saved = JSON.parse(fs.readFileSync(KEY_FILE, 'utf-8'));
    vapidPublicKey = saved.publicKey;
    vapidPrivateKey = saved.privateKey;
  } catch {
    const keys = webpush.generateVAPIDKeys();
    vapidPublicKey = keys.publicKey;
    vapidPrivateKey = keys.privateKey;
    try {
      fs.mkdirSync(path.dirname(KEY_FILE), { recursive: true });
      fs.writeFileSync(KEY_FILE, JSON.stringify(keys, null, 2));
      console.log('🔑 [Push] Generated VAPID keys and saved them to data/vapid-keys.json');
    } catch (e: any) {
      console.warn('[Push] Could not save VAPID keys:', e.message);
    }
  }
}

try {
  webpush.setVapidDetails(
    vapidEmail,
    vapidPublicKey as string,
    vapidPrivateKey as string
  );
  console.log('✅ [Push] Web-push VAPID configuration initialized.');
} catch (err: any) {
  console.warn('[Push] Error configuring webpush:', err.message);
}

export { webpush, vapidPublicKey };

/** True when a push failure means the subscription can never work again (expired, or made with other VAPID keys). */
export function isDeadSubscription(err: any): boolean {
  const code = err?.statusCode;
  if (code === 404 || code === 410) return true;
  const detail = String(err?.body || err?.message || '');
  return (code === 403 || code === 400 || code === 401) &&
    /VapidPkHashMismatch|do not correspond|unsubscribed|vapid/i.test(detail);
}
