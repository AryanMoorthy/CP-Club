import { Router } from 'express';
import {
  listRooms,
  getRoom,
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomLeaderboard,
  finaliseRoom,
} from '../controllers/practiceRooms.js';
import { authenticate } from '../middleware/auth.js';
import { requireMentor } from '../middleware/roles.js';

const router = Router();

router.use(authenticate);

router.get('/', listRooms);
router.get('/:id', getRoom);
router.get('/:id/leaderboard', getRoomLeaderboard);

router.post('/', requireMentor, createRoom);
router.post('/:id/join', joinRoom);
router.post('/:id/leave', leaveRoom);
router.post('/:id/finalise', requireMentor, finaliseRoom);

export default router;
