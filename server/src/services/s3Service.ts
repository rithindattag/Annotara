import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { Express } from 'express';
import { config } from '../config/env';

/**
 * Shared S3 client configured via environment variables. Local credentials default to mock values.
 */
const s3Client = new S3Client({
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey
  }
});

/**
 * Uploads a buffered file to S3 and returns the object key plus a public URL.
 */
export const uploadToS3 = async (file: Express.Multer.File) => {
  const key = `${Date.now()}-${file.originalname}`;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    })
  );
  return {
    key,
    url: `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com/${key}`
  };
};
