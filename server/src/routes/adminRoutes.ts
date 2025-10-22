import { Router } from 'express';
import { assignTask, exportAnnotations, listUsers } from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);
router.use(authorize(['Admin']));

router.get('/users', listUsers);
router.post('/assign', assignTask);
router.get('/export', exportAnnotations);

export default router;
