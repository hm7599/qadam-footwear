import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { SecurityEvents, AdminAudit } from '../security/index.js';

// Admin-only view of security events and the admin audit trail
const router = Router();
router.use(protect, adminOnly);

router.get('/events', async (_req, res) => {
  const list = (await SecurityEvents.all()).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 300);
  res.json({ success: true, data: list });
});

router.get('/audit', async (_req, res) => {
  const list = (await AdminAudit.all()).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 300);
  res.json({ success: true, data: list });
});

export default router;
