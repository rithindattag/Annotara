import { Schema, Types, model } from 'mongoose';

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'awaiting_review'
  | 'approved'
  | 'rejected';

export interface ITask {
  fileName: string;
  fileType: string;
  fileSize: number;
  s3Key: string;
  status: TaskStatus;
  assignedTo?: Types.ObjectId;
  lockedBy?: Types.ObjectId;
  previewUrl?: string;
  reviewedBy?: Types.ObjectId | string | null;
  reviewedAt?: Date | null;
  reviewNotes?: string | null;
  lastAiModel?: string | null;
  lastAiRunAt?: Date | null;
  lastAiLabels?: string[];
}

const taskSchema = new Schema<ITask>(
  {
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    s3Key: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'awaiting_review', 'approved', 'rejected'],
      default: 'pending'
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    lockedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    previewUrl: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    reviewNotes: { type: String, default: null },
    lastAiModel: { type: String, default: null },
    lastAiRunAt: { type: Date, default: null },
    lastAiLabels: { type: [String], default: [] }
  },
  { timestamps: true }
);

export const TaskModel = model<ITask>('Task', taskSchema);
