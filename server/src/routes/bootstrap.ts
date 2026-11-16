import { Router } from 'express';
import { SettingsStore } from '../config/settingsStore.js';
import { publicActivePromo, publicShippingInfo } from './marketing.js';

// One request for everything the storefront needs on first load
// (instead of ~8 separate settings / promo / shipping calls).
const router = Router();
const PUBLIC_SETTINGS = ['hero', 'categories', 'whatsapp', 'store', 'payments'] as const;

router.get('/', async (_req, res) => {
  try {
    const safe = <T>(p: Promise<T>) => p.catch(() => null);
    const [settingValues, activePromo, shippingInfo] = await Promise.all([
      Promise.all(PUBLIC_SETTINGS.map(k => safe(SettingsStore.get(k)))),
      safe(publicActivePromo()),
      safe(publicShippingInfo()),
    ]);
    const settings = Object.fromEntries(PUBLIC_SETTINGS.map((k, i) => [k, settingValues[i] ?? null]));
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=300');
    res.json({ success: true, data: { settings, activePromo, shippingInfo } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to load store data.' });
  }
});

export default router;
