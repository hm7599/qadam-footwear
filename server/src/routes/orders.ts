import { Router } from 'express';
import { DataStore } from '../config/store.js';
import { SettingsStore } from '../config/settingsStore.js';
import { notifyAdminsNewOrder } from '../utils/adminPush.js';
import { protect, adminOnly, optionalAuth, isAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import { rateLimit } from '../security/index.js';
import crypto from 'crypto';
import { sendOrderPush } from '../utils/orderPush.js';
import { placeWebsiteOrder } from '../marketing/checkout.js';

const router = Router();

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
const mask = (v: string, keep = 3) => (v ? '•'.repeat(Math.max(0, Math.min(6, v.length - keep))) + v.slice(-keep) : '');

/** Removes secrets always, and personal details unless 'full' */
export function publicOrder(o: any, full: boolean, admin = false) {
  const obj = o?.toObject ? o.toObject() : { ...o };
  // The admin keeps the key so WhatsApp tracking links can open full details for the customer
  if (!admin) { delete obj.accessKey; delete obj.adminNote; }
  if (full) return obj;
  const c = obj.customer || {};
  const first = String(c.name || '').trim().split(/s+/)[0] || 'Customer';
  obj.customer = { name: first, phone: mask(String(c.phone || '').replace(/s/g, ''), 3), email: '', address: '', apartment: '', city: c.city || '', state: c.state || '', postalCode: '', country: c.country || '' };
  delete obj.userId;
  return obj;
}

// Allowed status changes. 'pending' = waiting for admin approval.
const ORDER_FLOW: Record<string, string[]> = {
  pending: ['processing', 'cancelled'],   // approve or reject
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

// POST manual order (Admin) – orders taken on WhatsApp, phone, in shop, etc.
router.post('/manual', protect, adminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const b = req.body || {};
    const c = b.customer || {};
    if (!c.name || !c.phone || !Array.isArray(b.items) || !b.items.length) {
      return res.status(400).json({ success: false, message: 'Customer name, phone and at least one item are required.' });
    }
    const subtotal = b.items.reduce((acc: number, it: any) => acc + Number(it.price || 0) * Number(it.quantity || 1), 0);
    const shippingCost = Number(b.shippingCost) || 0;
    const discount = Number(b.discount) || 0;
    const order = await DataStore.createOrder({
      customer: {
        name: c.name, phone: c.phone,
        email: c.email || 'no-email@qadam.local',
        address: c.address || (b.trackingCarrier === 'Self Pickup' ? 'Self pickup' : '-'),
        apartment: c.apartment || '',
        city: c.city || '-',
        postalCode: c.postalCode || '00000',
        country: 'Pakistan',
      },
      items: b.items,
      subtotal,
      shippingCost,
      discount,
      totalAmount: Math.max(0, subtotal + shippingCost - discount),
      paymentMethod: b.paymentMethod === 'cod' ? 'cod' : 'card',
      paymentStatus: b.paymentStatus,
      shippingMethod: b.trackingCarrier || 'Courier',
      trackingCarrier: b.trackingCarrier || '',
      trackingNumber: b.trackingNumber || '',
      source: b.source === 'whatsapp' ? 'whatsapp' : 'other',
      orderStatus: b.orderStatus || 'processing',
      adminNote: b.adminNote || '',
    });
    res.status(201).json({ success: true, message: 'Order added.', data: order });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create order (website checkout — always source "website", waits for approval).
// Prices, coupon, delivery and totals are worked out on the server; the browser's numbers are ignored.
router.post('/', async (req, res) => {
  try {
    const { customer, items, couponCode, paymentMethod, shippingMethod, cartId } = req.body || {};
    if (!customer || !customer.name || !customer.address || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, message: 'Customer details and at least one item are required.' });
    }
    // Pakistani mobile number (03XXXXXXXXX / +923XXXXXXXXX)
    if (!/^(?:\+92|0092|92|0)3\d{9}$/.test(String(customer.phone || '').replace(/[\s-]/g, ''))) {
      return res.status(400).json({ success: false, message: 'Please enter a valid Pakistani mobile number, e.g. 0300 1234567.' });
    }
    // Email is optional for online store checkout in Pakistan (assign internal handle if not provided)
    const rawEmail = String(customer.email || '').trim();
    if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      const phoneClean = String(customer.phone || '').replace(/\D/g, '');
      customer.email = `${phoneClean || 'order'}@qadamclient.pk`;
    }
    // Respect Admin → Settings → Payments
    const pay: any = (await SettingsStore.get('payments')) || {};
    const codOn = pay.codEnabled !== false;
    const onlineOn = pay.onlineEnabled !== false;
    if (paymentMethod === 'cod' ? !codOn : !onlineOn) {
      return res.status(400).json({ success: false, message: 'This payment method is not available right now. Please choose another one.' });
    }
    const result = await placeWebsiteOrder({ customer, items, couponCode, paymentMethod, shippingMethod, cartId });
    if ('error' in result) return res.status(400).json({ success: false, message: result.error, code: result.code });
    const order = result.order;

    // Tell admin devices (phone/PC) about the new order, even if the admin panel is closed
    notifyAdminsNewOrder(order).catch(() => {});

    // The secret key lets this customer open full order details later (tracking link)
    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data: { ...publicOrder(order, true), accessKey: (order as any).accessKey }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET orders — admin: all orders; signed-in customer: only their own (matched by account email)
router.get('/', protect, async (req: AuthenticatedRequest, res) => {
  try {
    const { orderStatus } = req.query as Record<string, string>;
    const own = !isAdmin(req);
    const orders = await DataStore.getOrders({ email: own ? String(req.user.email) : (req.query as any).email, orderStatus });
    const list = (orders as any[]).map(o => publicOrder(o, true, !own));
    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET one order (Order Tracking page).
// Full details only for the admin, the account that placed it, or someone holding the order's secret key.
// Anyone else who types an order number only sees the status with personal details hidden.
router.get('/:orderNumber', rateLimit('order_lookup', 30, 10 * 60000), optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const orderNumber = String(req.params.orderNumber).slice(0, 40);
    const order: any = await DataStore.getOrderByNumber(orderNumber);
    if (!order) {
      return res.status(404).json({ success: false, message: `No order found matching "${orderNumber}".` });
    }
    const key = String((req.query as any).key || req.headers['x-order-key'] || '');
    const full = isAdmin(req) ||
      (!!req.user && String(req.user.email).toLowerCase() === String(order.customer?.email).toLowerCase()) ||
      (!!order.accessKey && key.length > 0 && safeEqual(key, order.accessKey));
    res.json({ success: true, data: publicOrder(order, full, isAdmin(req)), limited: !full });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH update order status (Admin)
router.patch('/:orderNumber/status', protect, adminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const orderNumber = String(req.params.orderNumber);
    const { status, trackingNumber, note, trackingCarrier } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    // Enforce the order workflow: approve first, then process → ship → deliver
    const current: any = await DataStore.getOrderByNumber(orderNumber);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    const from = String(current.orderStatus);
    const allowed = ORDER_FLOW[from] || [];
    if (status !== from && !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: from === 'pending'
          ? 'This order must be approved first.'
          : `Cannot change an order from "${from}" to "${status}".`,
      });
    }

    const updated = await DataStore.updateOrderStatus(orderNumber, status, trackingNumber, note, trackingCarrier);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    // Tell the customer (push notification) — runs in the background
    if (status !== from) sendOrderPush(orderNumber, { status });
    res.json({
      success: true,
      message: 'Order status updated successfully.',
      data: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT edit order (Admin) – details and status (any status, for corrections)
router.put('/:orderNumber', protect, adminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const orderNumber = String(req.params.orderNumber);
    const before: any = await DataStore.getOrderByNumber(orderNumber);
    const prevStatus = before ? String(before.orderStatus) : '';
    const updated = await DataStore.editOrder(orderNumber, req.body || {});
    if (!updated) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (req.body?.orderStatus && req.body.orderStatus !== prevStatus && req.body.notifyCustomer !== false) {
      sendOrderPush(orderNumber, { status: req.body.orderStatus });
    }
    res.json({ success: true, message: 'Order updated.', data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE order permanently (Admin)
router.delete('/:orderNumber', protect, adminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const ok = await DataStore.deleteOrder(String(req.params.orderNumber));
    if (!ok) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, message: 'Order deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
