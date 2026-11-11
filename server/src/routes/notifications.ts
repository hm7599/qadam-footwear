import { Router } from 'express';
import { DataStore } from '../config/store.js';
import { webpush, vapidPublicKey } from '../utils/push.js';
import { protect, adminOnly, AuthenticatedRequest } from '../middleware/auth.js';
import { sendOrderPush, ORDER_PUSH_TEXT } from '../utils/orderPush.js';

const router = Router();

// GET public VAPID key
router.get('/vapid-key', (req, res) => {
  res.json({
    success: true,
    publicKey: vapidPublicKey
  });
});

// POST subscribe to push
router.post('/subscribe', async (req, res) => {
  try {
    const rawSub = req.body?.subscription || req.body;
    const { userAgent, topics } = req.body || {};
    if (!rawSub || !rawSub.endpoint || !rawSub.keys?.p256dh || !rawSub.keys?.auth) {
      return res.status(400).json({ success: false, message: 'Valid push subscription object required.' });
    }

    const sub = await DataStore.saveSubscriber({
      endpoint: rawSub.endpoint,
      keys: rawSub.keys,
      userAgent: userAgent || req.headers['user-agent'],
      topics: Array.isArray(topics) && topics.length ? topics : ['all']
    });

    res.status(201).json({
      success: true,
      message: 'Subscribed to QADAM Drops & Announcements successfully.',
      data: sub
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST unsubscribe
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ success: false, message: 'Endpoint is required.' });
    }
    await DataStore.removeSubscriber(endpoint);
    res.json({
      success: true,
      message: 'Unsubscribed from push notifications.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST link this device to an order (called right after checkout)
router.post('/link-order', async (req, res) => {
  try {
    const { endpoint, orderNumber, key } = req.body || {};
    if (!endpoint || !orderNumber) return res.status(400).json({ success: false, message: 'endpoint and orderNumber are required.' });
    const order: any = await DataStore.getOrderByNumber(String(orderNumber));
    // Only the person who placed the order (holds its secret key) can follow it
    if (!order || !order.accessKey || String(key || '') !== String(order.accessKey)) return res.status(404).json({ success: false, message: 'Order not found.' });
    const linked = await DataStore.linkSubscriberToOrder(String(endpoint), String(orderNumber));
    // Confirm to the customer that order alerts are on
    if (linked) sendOrderPush(String(orderNumber), { status: 'pending' });
    res.json({ success: true, linked });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET default order message texts + how many devices follow an order (Admin)
router.get('/order/:orderNumber', protect, adminOnly, async (req, res) => {
  try {
    const subs = await DataStore.getSubscribersForOrder(String(req.params.orderNumber));
    res.json({ success: true, data: { devices: subs.length, presets: ORDER_PUSH_TEXT } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST send a push notification about one order to that customer (Admin)
router.post('/order', protect, adminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const { orderNumber, title, body } = req.body || {};
    if (!orderNumber || !title || !body) return res.status(400).json({ success: false, message: 'Order, title and message are required.' });
    const result = await sendOrderPush(String(orderNumber), { title, body, sentBy: req.user?.name || 'QADAM Admin' });
    if (!result.targeted) {
      return res.status(404).json({ success: false, message: 'This customer has not turned on notifications on their device.' });
    }
    res.json({ success: true, message: `Sent to ${result.delivered} of ${result.targeted} device(s).`, stats: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST send push notification (Admin)
router.post('/send', protect, adminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const { title, body, url, targetAudience } = req.body || {};
    const cleanTitle = String(title || '').trim();
    const cleanBody = String(body || '').trim();
    if (!cleanTitle || !cleanBody) {
      return res.status(400).json({ success: false, message: 'Title and body are required.' });
    }

    const audience = String(targetAudience || 'all');
    const allSubscribers = await DataStore.getAllSubscribers();
    const subscribers = audience === 'all'
      ? allSubscribers
      : allSubscribers.filter((sub: any) => !Array.isArray(sub.topics) || !sub.topics.length || sub.topics.includes(audience) || sub.topics.includes('all'));

    if (!subscribers.length) {
      return res.json({
        success: false,
        message: 'No subscribed customer devices found. Enable alerts on the storefront (or click "Subscribe This Browser" below) first.',
        stats: { totalTargeted: 0, delivered: 0, failed: 0, cleanedUpStale: 0, errors: [] }
      });
    }

    const payload = JSON.stringify({
      kind: 'broadcast',
      title: cleanTitle,
      body: cleanBody,
      url: String(url || '/').trim() || '/',
      icon: '/icons/icon-192.png',
      badge: '/favicon-32.png',
      tag: `qadam-broadcast-${Date.now()}`
    });

    let successCount = 0;
    let failureCount = 0;
    const staleEndpoints: string[] = [];
    const errors: string[] = [];

    // Send to subscribers concurrently with high urgency & 24h TTL
    const pushPromises = subscribers.map(async (sub: any) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload,
          { TTL: 60 * 60 * 24, urgency: 'high' }
        );
        successCount++;
      } catch (err: any) {
        failureCount++;
        const code = err?.statusCode || '';
        const detail = String(err?.body || err?.message || 'Push delivery error').replace(/\s+/g, ' ').trim().slice(0, 140);
        const label = code ? `[${code}] ${detail}` : detail;
        console.warn('[Push] Broadcast send failed:', label);
        if (errors.length < 5 && !errors.includes(label)) errors.push(label);
        if (code === 404 || code === 410 || /VapidPkHashMismatch|unsubscribed/i.test(detail)) {
          staleEndpoints.push(sub.endpoint);
        }
      }
    });

    await Promise.allSettled(pushPromises);

    // Clean up expired or key-mismatched subscriptions
    for (const endpoint of staleEndpoints) {
      await DataStore.removeSubscriber(endpoint);
    }

    // Log the notification broadcast
    const log = await DataStore.logNotification({
      title: cleanTitle,
      body: cleanBody,
      url: String(url || '/').trim() || '/',
      targetAudience: audience,
      recipientCount: subscribers.length,
      successCount,
      failureCount,
      sentBy: req.user?.name || 'QADAM Admin'
    });

    const summaryMsg = successCount > 0 && failureCount === 0
      ? `Delivered to ${successCount} subscribed device(s).`
      : successCount > 0
        ? `Delivered to ${successCount} of ${subscribers.length} device(s) (${failureCount} failed${staleEndpoints.length ? `, ${staleEndpoints.length} expired removed` : ''}).`
        : `Delivery failed for all ${subscribers.length} device(s)${errors[0] ? `: ${errors[0]}` : ''}${staleEndpoints.length ? ' (expired subscription removed — please re-subscribe)' : ''}.`;

    res.json({
      success: successCount > 0,
      message: summaryMsg,
      stats: {
        totalTargeted: subscribers.length,
        delivered: successCount,
        failed: failureCount,
        cleanedUpStale: staleEndpoints.length,
        errors
      },
      log
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET notification history
router.get('/history', protect, adminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const logs = await DataStore.getNotificationLogs();
    res.json({
      success: true,
      data: logs
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all active subscribers (Admin)
router.get('/subscribers', protect, adminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const subs = await DataStore.getAllSubscribers();
    res.json({
      success: true,
      count: subs.length,
      data: subs
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
