import { RekognitionClient, DetectLabelsCommand } from '@aws-sdk/client-rekognition';
import { config } from '../config/env';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export interface AutoAnnotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  confidence?: number;
}

const rekognitionClient = new RekognitionClient({
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey
  }
});

export const generateMockAnnotations = (taskId: string): { annotations: AutoAnnotation[]; labels: string[]; model: string } => {
  const annotations = Array.from({ length: 2 }).map((_, index) => ({
    id: `${taskId}-auto-${index}`,
    x: Math.round(Math.random() * 300),
    y: Math.round(Math.random() * 200),
    width: 100 + Math.round(Math.random() * 60),
    height: 100 + Math.round(Math.random() * 60),
    label: `Mock object ${index + 1}`,
    confidence: 75 + Math.round(Math.random() * 10)
  }));
  return { annotations, labels: annotations.map(annotation => annotation.label ?? 'Unknown'), model: 'mock-bedrock-annotator' };
};

export const getRekognitionAnnotations = async (
  s3Key: string
): Promise<{ annotations: AutoAnnotation[]; labels: string[]; model: string }> => {
  const command = new DetectLabelsCommand({
    Image: {
      S3Object: {
        Bucket: config.s3.bucket,
        Name: s3Key
      }
    },
    MinConfidence: config.ai.rekognitionMinConfidence,
    MaxLabels: 10
  });

  const response = await rekognitionClient.send(command);

  const annotations: AutoAnnotation[] = [];
  const labels: string[] = [];

  response.Labels?.forEach(label => {
    if (!label.Name) return;
    labels.push(label.Name);
    label.Instances?.forEach((instance, index) => {
      const boundingBox = instance.BoundingBox;
      if (!boundingBox) return;
      annotations.push({
        id: `rekognition-${label.Name}-${index}`,
        x: Math.round((boundingBox.Left ?? 0) * CANVAS_WIDTH),
        y: Math.round((boundingBox.Top ?? 0) * CANVAS_HEIGHT),
        width: Math.round((boundingBox.Width ?? 0) * CANVAS_WIDTH),
        height: Math.round((boundingBox.Height ?? 0) * CANVAS_HEIGHT),
        label: label.Name,
        confidence: instance.Confidence ? Math.round(instance.Confidence) : undefined
      });
    });
  });

  return { annotations, labels, model: 'aws-rekognition-detect-labels' };
};
