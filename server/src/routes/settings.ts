import { Router } from 'express';
import { SettingsStore } from '../config/settingsStore.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

// Only these keys may be read/written through the API
const ALLOWED_KEYS = new Set(['hero', 'categories', 'whatsapp', 'store', 'payments']);

// GET public setting (e.g. homepage hero content)
router.get('/:key', async (req, res) => {
  const key = String(req.params.key);
  if (!ALLOWED_KEYS.has(key)) return res.status(404).json({ success: false, message: 'Unknown setting.' });
  try {
    const value = await SettingsStore.get(key);
    res.json({ success: true, data: value });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to load setting.' });
  }
});

// PUT update setting (admin only)
router.put('/:key', protect, adminOnly, async (req, res) => {
  const key = String(req.params.key);
  if (!ALLOWED_KEYS.has(key)) return res.status(404).json({ success: false, message: 'Unknown setting.' });
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ success: false, message: 'Setting value must be an object.' });
  }
  try {
    const value = await SettingsStore.set(key, req.body);
    res.json({ success: true, data: value, message: 'Saved successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to save setting.' });
  }
});

export default router;
