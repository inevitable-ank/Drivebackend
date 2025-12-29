import { fileModel, File, CreateFileData } from '../models/file.model';
import { storageService } from './storage.service';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface FileListResponse {
  files: File[];
  total: number;
  limit: number;
  offset: number;
}

export class FileService {
  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    customName?: string
  ): Promise<File> {
    try {
      const storageResult = await storageService.upload(file, userId);
      
      const fileData: CreateFileData = {
        user_id: userId,
        name: customName || file.originalname,
        original_name: file.originalname,
        file_path: storageResult.filePath,
        file_url: storageResult.fileUrl || undefined,
        storage_type: env.STORAGE_TYPE === 's3' ? 's3' : 'local',
        mime_type: file.mimetype || undefined,
        size: file.size,
      };

      const savedFile = await fileModel.create(fileData);
      return savedFile;
    } catch (error) {
      logger.error('Error uploading file:', error);
      throw error;
    }
  }

  async getFiles(userId: string, limit: number = 100, offset: number = 0): Promise<FileListResponse> {
    const files = await fileModel.findByUserId(userId, limit, offset);
    const total = await fileModel.countByUserId(userId);

    return {
      files,
      total,
      limit,
      offset,
    };
  }

  async getFileById(fileId: string, userId: string): Promise<File | null> {
    const file = await fileModel.findById(fileId);
    
    if (!file) {
      return null;
    }

    if (file.user_id !== userId) {
      throw new Error('Unauthorized access to file');
    }

    return file;
  }

  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    const file = await fileModel.findById(fileId);
    
    if (!file) {
      throw new Error('File not found');
    }

    if (file.user_id !== userId) {
      throw new Error('Unauthorized access to file');
    }

    await storageService.delete(file.file_path, file.storage_type);
    const deleted = await fileModel.delete(fileId);

    return deleted;
  }

  async renameFile(fileId: string, userId: string, newName: string): Promise<File> {
    const file = await fileModel.findById(fileId);
    
    if (!file) {
      throw new Error('File not found');
    }

    if (file.user_id !== userId) {
      throw new Error('Unauthorized access to file');
    }

    if (!newName || newName.trim().length === 0) {
      throw new Error('File name cannot be empty');
    }

    const updatedFile = await fileModel.update(fileId, { name: newName.trim() });
    
    if (!updatedFile) {
      throw new Error('Failed to rename file');
    }

    return updatedFile;
  }

  async searchFiles(userId: string, searchTerm: string, limit: number = 100, offset: number = 0): Promise<FileListResponse> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return this.getFiles(userId, limit, offset);
    }

    const files = await fileModel.searchByUserId(userId, searchTerm.trim(), limit, offset);
    const total = files.length;

    return {
      files,
      total,
      limit,
      offset,
    };
  }

  async getFileDownload(fileId: string, userId: string): Promise<{ file: File; buffer: Buffer }> {
    const file = await fileModel.findById(fileId);
    
    if (!file) {
      throw new Error('File not found');
    }

    if (file.user_id !== userId) {
      throw new Error('Unauthorized access to file');
    }

    const buffer = await storageService.download(file.file_path, file.storage_type);

    return {
      file,
      buffer,
    };
  }
}

export const fileService = new FileService();

