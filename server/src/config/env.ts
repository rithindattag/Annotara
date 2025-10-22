import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT ? Number(process.env.PORT) : 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://mongo:27017/annotation-dashboard',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  s3: {
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.AWS_S3_BUCKET || 'annotation-dataset-bucket',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local-key',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local-secret'
  },
  ai: {
    provider: (process.env.AI_PROVIDER || 'mock') as 'mock' | 'rekognition',
    rekognitionMinConfidence: process.env.AI_REKOGNITION_MIN_CONFIDENCE
      ? Number(process.env.AI_REKOGNITION_MIN_CONFIDENCE)
      : 60
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};
