import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { SEED_PRODUCTS } from '../data/seedProducts.js';
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

    const availableSeeds = SEED_PRODUCTS.filter(
      (sp: any) => !deletedList.includes(sp.id) && !deletedList.includes(sp.slug)
    );

    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      if (availableSeeds.length > 0) {
        console.log('[Database] Seeding initial luxury products into MongoDB...');
        await Product.insertMany(availableSeeds.map(({ _id, ...p }: any) => p));
        console.log(`✅ [Database] Seeded ${availableSeeds.length} products.`);
      }
    } else {
      // Sync seed products: ensure any missing seed products are inserted without overwriting admin edits or resurrecting deleted products
      for (const sp of availableSeeds) {
        const exists = await Product.findOne({ $or: [{ id: sp.id }, { slug: sp.slug }] });
        if (!exists) {
          const { _id, ...toInsert }: any = sp;
          await Product.create(toInsert);
        }
      }
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
