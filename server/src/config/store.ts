import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isMongoConnected } from './db.js';
import { escapeRegex } from '../security/index.js';
import { Product, IProduct } from '../models/Product.js';
import { Order, IOrder } from '../models/Order.js';
import { User, IUser } from '../models/User.js';
import { NotificationSubscriber } from '../models/NotificationSubscriber.js';
import { NotificationLog } from '../models/NotificationLog.js';
import { SEED_PRODUCTS, ProductItem } from '../data/seedProducts.js';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.QADAM_DATA_DIR || process.env.AURA_DATA_DIR || path.resolve(__dirname, '../../data');
const SUBS_FILE = path.join(DATA_DIR, 'notification-subscribers.json');
const LOGS_FILE = path.join(DATA_DIR, 'notification-logs.json');
let diskWriteChain: Promise<void> = Promise.resolve();

function loadJsonArray<T>(file: string, fallback: T[] = []): T[] {
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function persistJsonArray(file: string, data: any[]) {
  const payload = JSON.stringify(data, null, 2);
  diskWriteChain = diskWriteChain.then(() => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, payload, 'utf-8');
    fs.renameSync(tmp, file);
  }).catch(e => console.warn('[DataStore] save failed:', e?.message || e));
}

// Fallback in-memory state
let memoryProducts: any[] = JSON.parse(JSON.stringify(SEED_PRODUCTS));
let memoryOrders: any[] = [
  {
    _id: "order-sample-1",
    orderNumber: "QDM-89214",
    customer: {
      name: "Alex Sterling",
      email: "alex@example.com",
      phone: "+1 (555) 394-8192",
      address: "742 Evergreen Terrace",
      apartment: "Penthouse 4B",
      city: "New York",
      state: "NY",
      postalCode: "10001",
      country: "United States"
    },
    items: [
      {
        productId: "prod-aura-phantom-01",
        name: "QADAM Phantom Oxford Brogue",
        slug: "qadam-phantom-01",
        price: 395,
        color: "Obsidian Noir",
        size: 10,
        quantity: 1,
        image: "/images/shoes/qadam-oxford-derby-black.png"
      }
    ],
    subtotal: 395,
    shippingCost: 0,
    discount: 0,
    totalAmount: 395,
    shippingMethod: "Complimentary Express Courier",
    paymentMethod: "card",
    paymentStatus: "paid",
    orderStatus: "shipped",
    trackingNumber: "FX-849201938US",
    trackingCarrier: "FedEx Luxury Priority",
    statusHistory: [
      { status: "pending", timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), note: "Order placed & payment verified" },
      { status: "processing", timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(), note: "Passed luxury atelier quality inspection" },
      { status: "shipped", timestamp: new Date(Date.now() - 86400000 * 0.5).toISOString(), note: "Dispatched via FedEx Priority" }
    ],
    estimatedDeliveryDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

// Admin password comes from ADMIN_PASSWORD in .env (never hard-coded). Without it a random one is used.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 10
  ? process.env.ADMIN_PASSWORD
  : (console.warn("⚠️  [auth] ADMIN_PASSWORD not set in .env — admin login is disabled until you set it."), require_random());
function require_random() { return globalThis.crypto.randomUUID() + globalThis.crypto.randomUUID(); }

let memoryUsers: any[] = [
  {
    _id: "user-admin-1",
    name: "QADAM Executive Admin",
    email: "admin@qadamshoes.com",
    passwordHash: bcrypt.hashSync(ADMIN_PASSWORD, 12),
    role: "admin",
    phone: "+1 (555) 019-2831",
    createdAt: new Date().toISOString()
  },
  {
    _id: "user-customer-1",
    name: "Alex Sterling",
    email: "alex@example.com",
    passwordHash: bcrypt.hashSync("customer123", 10),
    role: "customer",
    phone: "+1 (555) 394-8192",
    shippingAddress: {
      address: "742 Evergreen Terrace",
      apartment: "Penthouse 4B",
      city: "New York",
      state: "NY",
      postalCode: "10001",
      country: "United States"
    },
    wishlist: ["prod-aura-phantom-01", "prod-aura-luxe-celestial"],
    createdAt: new Date().toISOString()
  }
];

let memorySubscribers: any[] = loadJsonArray<any>(SUBS_FILE, []);
let memoryNotificationLogs: any[] = loadJsonArray<any>(LOGS_FILE, []);

export const DataStore = {
  // PRODUCTS
  async getProducts(filter: any = {}) {
    if (isMongoConnected) {
      try {
        let query: any = {};
        if (filter.category && filter.category !== 'all') query.category = filter.category;
        if (filter.gender && filter.gender !== 'all') query.gender = { $in: [filter.gender, 'unisex'] };
        if (filter.isNewArrival === 'true') query.isNewArrival = true;
        if (filter.isBestSeller === 'true') query.isBestSeller = true;
        if (filter.isTrending === 'true') query.isTrending = true;
        if (filter.isLimitedEdition === 'true') query.isLimitedEdition = true;
        // Draft products are hidden from the shop; only the admin list asks for them
        if (!filter.includeDrafts) query.status = { $ne: 'draft' };
        if (filter.search) {
          query.$or = [
            { name: { $regex: escapeRegex(String(filter.search).slice(0, 80)), $options: 'i' } },
            { description: { $regex: escapeRegex(String(filter.search).slice(0, 80)), $options: 'i' } },
            { tagline: { $regex: escapeRegex(String(filter.search).slice(0, 80)), $options: 'i' } }
          ];
        }
        return await Product.find(query).sort({ createdAt: -1 });
      } catch (e) {
        console.warn('Mongo product find fallback:', e);
      }
    }

    // In-memory filter
    return memoryProducts.filter(p => {
      if (!filter.includeDrafts && p.status === 'draft') return false;
      if (filter.category && filter.category !== 'all' && p.category !== filter.category) return false;
      if (filter.gender && filter.gender !== 'all' && p.gender !== filter.gender && p.gender !== 'unisex') return false;
      if (filter.isNewArrival === 'true' && !p.isNewArrival) return false;
      if (filter.isBestSeller === 'true' && !p.isBestSeller) return false;
      if (filter.isTrending === 'true' && !p.isTrending) return false;
      if (filter.isLimitedEdition === 'true' && !p.isLimitedEdition) return false;
      if (filter.search) {
        const term = filter.search.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(term);
        const matchesTagline = p.tagline?.toLowerCase().includes(term);
        const matchesDesc = p.description?.toLowerCase().includes(term);
        if (!matchesName && !matchesTagline && !matchesDesc) return false;
      }
      return true;
    });
  },

  async getProductByIdOrSlug(idOrSlug: string) {
    const alt = /^aura-/i.test(idOrSlug)
      ? idOrSlug.replace(/^aura-/i, 'qadam-')
      : /^qadam-/i.test(idOrSlug)
        ? idOrSlug.replace(/^qadam-/i, 'aura-')
        : '';
    const candidates = alt ? [idOrSlug, alt] : [idOrSlug];
    if (isMongoConnected) {
      try {
        const isObjectId = idOrSlug.match(/^[0-9a-fA-F]{24}$/);
        const query = isObjectId
          ? { $or: [{ _id: idOrSlug }, { slug: { $in: candidates } }, { id: { $in: candidates } }] }
          : { $or: [{ slug: { $in: candidates } }, { id: { $in: candidates } }] };
        const prod = await Product.findOne(query);
        if (prod) return prod;
      } catch (e) {
        console.warn('Mongo getProduct fallback:', e);
      }
    }
    return memoryProducts.find(p => candidates.includes(p.slug) || candidates.includes(p.id) || p._id === idOrSlug);
  },

  async createProduct(productData: any) {
    if (!productData.slug) {
      productData.slug = productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (!productData.id) {
      productData.id = 'prod-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    }
    // Make sure the slug is unique (bulk uploads can contain similar names)
    const base = productData.slug;
    for (let n = 2; await this.getProductByIdOrSlug(productData.slug); n++) productData.slug = `${base}-${n}`;
    if (isMongoConnected) {
      try {
        return await Product.create(productData);
      } catch (e) {
        console.warn('Mongo createProduct fallback:', e);
      }
    }
    const newProd = {
      _id: 'prod-' + Date.now(),
      ...productData,
      rating: productData.rating || 5.0,
      reviewCount: productData.reviewCount || 0,
      reviews: productData.reviews || [],
      createdAt: new Date().toISOString()
    };
    memoryProducts.unshift(newProd);
    return newProd;
  },

  async updateProduct(id: string, updates: any) {
    if (isMongoConnected) {
      try {
        return await Product.findOneAndUpdate(
          { $or: [{ _id: id }, { id }, { slug: id }] },
          { $set: updates },
          { new: true }
        );
      } catch (e) {
        console.warn('Mongo updateProduct fallback:', e);
      }
    }
    const index = memoryProducts.findIndex(p => p.id === id || p._id === id || p.slug === id);
    if (index !== -1) {
      memoryProducts[index] = { ...memoryProducts[index], ...updates, updatedAt: new Date().toISOString() };
      return memoryProducts[index];
    }
    return null;
  },

  async deleteProduct(id: string) {
    if (isMongoConnected) {
      try {
        await Product.findOneAndDelete({ $or: [{ _id: id }, { id }, { slug: id }] });
        return true;
      } catch (e) {
        console.warn('Mongo deleteProduct fallback:', e);
      }
    }
    const beforeLen = memoryProducts.length;
    memoryProducts = memoryProducts.filter(p => p.id !== id && p._id !== id && p.slug !== id);
    return memoryProducts.length < beforeLen;
  },

  async addReview(productId: string, review: any) {
    const newReview = {
      id: 'rev-' + Date.now(),
      author: review.author || 'Anonymous Connoisseur',
      rating: Number(review.rating) || 5,
      date: new Date().toISOString().split('T')[0],
      title: review.title || 'Exceptional experience',
      comment: review.comment || '',
      verified: false // anonymous website review — not a confirmed purchase
    };

    if (isMongoConnected) {
      try {
        const prod = await Product.findOne({ $or: [{ _id: productId }, { id: productId }, { slug: productId }] });
        if (prod) {
          prod.reviews.unshift(newReview);
          prod.reviewCount = prod.reviews.length;
          const sum = prod.reviews.reduce((acc, r) => acc + r.rating, 0);
          prod.rating = Number((sum / prod.reviews.length).toFixed(1));
          await prod.save();
          return prod;
        }
      } catch (e) {
        console.warn('Mongo addReview fallback:', e);
      }
    }

    const prod = memoryProducts.find(p => p.id === productId || p._id === productId || p.slug === productId);
    if (prod) {
      prod.reviews = prod.reviews || [];
      prod.reviews.unshift(newReview);
      prod.reviewCount = prod.reviews.length;
      const sum = prod.reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
      prod.rating = Number((sum / prod.reviews.length).toFixed(1));
      return prod;
    }
    return null;
  },

  // ORDERS
  async getOrders(filter: any = {}) {
    if (isMongoConnected) {
      try {
        let query: any = {};
        if (filter.email) query['customer.email'] = filter.email;
        if (filter.orderStatus && filter.orderStatus !== 'all') query.orderStatus = filter.orderStatus;
        return await Order.find(query).sort({ createdAt: -1 });
      } catch (e) {
        console.warn('Mongo getOrders fallback:', e);
      }
    }
    return memoryOrders.filter(o => {
      if (filter.email && o.customer?.email?.toLowerCase() !== filter.email.toLowerCase()) return false;
      if (filter.orderStatus && filter.orderStatus !== 'all' && o.orderStatus !== filter.orderStatus) return false;
      return true;
    });
  },

  /** Admin edit: customer details, courier/tracking, payment status and (any) order status */
  async editOrder(orderNumber: string, changes: any) {
    const ord: any = await this.getOrderByNumber(orderNumber);
    if (!ord) return null;

    const c = changes.customer || {};
    const fields = ['name', 'phone', 'email', 'address', 'apartment', 'city', 'state', 'postalCode'];
    ord.customer = ord.customer || {};
    for (const f of fields) {
      if (typeof c[f] === 'string') ord.customer[f] = c[f].trim();
    }
    if (typeof changes.trackingNumber === 'string') ord.trackingNumber = changes.trackingNumber.trim();
    if (typeof changes.trackingCarrier === 'string') ord.trackingCarrier = changes.trackingCarrier.trim();
    if (['paid', 'pending', 'failed'].includes(changes.paymentStatus)) ord.paymentStatus = changes.paymentStatus;

    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (statuses.includes(changes.orderStatus) && changes.orderStatus !== ord.orderStatus) {
      ord.orderStatus = changes.orderStatus;
      ord.statusHistory = ord.statusHistory || [];
      ord.statusHistory.push({
        status: changes.orderStatus,
        timestamp: new Date(),
        note: (changes.note && String(changes.note).trim()) || 'Status changed by admin',
      });
    }

    if (typeof ord.save === 'function') {
      if (typeof ord.markModified === 'function') ord.markModified('customer');
      await ord.save();
    }
    return ord;
  },

  async deleteOrder(orderNumber: string): Promise<boolean> {
    const cleanNum = orderNumber.trim().toUpperCase();
    let deleted = false;
    if (isMongoConnected) {
      try {
        const r = await Order.findOneAndDelete({ orderNumber: cleanNum });
        if (r) deleted = true;
      } catch (e) {
        console.warn('Mongo deleteOrder fallback:', e);
      }
    }
    const idx = memoryOrders.findIndex(o => o.orderNumber?.toUpperCase() === cleanNum || o._id === orderNumber);
    if (idx !== -1) { memoryOrders.splice(idx, 1); deleted = true; }
    return deleted;
  },

  async getOrderByNumber(orderNumber: string) {
    const cleanNum = orderNumber.trim().toUpperCase();
    if (isMongoConnected) {
      try {
        const ord = await Order.findOne({ orderNumber: cleanNum });
        if (ord) return ord;
      } catch (e) {
        console.warn('Mongo getOrderByNumber fallback:', e);
      }
    }
    return memoryOrders.find(o => o.orderNumber?.toUpperCase() === cleanNum || o._id === orderNumber);
  },

  async createOrder(orderData: any) {
    const randNum = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `QDM-${randNum}`;
    // Website orders wait for admin approval. Manual orders (added by admin) may start at any status.
    const source = ['website', 'whatsapp', 'other'].includes(orderData.source) ? orderData.source : 'website';
    const allowedStatus = ['pending', 'processing', 'shipped', 'delivered'];
    const initialStatus = source !== 'website' && allowedStatus.includes(orderData.orderStatus) ? orderData.orderStatus : 'pending';
    const paymentStatus = ['paid', 'pending'].includes(orderData.paymentStatus)
      ? orderData.paymentStatus
      : (orderData.paymentMethod === 'cod' ? 'pending' : 'paid');
    const newOrder = {
      orderNumber,
      customer: orderData.customer,
      items: orderData.items,
      subtotal: orderData.subtotal,
      shippingCost: orderData.shippingCost || 0,
      discount: orderData.discount || 0,
      couponCode: orderData.couponCode || '',
      accessKey: globalThis.crypto.randomUUID().replace(/-/g, ''),
      totalAmount: orderData.totalAmount,
      shippingMethod: orderData.shippingMethod || 'Complimentary Express Courier',
      paymentMethod: orderData.paymentMethod || 'card',
      paymentStatus,
      orderStatus: initialStatus,
      source,
      trackingNumber: orderData.trackingNumber || '',
      trackingCarrier: orderData.trackingCarrier || '',
      adminNote: orderData.adminNote || '',
      statusHistory: [
        source === 'website'
          ? { status: 'pending', timestamp: new Date(), note: 'Order received – waiting for approval' }
          : { status: initialStatus, timestamp: new Date(), note: `Order added by admin (${source === 'whatsapp' ? 'WhatsApp' : 'Other'})` }
      ],
      estimatedDeliveryDate: new Date(Date.now() + 86400000 * 3),
      createdAt: new Date()
    };

    if (isMongoConnected) {
      try {
        return await Order.create(newOrder);
      } catch (e) {
        console.warn('Mongo createOrder fallback:', e);
      }
    }

    const savedOrder = { _id: 'order-' + Date.now(), ...newOrder };
    memoryOrders.unshift(savedOrder);
    return savedOrder;
  },

  async updateOrderStatus(orderNumber: string, status: string, trackingNumber?: string, note?: string, trackingCarrier?: string) {
    if (isMongoConnected) {
      try {
        const ord = await Order.findOne({ orderNumber: orderNumber.toUpperCase() });
        if (ord) {
          ord.orderStatus = status as any;
          if (trackingNumber) ord.trackingNumber = trackingNumber;
          if (trackingCarrier) ord.trackingCarrier = trackingCarrier;
          ord.statusHistory.push({
            status: status as any,
            timestamp: new Date(),
            note: note || `Order status updated to ${status}`
          });
          await ord.save();
          return ord;
        }
      } catch (e) {
        console.warn('Mongo updateOrderStatus fallback:', e);
      }
    }

    const ord = memoryOrders.find(o => o.orderNumber?.toUpperCase() === orderNumber.toUpperCase() || o._id === orderNumber);
    if (ord) {
      ord.orderStatus = status;
      if (trackingNumber) ord.trackingNumber = trackingNumber;
          if (trackingCarrier) ord.trackingCarrier = trackingCarrier;
      ord.statusHistory = ord.statusHistory || [];
      ord.statusHistory.push({
        status,
        timestamp: new Date().toISOString(),
        note: note || `Order status updated to ${status}`
      });
      return ord;
    }
    return null;
  },

  // USERS & AUTH
  async findUserByEmail(email: string) {
    const cleanEmail = email.toLowerCase().trim();
    if (isMongoConnected) {
      try {
        const u = await User.findOne({ email: cleanEmail });
        if (u) return u;
      } catch (e) {
        console.warn('Mongo findUserByEmail fallback:', e);
      }
    }
    return memoryUsers.find(u => u.email?.toLowerCase() === cleanEmail);
  },

  async createUser(userData: any) {
    const salt = bcrypt.genSaltSync(12);
    const passwordHash = bcrypt.hashSync(userData.password, salt);
    const newUser = {
      name: userData.name,
      email: userData.email.toLowerCase().trim(),
      passwordHash,
      role: userData.role || 'customer',
      phone: userData.phone || '',
      shippingAddress: userData.shippingAddress || {},
      wishlist: [],
      createdAt: new Date().toISOString()
    };

    if (isMongoConnected) {
      try {
        return await User.create(newUser);
      } catch (e) {
        console.warn('Mongo createUser fallback:', e);
      }
    }

    const savedUser = { _id: 'user-' + Date.now(), ...newUser };
    memoryUsers.push(savedUser);
    return savedUser;
  },

  async getAllUsers() {
    if (isMongoConnected) {
      try {
        return await User.find().select('-passwordHash');
      } catch (e) {
        console.warn('Mongo getAllUsers fallback:', e);
      }
    }
    return memoryUsers.map(u => {
      const { passwordHash, ...rest } = u;
      return rest;
    });
  },

  // NOTIFICATION SUBSCRIBERS
  async saveSubscriber(subData: any) {
    const normalizedTopics = Array.isArray(subData.topics) && subData.topics.length ? subData.topics : ['all'];
    const payload = { ...subData, topics: normalizedTopics };
    if (isMongoConnected) {
      try {
        return await NotificationSubscriber.findOneAndUpdate(
          { endpoint: payload.endpoint },
          { $set: payload },
          { upsert: true, new: true }
        );
      } catch (e) {
        console.warn('Mongo saveSubscriber fallback:', e);
      }
    }
    const idx = memorySubscribers.findIndex(s => s.endpoint === payload.endpoint);
    if (idx !== -1) {
      memorySubscribers[idx] = { ...memorySubscribers[idx], ...payload, updatedAt: new Date().toISOString() };
      persistJsonArray(SUBS_FILE, memorySubscribers);
      return memorySubscribers[idx];
    }
    const newSub = { _id: 'sub-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6), ...payload, createdAt: new Date().toISOString() };
    memorySubscribers.push(newSub);
    persistJsonArray(SUBS_FILE, memorySubscribers);
    return newSub;
  },

  async removeSubscriber(endpoint: string) {
    if (isMongoConnected) {
      try {
        await NotificationSubscriber.findOneAndDelete({ endpoint });
        return true;
      } catch (e) {
        console.warn('Mongo removeSubscriber fallback:', e);
      }
    }
    memorySubscribers = memorySubscribers.filter(s => s.endpoint !== endpoint);
    persistJsonArray(SUBS_FILE, memorySubscribers);
    return true;
  },

  /** Remember that this device placed an order, so it can get updates about it */
  async linkSubscriberToOrder(endpoint: string, orderNumber: string) {
    const num = orderNumber.trim().toUpperCase();
    if (isMongoConnected) {
      try {
        const r = await NotificationSubscriber.findOneAndUpdate({ endpoint }, { $addToSet: { orderNumbers: num } }, { new: true });
        return !!r;
      } catch (e) {
        console.warn('Mongo linkSubscriberToOrder fallback:', e);
      }
    }
    const sub = memorySubscribers.find(x => x.endpoint === endpoint);
    if (!sub) return false;
    sub.orderNumbers = Array.from(new Set([...(sub.orderNumbers || []), num]));
    persistJsonArray(SUBS_FILE, memorySubscribers);
    return true;
  },

  async getSubscribersForOrder(orderNumber: string) {
    const num = orderNumber.trim().toUpperCase();
    if (isMongoConnected) {
      try {
        return await NotificationSubscriber.find({ orderNumbers: num });
      } catch (e) {
        console.warn('Mongo getSubscribersForOrder fallback:', e);
      }
    }
    return memorySubscribers.filter(x => (x.orderNumbers || []).includes(num));
  },

  async getAllSubscribers() {
    if (isMongoConnected) {
      try {
        return await NotificationSubscriber.find();
      } catch (e) {
        console.warn('Mongo getAllSubscribers fallback:', e);
      }
    }
    return memorySubscribers;
  },

  async logNotification(logData: any) {
    if (isMongoConnected) {
      try {
        return await NotificationLog.create(logData);
      } catch (e) {
        console.warn('Mongo logNotification fallback:', e);
      }
    }
    const log = { _id: 'notif-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6), ...logData, createdAt: new Date().toISOString() };
    memoryNotificationLogs.unshift(log);
    if (memoryNotificationLogs.length > 200) memoryNotificationLogs = memoryNotificationLogs.slice(0, 200);
    persistJsonArray(LOGS_FILE, memoryNotificationLogs);
    return log;
  },

  async getNotificationLogs() {
    if (isMongoConnected) {
      try {
        return await NotificationLog.find().sort({ createdAt: -1 });
      } catch (e) {
        console.warn('Mongo getNotificationLogs fallback:', e);
      }
    }
    return memoryNotificationLogs;
  },

  // ANALYTICS & DASHBOARD
  // Real numbers only (no sample data). Cancelled orders do not count as sales.
  async getDashboardAnalytics() {
    const products: any[] = await this.getProducts({ includeDrafts: true });
    const orders: any[] = (await this.getOrders()).map((o: any) => (o.toObject ? o.toObject() : o));
    const subscribers = await this.getAllSubscribers();
    const users = await this.getAllUsers();

    const sold = orders.filter(o => o.orderStatus !== 'cancelled');
    const sum = (list: any[]) => list.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
    const at = (o: any) => new Date(o.createdAt).getTime();
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    // Same point in last month, for a fair comparison
    const lastMonthSamePoint = lastMonthStart + (now.getTime() - monthStart);

    const today = sold.filter(o => at(o) >= dayStart);
    const thisMonth = sold.filter(o => at(o) >= monthStart);
    const lastMonthToDate = sold.filter(o => at(o) >= lastMonthStart && at(o) < Math.min(lastMonthSamePoint, monthStart));
    const pct = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 1000) / 10 : null);

    // Last 30 days, one entry per day
    const daily = Array.from({ length: 30 }, (_, i) => {
      const start = dayStart - (29 - i) * 86400000;
      const list = sold.filter(o => at(o) >= start && at(o) < start + 86400000);
      return { date: new Date(start).toISOString().slice(0, 10), revenue: sum(list), orders: list.length };
    });
    // Last 12 months
    const revenueTrend = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
      const list = sold.filter(o => at(o) >= d.getTime() && at(o) < end);
      return { month: d.toLocaleString('en', { month: 'short' }), year: d.getFullYear(), revenue: sum(list), orders: list.length };
    });

    const statusCounts: Record<string, number> = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    orders.forEach(o => { statusCounts[o.orderStatus] = (statusCounts[o.orderStatus] || 0) + 1; });

    const top: Record<string, { name: string; image: string; qty: number; revenue: number }> = {};
    sold.forEach(o => (o.items || []).forEach((it: any) => {
      const t = top[it.productId] || (top[it.productId] = { name: it.name, image: it.image, qty: 0, revenue: 0 });
      t.qty += Number(it.quantity) || 0;
      t.revenue += (Number(it.price) || 0) * (Number(it.quantity) || 0);
    }));

    // Sizes that are sold out or nearly sold out (only where stock per size is tracked)
    const lowStock: Array<{ id: string; name: string; image: string; size: string; left: number }> = [];
    products.forEach(pr => {
      const ss = pr.sizeStock instanceof Map ? Object.fromEntries(pr.sizeStock) : pr.sizeStock;
      if (!ss) return;
      Object.entries(ss).forEach(([size, left]) => {
        if (Number(left) <= 2) lowStock.push({ id: pr.id || String(pr._id), name: pr.name, image: pr.images?.[0] || '', size, left: Number(left) || 0 });
      });
    });

    const totalRevenue = sum(sold);
    return {
      totalRevenue,
      totalOrders: orders.length,
      totalProducts: products.length,
      liveProducts: products.filter(pr => pr.status !== 'draft').length,
      totalSubscribers: subscribers.length,
      totalCustomers: users.filter((u: any) => u.role !== 'admin').length,
      avgOrderValue: sold.length ? Math.round(totalRevenue / sold.length) : 0,
      today: { revenue: sum(today), orders: today.length },
      thisMonth: { revenue: sum(thisMonth), orders: thisMonth.length },
      monthChange: { revenue: pct(sum(thisMonth), sum(lastMonthToDate)), orders: pct(thisMonth.length, lastMonthToDate.length) },
      statusCounts,
      awaitingApproval: statusCounts.pending || 0,
      unpaidOnline: orders.filter(o => o.paymentMethod !== 'cod' && o.paymentStatus !== 'paid' && o.orderStatus !== 'cancelled').length,
      topProducts: Object.entries(top).sort((x, y) => y[1].qty - x[1].qty).slice(0, 5).map(([id, v]) => ({ id, ...v })),
      lowStock: lowStock.sort((x, y) => x.left - y.left).slice(0, 8),
      lowStockProducts: lowStock,
      daily,
      revenueTrend,
      recentOrders: orders.slice(0, 6),
    };
  }

};
