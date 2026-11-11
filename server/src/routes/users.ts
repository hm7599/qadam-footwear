import { Router } from 'express';
import { DataStore } from '../config/store.js';
import { protect, adminOnly, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET all customers (Admin)
router.get('/', protect, adminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const users = await DataStore.getAllUsers();
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
