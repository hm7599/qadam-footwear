import { Product, Order, User, AnalyticsData, NotificationLog } from '../types';

const API_BASE = '/api';

// Secret keys for orders placed on this device (needed to see full order details without signing in)
const ORDER_KEYS = 'aura_order_keys';
export const orderKeys = {
  get(num: string): string {
    try { return JSON.parse(localStorage.getItem(ORDER_KEYS) || '{}')[num.toUpperCase()] || ''; } catch { return ''; }
  },
  set(num: string, key: string) {
    try {
      const all = JSON.parse(localStorage.getItem(ORDER_KEYS) || '{}');
      all[num.toUpperCase()] = key;
      localStorage.setItem(ORDER_KEYS, JSON.stringify(all));
    } catch { /* ignore */ }
  },
};

function getHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const activeToken = token || localStorage.getItem('aura_token');
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }
  return headers;
}

const readAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.readAsDataURL(blob);
  });

/**
 * Shrinks an image as much as possible without visible quality loss:
 * - caps the longest side at 1920px (sharp on retina screens for banner/product use)
 * - re-encodes as WebP at high quality (keeps transparency, much smaller than PNG/JPG)
 * - keeps the original if compression would not make it smaller
 * GIFs are left untouched so animation is preserved.
 */
export async function compressImage(file: File, maxSide = 1920, quality = 0.86): Promise<string> {
  if (file.type === 'image/gif') return readAsDataUrl(file);

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return readAsDataUrl(file);

  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return readAsDataUrl(file);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/webp', quality));
  // Some browsers can't encode WebP and silently return PNG; fall back to original if not smaller
  if (!blob || blob.size >= file.size) return readAsDataUrl(file);
  return readAsDataUrl(blob);
}

export const api = {
  // SITE SETTINGS (e.g. homepage hero)
  async getSetting<T = any>(key: string): Promise<T | null> {
    const res = await fetch(`${API_BASE}/settings/${key}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load setting');
    return data.data ?? null;
  },

  async editOrder(orderNumber: string, changes: Record<string, any>): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${orderNumber}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(changes),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update order');
    return data.data;
  },

  async deleteOrder(orderNumber: string): Promise<void> {
    const res = await fetch(`${API_BASE}/orders/${orderNumber}`, { method: 'DELETE', headers: getHeaders() });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(data.message || 'Failed to delete order');
  },

  async uploadImage(file: File): Promise<string> {
    return (await api.uploadImageWithStats(file)).url;
  },

  /** Compresses then uploads; also reports the size before and after compression (bytes) */
  async uploadImageWithStats(file: File): Promise<{ url: string; before: number; after: number }> {
    const dataUrl = await compressImage(file);
    const after = Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 3 / 4);
    const res = await fetch(`${API_BASE}/uploads`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ data: dataUrl }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed');
    return { url: data.data.url, before: file.size, after };
  },

  async updateSetting<T = any>(key: string, value: T): Promise<T> {
    const res = await fetch(`${API_BASE}/settings/${key}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(value),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save setting');
    return data.data;
  },

  // PRODUCTS
  async getProducts(params?: Record<string, any>): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          query.append(k, String(v));
        }
      });
    }
    const res = await fetch(`${API_BASE}/products?${query.toString()}`);
    const data = await res.json();
    return data.data || [];
  },

  /** Admin: all products including drafts */
  async getAdminProducts(): Promise<Product[]> {
    const res = await fetch(`${API_BASE}/products/admin/all`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load products');
    return data.data || [];
  },

  /** Admin: create many products at once (saved as drafts) */
  async bulkCreateProducts(products: Record<string, any>[]): Promise<{ created: number; errors: { row: number; message: string }[]; message: string }> {
    const res = await fetch(`${API_BASE}/products/bulk`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ products }) });
    const data = await res.json();
    if (!res.ok && !data.data) throw new Error(data.message || 'Bulk upload failed');
    return { ...(data.data || { created: 0, errors: [] }), message: data.message };
  },

  async getProduct(idOrSlug: string): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${idOrSlug}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Product not found');
    return data.data;
  },

  async createProduct(productData: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(productData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create product');
    return data.data;
  },

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(productData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update product');
    return data.data;
  },

  async deleteProduct(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete product');
  },

  async submitReview(productId: string, review: { author: string; rating: number; title: string; comment: string }): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${productId}/review`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(review)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to submit review');
    return data.data;
  },

  // ORDERS
  async createOrder(orderPayload: any): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(orderPayload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create order');
    if (data.data?.orderNumber && data.data.accessKey) orderKeys.set(data.data.orderNumber, data.data.accessKey);
    // If this device has notifications on, link it to the order for status alerts
    if (data.data?.orderNumber) api.linkDeviceToOrder(data.data.orderNumber);
    return data.data;
  },

  async createManualOrder(payload: any): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/manual`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add order');
    return data.data;
  },

  /** Links the current device's push subscription to an order (silent, best-effort) */
  async linkDeviceToOrder(orderNumber: string): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (!sub) return false;
      const res = await fetch(`${API_BASE}/notifications/link-order`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ endpoint: sub.endpoint, orderNumber, key: orderKeys.get(orderNumber) }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getOrderPushInfo(orderNumber: string): Promise<{ devices: number; presets: Record<string, { title: string; body: string }> }> {
    const res = await fetch(`${API_BASE}/notifications/order/${orderNumber}`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load');
    return data.data;
  },

  async sendOrderPush(orderNumber: string, title: string, body: string): Promise<string> {
    const res = await fetch(`${API_BASE}/notifications/order`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ orderNumber, title, body }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send');
    return data.message;
  },

  async getOrders(params?: { email?: string; orderStatus?: string }): Promise<Order[]> {
    const query = new URLSearchParams();
    if (params?.email) query.append('email', params.email);
    if (params?.orderStatus) query.append('orderStatus', params.orderStatus);
    const res = await fetch(`${API_BASE}/orders?${query.toString()}`, {
      headers: getHeaders()
    });
    const data = await res.json();
    return data.data || [];
  },

  async getOrderByNumber(orderNumber: string, key?: string): Promise<Order & { limited?: boolean }> {
    const k = key || orderKeys.get(orderNumber);
    if (key) orderKeys.set(orderNumber, key);
    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderNumber)}${k ? `?key=${encodeURIComponent(k)}` : ''}`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Order not found');
    return { ...data.data, limited: !!data.limited };
  },

  async updateOrderStatus(orderNumber: string, status: string, trackingNumber?: string, note?: string, trackingCarrier?: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${orderNumber}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, trackingNumber, note, trackingCarrier })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update order status');
    return data.data;
  },

  // AUTH
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to log in');
    return data;
  },

  async register(payload: { name: string; email: string; password: string; phone?: string }): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to register');
    return data;
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Not authenticated');
    return data.user;
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/users`, {
      headers: getHeaders()
    });
    const data = await res.json();
    return data.data || [];
  },

  // NOTIFICATIONS
  async getVapidKey(): Promise<string> {
    const res = await fetch(`${API_BASE}/notifications/vapid-key`);
    const data = await res.json();
    return data.publicKey;
  },

  async subscribePush(subscription: any): Promise<void> {
    const res = await fetch(`${API_BASE}/notifications/subscribe`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ subscription })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Push subscribe failed');
  },

  async sendNotification(payload: { title: string; body: string; url: string; targetAudience?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/send`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Push send failed');
    return data;
  },

  async getNotificationHistory(): Promise<NotificationLog[]> {
    const res = await fetch(`${API_BASE}/notifications/history`, {
      headers: getHeaders()
    });
    const data = await res.json();
    return data.data || [];
  },

  async getSubscribers(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/notifications/subscribers`, {
      headers: getHeaders()
    });
    const data = await res.json();
    return data.data || [];
  },

  // ANALYTICS
  async getAnalytics(): Promise<AnalyticsData> {
    const res = await fetch(`${API_BASE}/analytics/dashboard`, {
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load analytics');
    return data.data;
  }
};
