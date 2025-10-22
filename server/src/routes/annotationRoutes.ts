import { Router } from 'express';
import {
  createOrUpdateAnnotations,
  getAnnotations,
  reviewAnnotations
} from '../controllers/annotationController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/:taskId', getAnnotations);
router.post('/:taskId', createOrUpdateAnnotations);
router.post('/:taskId/review', authorize(['Reviewer', 'Admin']), reviewAnnotations);

export default router;
