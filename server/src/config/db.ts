import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { LEGACY_SEED_KEYS } from '../data/seedProducts.js';
import { loadJsonArray, DELETED_PRODUCTS_FILE } from './store.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export let isMongoConnected = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/qadam_footwear';
  
  try {
    console.log(`[Database] Attempting connection to MongoDB: ${uri.replace(/\/\/.*@/, '//<credentials>@')}`);
    
    // Connect with a short timeout so app boots quickly even if Mongo is not running locally
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    
    isMongoConnected = true;
    console.log('✅ [Database] MongoDB successfully connected!');
    
    // Seed initial data if database is empty
    await seedInitialData();

  } catch (error: any) {
    isMongoConnected = false;
    console.warn(`⚠️ [Database] MongoDB connection note: ${error.message}`);
    console.log('ℹ️ [Database] Running with in-memory resilient storage mode. All features active!');
  }
}

async function seedInitialData() {
  try {
    const deletedList = loadJsonArray<string>(DELETED_PRODUCTS_FILE, []);
    // Purge any products from Mongo that are in the deleted list
    if (deletedList.length > 0) {
      await Product.deleteMany({
        $or: [
          { id: { $in: deletedList } },
          { slug: { $in: deletedList } }
        ]
      });
    }

    // Permanently purge old demo/seed products — they must NEVER appear on the website.
    // Only products added by the admin are kept.
    const purged = await Product.deleteMany({
      $or: [
        { id: { $in: LEGACY_SEED_KEYS } },
        { slug: { $in: LEGACY_SEED_KEYS } }
      ]
    });
    if (purged.deletedCount) {
      console.log(`🧹 [Database] Removed ${purged.deletedCount} old demo product(s) permanently.`);
    }

    // Migrate any products that still have old US sizes (< 30) or empty sizes to EU sizes [39, 40, 41, 42, 43, 44, 45]
    await Product.updateMany(
      { $or: [{ sizes: { $elemMatch: { $lt: 30 } } }, { sizes: { $size: 0 } }, { sizes: { $exists: false } }] },
      { $set: { sizes: [39, 40, 41, 42, 43, 44, 45] } }
    );

    // Admin password always follows ADMIN_PASSWORD (min 10 chars). Without it, admin login stays disabled.
    const envPw = process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 10 ? process.env.ADMIN_PASSWORD : '';
    const adminUser: any = await User.findOne({ $or: [{ email: 'admin@qadamshoes.com' }, { email: 'admin@aurashoes.com' }] });
    if (!envPw) {
      console.warn('⚠️  [auth] ADMIN_PASSWORD not set (min 10 chars) — admin login is disabled.');
      if (adminUser) await User.updateOne({ _id: adminUser._id }, { $set: { passwordHash: await bcrypt.hash(crypto.randomUUID() + crypto.randomUUID(), 12) } });
    } else if (!adminUser) {
      await User.create({
        name: 'QADAM Executive Admin',
        email: 'admin@qadamshoes.com',
        passwordHash: await bcrypt.hash(envPw, 12),
        role: 'admin',
      });
      console.log('✅ [Database] Admin account created (username: admin).');
    } else if (!(await bcrypt.compare(envPw, adminUser.passwordHash || ''))) {
      await User.updateOne({ _id: adminUser._id }, { $set: { passwordHash: await bcrypt.hash(envPw, 12), role: 'admin' } });
      console.log('🔑 [Database] Admin password synced from ADMIN_PASSWORD.');
    }

    // Ensure sample/demo orders (like QDM-89214) and dummy users are permanently deleted
    await Order.deleteMany({ orderNumber: 'QDM-89214' }).catch(() => {});
    await User.deleteMany({ email: 'alex@example.com' }).catch(() => {});
  } catch (err: any) {
    console.error('[Database] Seeding error:', err.message);
  }
}
