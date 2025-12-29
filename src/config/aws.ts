import AWS from 'aws-sdk';
import { env } from './env';
import { logger } from '../utils/logger';

let s3: AWS.S3 | null = null;

export const getS3Client = (): AWS.S3 => {
  if (!s3) {
    if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials are not configured');
    }

    s3 = new AWS.S3({
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION,
    });

    logger.info('AWS S3 client initialized');
  }

  return s3;
};

export const getBucketName = (): string => {
  if (!env.AWS_S3_BUCKET_NAME) {
    throw new Error('AWS S3 bucket name is not configured');
  }
  return env.AWS_S3_BUCKET_NAME;
};

