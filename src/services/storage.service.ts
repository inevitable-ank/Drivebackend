import fs from 'fs-extra';
import path from 'path';
import AWS from 'aws-sdk';
import { getS3Client, getBucketName } from '../config/aws';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface StorageService {
  upload(file: Express.Multer.File, userId: string): Promise<{ filePath: string; fileUrl?: string }>;
  delete(filePath: string, storageType: 'local' | 's3'): Promise<void>;
  getFileUrl(filePath: string, storageType: 'local' | 's3'): Promise<string | null>;
  download(filePath: string, storageType: 'local' | 's3'): Promise<Buffer>;
}

class LocalStorageService implements StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(env.UPLOAD_DIR);
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.ensureDir(this.uploadDir);
      await fs.ensureDir(path.join(this.uploadDir, 'users'));
    } catch (error) {
      logger.error('Failed to create upload directory:', error);
      throw error;
    }
  }

  async upload(file: Express.Multer.File, userId: string): Promise<{ filePath: string; fileUrl?: string }> {
    const userDir = path.join(this.uploadDir, 'users', userId);
    await fs.ensureDir(userDir);

    const uniqueFileName = `${uuidv4()}_${file.originalname}`;
    const filePath = path.join(userDir, uniqueFileName);

    await fs.move(file.path, filePath);

    return {
      filePath: path.relative(this.uploadDir, filePath),
    };
  }

  async delete(filePath: string, _storageType: 'local' | 's3'): Promise<void> {
    const fullPath = path.join(this.uploadDir, filePath);
    
    try {
      const exists = await fs.pathExists(fullPath);
      if (exists) {
        await fs.remove(fullPath);
      }
    } catch (error) {
      logger.error(`Failed to delete file: ${filePath}`, error);
      throw error;
    }
  }

  async getFileUrl(filePath: string, _storageType: 'local' | 's3'): Promise<string | null> {
    const fullPath = path.join(this.uploadDir, filePath);
    const exists = await fs.pathExists(fullPath);
    
    if (!exists) {
      return null;
    }

    return `/api/files/download/${encodeURIComponent(filePath)}`;
  }

  async download(filePath: string, _storageType: 'local' | 's3'): Promise<Buffer> {
    const fullPath = path.join(this.uploadDir, filePath);
    return await fs.readFile(fullPath);
  }
}

class S3StorageService implements StorageService {
  private s3: AWS.S3;
  private bucketName: string;

  constructor() {
    this.s3 = getS3Client();
    this.bucketName = getBucketName();
  }

  async upload(file: Express.Multer.File, userId: string): Promise<{ filePath: string; fileUrl?: string }> {
    const uniqueFileName = `${userId}/${uuidv4()}_${file.originalname}`;
    
    const params: AWS.S3.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: uniqueFileName,
      Body: await fs.readFile(file.path),
      ContentType: file.mimetype,
      ACL: 'private',
    };

    await this.s3.upload(params).promise();

    await fs.remove(file.path);

    const fileUrl = this.s3.getSignedUrl('getObject', {
      Bucket: this.bucketName,
      Key: uniqueFileName,
      Expires: 3600,
    });

    return {
      filePath: uniqueFileName,
      fileUrl,
    };
  }

  async delete(filePath: string, _storageType: 'local' | 's3'): Promise<void> {
    const params: AWS.S3.DeleteObjectRequest = {
      Bucket: this.bucketName,
      Key: filePath,
    };

    try {
      await this.s3.deleteObject(params).promise();
    } catch (error) {
      logger.error(`Failed to delete file from S3: ${filePath}`, error);
      throw error;
    }
  }

  async getFileUrl(filePath: string, _storageType: 'local' | 's3'): Promise<string | null> {
    try {
      const params: AWS.S3.GetObjectRequest = {
        Bucket: this.bucketName,
        Key: filePath,
      };

      const url = this.s3.getSignedUrl('getObject', {
        ...params,
        Expires: 3600,
      });

      return url;
    } catch (error) {
      logger.error(`Failed to get file URL from S3: ${filePath}`, error);
      return null;
    }
  }

  async download(filePath: string, _storageType: 'local' | 's3'): Promise<Buffer> {
    const params: AWS.S3.GetObjectRequest = {
      Bucket: this.bucketName,
      Key: filePath,
    };

    const result = await this.s3.getObject(params).promise();
    
    if (!result.Body) {
      throw new Error('File not found in S3');
    }

    if (result.Body instanceof Buffer) {
      return result.Body;
    }

    return Buffer.from(result.Body as any);
  }
}

class StorageServiceFactory {
  static create(): StorageService {
    if (env.STORAGE_TYPE === 's3') {
      return new S3StorageService();
    }
    return new LocalStorageService();
  }
}

export const storageService = StorageServiceFactory.create();

