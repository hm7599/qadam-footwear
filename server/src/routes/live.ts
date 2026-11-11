import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { rateLimit } from '../security/index.js';
import { SettingsStore } from '../config/settingsStore.js';
import { recordHit, snapshot, report, getAnalyticsSettings, refreshSettings, clearAllAnalytics, resolveServerGeo } from '../analytics/live.js';

const router = Router();

// Storefront events (public, small, rate-limited). Accepts text/plain from navigator.sendBeacon too.
router.post('/hit', rateLimit('live_hit', 120, 60000), async (req, res) => {
  let body: any = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  try {
    await recordHit(body, {
      ua: String(req.headers['user-agent'] || '').slice(0, 300),
      host: String(req.headers.host || '').split(':')[0],
      countryHeader: String(req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'] || ''),
      cityHeader: String(req.headers['cf-ipcity'] || req.headers['x-vercel-ip-city'] || ''),
    });
    res.status(204).end();
  } catch {
    res.status(400).json({ success: false, message: 'Invalid event.' });
  }
});

// Geo resolver for visitor location accuracy
router.get('/geo', rateLimit('live_geo', 60, 60000), async (req, res) => {
  const cityHeader = String(req.headers['cf-ipcity'] || req.headers['x-vercel-ip-city'] || '');
  const countryHeader = String(req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'] || '');
  if (cityHeader && countryHeader) {
    return res.json({ success: true, city: decodeURIComponent(cityHeader), country: decodeURIComponent(countryHeader) });
  }
  const geo = await resolveServerGeo();
  res.json({ success: true, ...geo });
});

// Admin only: reset all live sessions, feed, and historical analytics
router.post('/reset', protect, adminOnly, async (_req, res) => {
  try {
    await clearAllAnalytics();
    res.json({ success: true, message: 'All live visitor records and traffic reports have been reset to zero.' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message || 'Failed to reset analytics.' });
  }
});

// Admin only
router.get('/snapshot', protect, adminOnly, (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, data: snapshot() });
});

router.get('/report', protect, adminOnly, async (req, res) => {
  const days = [1, 7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 7;
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, data: await report(days) });
});

router.get('/settings', protect, adminOnly, async (_req, res) => res.json({ success: true, data: await getAnalyticsSettings() }));
router.put('/settings', protect, adminOnly, async (req, res) => {
  const b = req.body || {};
  const v = {
    enabled: b.enabled !== false,
    sessionTimeoutSec: Math.min(600, Math.max(20, Math.round(Number(b.sessionTimeoutSec) || 60))),
    retentionDays: Math.min(730, Math.max(7, Math.round(Number(b.retentionDays) || 365))),
  };
  await SettingsStore.set('analytics', v);
  await refreshSettings();
  res.json({ success: true, data: v, message: 'Saved.' });
});

export default router;
