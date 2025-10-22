import { Request, Response } from 'express';
import { config } from '../config/env';
import { TaskModel } from '../models/Task';
import { generateMockAnnotations, getRekognitionAnnotations } from '../services/aiService';

/**
 * AI-assisted annotation service that can fan out to AWS Rekognition or a deterministic mock.
 */
export const predict = async (req: Request, res: Response) => {
  const { taskId } = req.body as { taskId?: string };
  if (!taskId) {
    return res.status(400).json({ message: 'taskId is required' });
  }

  const task = await TaskModel.findById(taskId);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  if (config.ai.provider === 'rekognition') {
    try {
      const result = await getRekognitionAnnotations(task.s3Key);
      task.lastAiModel = result.model;
      task.lastAiRunAt = new Date();
      task.lastAiLabels = result.labels;
      await task.save();
      return res.json(result);
    } catch (error) {
      console.error('Rekognition inference failed', error);
      return res.status(502).json({
        message: 'AI provider failed to generate annotations',
        details: error instanceof Error ? error.message : 'Unknown provider error'
      });
    }
  }

  const mockResult = generateMockAnnotations(taskId);
  task.lastAiModel = mockResult.model;
  task.lastAiRunAt = new Date();
  task.lastAiLabels = mockResult.labels;
  await task.save();
  return res.json(mockResult);
};
