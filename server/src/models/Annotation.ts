import { Schema, Types, model } from 'mongoose';

export interface IAnnotation {
  task: Types.ObjectId;
  annotator: Types.ObjectId;
  data: unknown;
}

const annotationSchema = new Schema<IAnnotation>(
  {
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    annotator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    data: { type: Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

export const AnnotationModel = model<IAnnotation>('Annotation', annotationSchema);
