import type { User } from './user';

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'awaiting_review'
  | 'approved'
  | 'rejected';

export interface Annotation {
  _id: string;
  task: string;
  annotator: string;
  data: unknown;
  createdAt: string;
}

export interface AnnotationTask {
  _id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  s3Key: string;
  status: TaskStatus;
  assignedTo?: User | string;
  previewUrl?: string;
  reviewedBy?: User | string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  lastAiModel?: string | null;
  lastAiRunAt?: string | null;
  lastAiLabels?: string[];
  createdAt: string;
  updatedAt: string;
}
