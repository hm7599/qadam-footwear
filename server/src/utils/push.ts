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
