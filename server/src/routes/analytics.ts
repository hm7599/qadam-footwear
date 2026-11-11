import { Router } from 'express';
import { DataStore } from '../config/store.js';
import { protect, adminOnly, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET admin dashboard stats
router.get('/dashboard', protect, adminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const analytics = await DataStore.getDashboardAnalytics();
    res.json({
      success: true,
      data: analytics
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
