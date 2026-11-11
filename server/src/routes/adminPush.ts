import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { addAdminSub, removeAdminSub, getAdminSubs, sendToAdmins } from '../utils/adminPush.js';

const router = Router();

// Register this device to receive new-order alerts
router.post('/subscribe', protect, adminOnly, async (req, res) => {
  const { subscription, label } = req.body || {};
  if (!subscription?.endpoint || !subscription?.keys) {
    return res.status(400).json({ success: false, message: 'Valid push subscription required.' });
  }
  try {
    const count = await addAdminSub(subscription, label || String(req.headers['user-agent'] || '').slice(0, 120));
    res.json({ success: true, data: { devices: count } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/unsubscribe', protect, adminOnly, async (req, res) => {
  const endpoint = req.body?.endpoint;
  if (!endpoint) return res.status(400).json({ success: false, message: 'Endpoint required.' });
  try {
    const count = await removeAdminSub(endpoint);
    res.json({ success: true, data: { devices: count } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/devices', protect, adminOnly, async (_req, res) => {
  const subs = await getAdminSubs();
  res.json({ success: true, data: { devices: subs.length, endpoints: subs.map(s => s.endpoint) } });
});

// Send a test alert to all admin devices
router.post('/test', protect, adminOnly, async (_req, res) => {
  const result = await sendToAdmins({
    kind: 'new-order',
    title: '🛍️ Test: New order from Ali Khan',
    body: 'TEST-0001 · 1 item(s) · Rs. 110,600 · Lahore',
    icon: '/icons/admin-192.png',
    url: '/admin/orders',
    tag: `test-${Date.now()}`,
    requireInteraction: true,
    order: { orderNumber: 'TEST-0001', name: 'Ali Khan', city: 'Lahore', items: 1, total: 'Rs. 110,600' },
  });
  res.json({ success: true, data: result });
});

export default router;
