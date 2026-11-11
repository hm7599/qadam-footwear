import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isMongoConnected } from './db.js';
import { SiteSetting } from '../models/SiteSetting.js';

// When MongoDB is not available, settings are kept in a small JSON file
// so admin edits survive a server restart.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.QADAM_DATA_DIR || process.env.AURA_DATA_DIR;
const FILE_PATH = DATA_DIR
  ? path.join(DATA_DIR, 'site-settings.json')
  : path.resolve(__dirname, '../../data/site-settings.json');

function readFile(): Record<string, any> {
  try {
    return JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function writeFile(all: Record<string, any>) {
  fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
  fs.writeFileSync(FILE_PATH, JSON.stringify(all, null, 2), 'utf-8');
}

export const SettingsStore = {
  async get(key: string): Promise<any | null> {
    if (isMongoConnected) {
      try {
        const doc = await SiteSetting.findOne({ key }).lean();
        return doc ? (doc as any).value : null;
      } catch (e) {
        console.warn('Mongo settings get fallback:', e);
      }
    }
    return readFile()[key] ?? null;
  },

  async set(key: string, value: any): Promise<any> {
    if (isMongoConnected) {
      try {
        await SiteSetting.findOneAndUpdate({ key }, { $set: { value } }, { upsert: true, new: true });
        return value;
      } catch (e) {
        console.warn('Mongo settings set fallback:', e);
      }
    }
    const all = readFile();
    all[key] = value;
    writeFile(all);
    return value;
  },
};
