import { Router } from 'express';
import {
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcements.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireMentor } from '../middleware/roles.js';

const router = Router();

router.get('/', optionalAuth, listAnnouncements);
router.get('/:id', optionalAuth, getAnnouncement);

router.post('/', authenticate, requireMentor, createAnnouncement);
router.patch('/:id', authenticate, requireMentor, updateAnnouncement);
router.delete('/:id', authenticate, requireMentor, deleteAnnouncement);

export default router;
