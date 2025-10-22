import { Router } from 'express';
import { predict } from '../controllers/aiController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);
router.post('/predict', predict);

export default router;
