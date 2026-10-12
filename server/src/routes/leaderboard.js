import { Router } from 'express';
import {
  ratingLeaderboard,
  weeklyLeaderboard,
  improvementLeaderboard,
  totalSolvedLeaderboard,
} from '../controllers/leaderboard.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/rating', ratingLeaderboard);
router.get('/weekly', weeklyLeaderboard);
router.get('/improvement', improvementLeaderboard);
router.get('/total', totalSolvedLeaderboard);

export default router;
