import { Router } from 'express';
import multer from 'multer';
import {
  getTaskById,
  getTasks,
  lockTask,
  unlockTask,
  updateTaskStatus,
  uploadTaskMedia
} from '../controllers/taskController';
import { authenticate } from '../middleware/authMiddleware';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.use(authenticate);

router.get('/', getTasks);
router.post('/upload', upload.single('file'), uploadTaskMedia);
router.get('/:taskId', getTaskById);
router.post('/:taskId/status', updateTaskStatus);
router.post('/:taskId/lock', lockTask);
router.post('/:taskId/unlock', unlockTask);

export default router;
