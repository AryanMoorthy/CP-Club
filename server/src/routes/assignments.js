import { Router } from 'express';
import {
  listAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentProgress,
} from '../controllers/assignments.js';
import { authenticate } from '../middleware/auth.js';
import { requireMentor } from '../middleware/roles.js';

const router = Router();

router.use(authenticate);

router.get('/', listAssignments);
router.get('/:id', getAssignment);
router.get('/:id/progress', requireMentor, getAssignmentProgress);

router.post('/', requireMentor, createAssignment);
router.patch('/:id', requireMentor, updateAssignment);
router.delete('/:id', requireMentor, deleteAssignment);

export default router;
