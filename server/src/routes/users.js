import { Router } from 'express';
import {
  getMe,
  updateMe,
  connectCodeforces,
  syncCodeforces,
  getCodeforcesStats,
  getMySolvedProblems,
  getUserById,
  listUsers,
  updateUserRole,
} from '../controllers/users.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';

const router = Router();

// All user routes require auth
router.use(authenticate);

router.get('/me', getMe);
router.patch('/me', updateMe);
router.post('/me/codeforces', connectCodeforces);
router.post('/me/codeforces/sync', syncCodeforces);
router.get('/me/codeforces/stats', getCodeforcesStats);
router.get('/solved-problems', getMySolvedProblems);

// Admin-only
router.get('/', requireAdmin, listUsers);
router.patch('/:id/role', requireAdmin, updateUserRole);

// Restricted profile view
router.get('/:id', getUserById);

export default router;
