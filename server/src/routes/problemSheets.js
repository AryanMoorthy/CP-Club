import { Router } from 'express';
import {
  listSheets,
  getSheet,
  createSheet,
  updateSheet,
  publishSheet,
  archiveSheet,
  deleteSheet,
  parseProblemUrl,
} from '../controllers/problemSheets.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireMentor } from '../middleware/roles.js';

const router = Router();

// Public list (published only for unauthenticated)
router.get('/', optionalAuth, listSheets);
router.get('/:id', optionalAuth, getSheet);

// Authenticated mentor+ actions
router.post('/parse-url', authenticate, requireMentor, parseProblemUrl);
router.post('/', authenticate, requireMentor, createSheet);
router.patch('/:id', authenticate, requireMentor, updateSheet);
router.post('/:id/publish', authenticate, requireMentor, publishSheet);
router.post('/:id/archive', authenticate, requireMentor, archiveSheet);
router.delete('/:id', authenticate, requireMentor, deleteSheet);

export default router;
