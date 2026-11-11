import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { DataStore } from '../config/store.js';
import { SettingsStore } from '../config/settingsStore.js';
import { isMongoConnected } from '../config/db.js';

/**
 * Backups of all store data (products, orders, customers, settings, marketing data).
 * - Manual: admin clicks "Backup now"
 * - Automatic: every N hours (admin setting), kept on the server (last K files)
 * Files are gzipped JSON in data/backups. Secrets (JWT secret, VAPID private key,
 * password hashes) are NOT included.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.QADAM_DATA_DIR || process.env.AURA_DATA_DIR || path.resolve(__dirname, '../../data');
export const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const NAME_RE = /^(qadam|aura)-backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-(auto|manual)\.json\.gz$/;

// startAt = date & time of the first scheduled backup; later ones repeat every everyHours from it
export interface BackupSettings { enabled: boolean; everyHours: number; keep: number; startAt: string | null }
const DEFAULTS: BackupSettings = { enabled: true, everyHours: 24, keep: 14, startAt: null };

/** The most recent scheduled time that has already passed, and the next one */
export function schedule(s: BackupSettings, now = Date.now()) {
  const every = s.everyHours * 3600000;
  const lastAuto = listBackups().find(b => b.kind === 'auto');
  if (!s.startAt) {
    // No start time chosen: simply every N hours after the last automatic backup
    const next = lastAuto ? new Date(lastAuto.createdAt).getTime() + every : now;
    return { due: next <= now, nextAt: new Date(next <= now ? now : next).toISOString() };
  }
  const start = new Date(s.startAt).getTime();
  if (now < start) return { due: false, nextAt: new Date(start).toISOString() };
  const slot = start + Math.floor((now - start) / every) * every;
  const doneThisSlot = !!lastAuto && new Date(lastAuto.createdAt).getTime() >= slot;
  return { due: !doneThisSlot, nextAt: new Date(doneThisSlot ? slot + every : slot).toISOString() };
}
export async function getBackupSettings(): Promise<BackupSettings> {
  return { ...DEFAULTS, ...((await SettingsStore.get('backup')) || {}) };
}

const plain = (x: any) => JSON.parse(JSON.stringify(x));
const readJsonFiles = (dir: string) => {
  const out: Record<string, any> = {};
  try {
    for (const f of fs.readdirSync(dir)) if (f.endsWith('.json')) {
      try { out[f.replace(/\.json$/, '')] = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')); } catch { /* skip broken file */ }
    }
  } catch { /* folder missing */ }
  return out;
};

export async function buildBackupData() {
  const users = plain(await DataStore.getAllUsers()).map(({ passwordHash, ...u }: any) => u);
  const subscribers = plain(await DataStore.getAllSubscribers()).map((s: any) => ({ ...s, keys: undefined }));
  return {
    meta: { app: "QADAM Men's Footwear", version: 1, createdAt: new Date().toISOString(), storage: isMongoConnected ? 'mongodb' : 'memory+files' },
    products: plain(await DataStore.getProducts({ includeDrafts: true })),
    orders: plain(await DataStore.getOrders({})),
    customers: users,
    notificationSubscribers: subscribers,
    notificationLogs: plain(await DataStore.getNotificationLogs()),
    settings: readJsonFiles(DATA_DIR)['site-settings'] || {},
    marketing: readJsonFiles(path.join(DATA_DIR, 'marketing')),
  };
}

export async function createBackup(kind: 'auto' | 'manual') {
  const data = await buildBackupData();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const name = `qadam-backup-${stamp}-${kind}.json.gz`;
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const gz = zlib.gzipSync(JSON.stringify(data));
  fs.writeFileSync(path.join(BACKUP_DIR, name), gz, { mode: 0o600 });
  await prune();
  return { name, size: gz.length, createdAt: data.meta.createdAt, kind, counts: { products: data.products.length, orders: data.orders.length, customers: data.customers.length } };
}

export function listBackups() {
  try {
    return fs.readdirSync(BACKUP_DIR).filter(f => NAME_RE.test(f)).map(name => {
      const st = fs.statSync(path.join(BACKUP_DIR, name));
      return { name, size: st.size, createdAt: st.mtime.toISOString(), kind: name.includes('-auto.') ? 'auto' : 'manual' };
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch { return []; }
}

/** Safe path for a backup name (no path traversal) */
export function backupPath(name: string) {
  return NAME_RE.test(name) ? path.join(BACKUP_DIR, name) : null;
}

async function prune() {
  const { keep } = await getBackupSettings();
  for (const b of listBackups().slice(Math.max(1, keep))) {
    try { fs.unlinkSync(path.join(BACKUP_DIR, b.name)); } catch { /* ignore */ }
  }
}

// ── Timer ─────────────────────────────────────────────
let lastCheck = 0;
async function tick() {
  const s = await getBackupSettings();
  if (!s.enabled) return;
  if (schedule(s).due) {
    const b = await createBackup('auto');
    console.log(`💾 [Backup] Automatic backup saved: ${b.name}`);
  }
}
export function startBackupJob() {
  const run = () => { lastCheck = Date.now(); tick().catch(e => console.warn('[Backup] failed:', e.message)); };
  setTimeout(run, 15000);
  setInterval(run, 60000).unref(); // checks every minute whether a backup is due
}
export const lastBackupCheck = () => lastCheck;
