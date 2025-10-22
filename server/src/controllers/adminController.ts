import { Request, Response } from 'express';
import { AnnotationModel } from '../models/Annotation';
import { TaskModel } from '../models/Task';
import { UserModel } from '../models/User';
import { emitTaskUpdate } from '../services/websocketService';

/**
 * Returns a lightweight list of all users for administrative actions.
 */
export const listUsers = async (_req: Request, res: Response) => {
  const users = await UserModel.find({}, 'name email role');
  res.json({ users });
};

/**
 * Assigns a task to a specific user so that it appears in their queue.
 */
export const assignTask = async (req: Request, res: Response) => {
  const { taskId, userId } = req.body;
  const task = await TaskModel.findByIdAndUpdate(
    taskId,
    { assignedTo: userId, status: 'pending' },
    { new: true }
  );
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }
  emitTaskUpdate(task);
  res.json({ task });
};

/**
 * Exports both tasks and annotations so that admins can archive or share data.
 */
export const exportAnnotations = async (_req: Request, res: Response) => {
  const tasks = await TaskModel.find();
  const annotations = await AnnotationModel.find();
  res.json({ tasks, annotations });
};
