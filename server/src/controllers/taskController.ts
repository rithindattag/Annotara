import { Request, Response } from 'express';
import { TaskModel } from '../models/Task';
import { AnnotationModel } from '../models/Annotation';
import { uploadToS3 } from '../services/s3Service';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { emitTaskUpdate } from '../services/websocketService';

/**
 * Returns the tasks visible to the currently authenticated user.
 * Annotators receive both assigned and unassigned tasks, while other roles see all tasks.
 */
export const getTasks = async (req: AuthenticatedRequest, res: Response) => {
  const query: Record<string, unknown> = {};
  if (req.user?.role === 'Annotator') {
    query.$or = [{ assignedTo: req.user.id }, { assignedTo: { $exists: false } }];
  } else if (req.user?.role === 'Reviewer') {
    query.status = 'awaiting_review';
  }
  const tasks = await TaskModel.find(query)
    .populate('assignedTo', 'name email role')
    .populate('reviewedBy', 'name email role');
  res.json({ tasks });
};

/**
 * Retrieves a single task alongside its annotation history for auditing.
 */
export const getTaskById = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const task = await TaskModel.findById(taskId)
    .populate('assignedTo', 'name email role')
    .populate('reviewedBy', 'name email role');
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }
  const annotations = await AnnotationModel.find({ task: taskId });
  res.json({ task, annotations });
};

/**
 * Accepts a multipart upload, stores the file in S3, and creates a new task document.
 */
export const uploadTaskMedia = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file provided' });
  }
  const uploadResult = await uploadToS3(req.file);
  const task = await TaskModel.create({
    fileName: req.file.originalname,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
    s3Key: uploadResult.key,
    previewUrl: uploadResult.url
  });
  emitTaskUpdate(task);
  res.status(201).json({ task });
};

/**
 * Manually updates the task status (e.g., admin override or reviewer change).
 */
export const updateTaskStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { taskId } = req.params;
  const { status } = req.body;
  const task = await TaskModel.findByIdAndUpdate(taskId, { status }, { new: true });
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }
  emitTaskUpdate(task);
  res.json({ task });
};

/**
 * Locks a task for exclusive editing by the current user.
 */
export const lockTask = async (req: AuthenticatedRequest, res: Response) => {
  const { taskId } = req.params;
  const task = await TaskModel.findOneAndUpdate(
    { _id: taskId, $or: [{ lockedBy: null }, { lockedBy: req.user?.id }] },
    { lockedBy: req.user?.id, status: 'in_progress' },
    { new: true }
  );
  if (!task) {
    return res.status(423).json({ message: 'Task already locked' });
  }
  emitTaskUpdate(task);
  res.json({ task });
};

/**
 * Unlocks a task when the annotator finishes or abandons their work.
 */
export const unlockTask = async (req: AuthenticatedRequest, res: Response) => {
  const { taskId } = req.params;
  const task = await TaskModel.findOneAndUpdate(
    { _id: taskId, lockedBy: req.user?.id },
    { lockedBy: null },
    { new: true }
  );
  if (!task) {
    return res.status(423).json({ message: 'Task not locked by you' });
  }
  emitTaskUpdate(task);
  res.json({ task });
};
