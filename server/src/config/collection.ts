import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import mongoose, { Schema } from 'mongoose';
import { isMongoConnected } from './db.js';

/**
 * A tiny storage layer used by the marketing features.
 * - When MongoDB is connected, documents are stored in a real collection (with indexes).
 * - Otherwise they are kept in data/marketing/<name>.json so nothing is lost on restart.
 * Every document has a string `id`.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// QADAM_DATA_DIR lets tests use a throw-away folder
const DATA_DIR = process.env.QADAM_DATA_DIR || process.env.AURA_DATA_DIR;
const DIR = DATA_DIR ? path.join(DATA_DIR, 'marketing') : path.resolve(__dirname, '../../data/marketing');

export const newId = () => crypto.randomBytes(9).toString('hex');

export class Collection<T extends { id: string }> {
  private cache: T[] | null = null;
  private model: mongoose.Model<any>;
  private file: string;
  private writeChain: Promise<void> = Promise.resolve();

  constructor(private name: string, schemaDef: Record<string, any>, indexes: Array<[Record<string, any>, Record<string, any>?]> = []) {
    const schema = new Schema({ id: { type: String, required: true, unique: true }, ...schemaDef }, { strict: false, timestamps: false });
    for (const [fields, opts] of indexes) schema.index(fields, opts);
    this.model = mongoose.models[name] || mongoose.model(name, schema);
    this.file = path.join(DIR, `${name}.json`);
  }

  private load(): T[] {
    if (this.cache) return this.cache;
    try { this.cache = JSON.parse(fs.readFileSync(this.file, 'utf-8')); } catch { this.cache = []; }
    return this.cache!;
  }

  private persist() {
    const data = JSON.stringify(this.cache || [], null, 2);
    // Serialize writes and write atomically (tmp file + rename)
    this.writeChain = this.writeChain.then(() => {
      fs.mkdirSync(DIR, { recursive: true });
      const tmp = this.file + '.tmp';
      fs.writeFileSync(tmp, data, 'utf-8');
      fs.renameSync(tmp, this.file);
    }).catch(e => console.warn(`[${this.name}] save failed:`, e.message));
  }

  async all(): Promise<T[]> {
    if (isMongoConnected) return (await this.model.find({}, { _id: 0, __v: 0 }).lean()) as T[];
    return [...this.load()];
  }

  async find(pred: (d: T) => boolean): Promise<T[]> {
    return (await this.all()).filter(pred);
  }

  async findOne(pred: (d: T) => boolean): Promise<T | undefined> {
    return (await this.all()).find(pred);
  }

  async get(id: string): Promise<T | undefined> {
    if (isMongoConnected) return (await this.model.findOne({ id }, { _id: 0, __v: 0 }).lean()) as T | undefined;
    return this.load().find(d => d.id === id);
  }

  async insert(doc: Omit<T, 'id'> & { id?: string }): Promise<T> {
    const full = { ...doc, id: doc.id || newId() } as T;
    if (isMongoConnected) {
      await this.model.create(full);
      return full;
    }
    this.load().unshift(full);
    this.persist();
    return full;
  }

  async update(id: string, patch: Partial<T>): Promise<T | undefined> {
    if (isMongoConnected) {
      return (await this.model.findOneAndUpdate({ id }, { $set: patch }, { new: true, projection: { _id: 0, __v: 0 } }).lean()) as T | undefined;
    }
    const list = this.load();
    const i = list.findIndex(d => d.id === id);
    if (i === -1) return undefined;
    list[i] = { ...list[i], ...patch };
    this.persist();
    return list[i];
  }

  async remove(id: string): Promise<boolean> {
    if (isMongoConnected) return !!(await this.model.findOneAndDelete({ id }));
    const list = this.load();
    const i = list.findIndex(d => d.id === id);
    if (i === -1) return false;
    list.splice(i, 1);
    this.persist();
    return true;
  }

  async clear(): Promise<void> {
    if (isMongoConnected) {
      try { await this.model.deleteMany({}); } catch (e: any) { console.warn(`[${this.name}] clear failed:`, e?.message); }
    }
    this.cache = [];
    this.persist();
  }
}

/** Runs async work one at a time (used so two checkouts can't over-use the same coupon). */
export function createLock() {
  let chain: Promise<any> = Promise.resolve();
  return <R>(fn: () => Promise<R>): Promise<R> => {
    const run = chain.then(fn, fn);
    chain = run.catch(() => {});
    return run;
  };
}
