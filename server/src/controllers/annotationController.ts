import { Request, Response } from 'express';
import { AnnotationModel } from '../models/Annotation';
import { TaskModel } from '../models/Task';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { emitTaskUpdate } from '../services/websocketService';

/**
 * Replaces the current annotation set for a task with the payload provided by the annotator.
 */
export const createOrUpdateAnnotations = async (req: AuthenticatedRequest, res: Response) => {
  const { taskId } = req.params;
  const { annotations } = req.body as { annotations: unknown[] };
  if (!req.user?.id) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  await AnnotationModel.deleteMany({ task: taskId });
  const docs = await AnnotationModel.insertMany(
    annotations.map(annotation => ({ task: taskId, annotator: req.user?.id, data: annotation }))
  );
  const task = await TaskModel.findById(taskId);
  if (task) {
    task.status = 'awaiting_review';
    task.lockedBy = null;
    task.reviewedBy = null;
    task.reviewNotes = null;
    task.reviewedAt = null;
    await task.save();
    emitTaskUpdate(task);
  }
  res.json({ annotations: docs });
};

/**
 * Returns the saved annotations for a given task.
 */
export const getAnnotations = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const annotations = await AnnotationModel.find({ task: taskId });
  res.json({ annotations });
};

/**
 * Records a reviewer decision on a completed annotation set, capturing optional notes.
 */
export const reviewAnnotations = async (req: AuthenticatedRequest, res: Response) => {
  const { taskId } = req.params;
  const { decision, notes } = req.body as { decision: 'approved' | 'rejected'; notes?: string };

  if (!req.user?.id) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ message: 'Invalid decision' });
  }

  const task = await TaskModel.findOneAndUpdate(
    { _id: taskId, status: 'awaiting_review' },
    {
      status: decision,
      reviewedBy: req.user.id,
      reviewNotes: notes ?? null,
      reviewedAt: new Date(),
      lockedBy: null
    },
    { new: true }
  );

  if (!task) {
    return res.status(404).json({ message: 'Task not found or not ready for review' });
  }

  emitTaskUpdate(task);
  res.json({ task });
};
