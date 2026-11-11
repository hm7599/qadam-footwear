import { Router } from 'express';
import fs from 'fs';
import { protect, adminOnly } from '../middleware/auth.js';
import { SettingsStore } from '../config/settingsStore.js';
import { createBackup, listBackups, backupPath, getBackupSettings, schedule } from '../backup/backup.js';

// Admin only: create, list and download backups; change the timer
const router = Router();
router.use(protect, adminOnly);

router.get('/', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const list = listBackups();
  const s = await getBackupSettings();
  const nextAt = s.enabled ? schedule(s).nextAt : null;
  res.json({ success: true, data: { settings: s, backups: list, nextAt } });
});

router.post('/', async (_req, res) => {
  try {
    res.json({ success: true, data: await createBackup('manual'), message: 'Backup created.' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message || 'Backup failed.' });
  }
});

router.put('/settings', async (req, res) => {
  const b = req.body || {};
  const v = {
    enabled: b.enabled !== false,
    everyHours: Math.min(24 * 30, Math.max(1, Math.round(Number(b.everyHours) || 24))),
    keep: Math.min(100, Math.max(1, Math.round(Number(b.keep) || 14))),
    startAt: b.startAt && !isNaN(new Date(b.startAt).getTime()) ? new Date(b.startAt).toISOString() : null,
  };
  await SettingsStore.set('backup', v);
  res.json({ success: true, data: v, message: 'Saved.' });
});

router.get('/download/:name', (req, res) => {
  const file = backupPath(String(req.params.name));
  if (!file || !fs.existsSync(file)) return res.status(404).json({ success: false, message: 'Backup not found.' });
  res.setHeader('Cache-Control', 'no-store');
  res.download(file, String(req.params.name));
});

router.delete('/:name', (req, res) => {
  const file = backupPath(String(req.params.name));
  if (!file || !fs.existsSync(file)) return res.status(404).json({ success: false, message: 'Backup not found.' });
  fs.unlinkSync(file);
  res.json({ success: true });
});

export default router;
