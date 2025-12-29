import { fileModel, File, CreateFileData } from '../models/file.model';
import { storageService } from './storage.service';
import { shareService } from './share.service';
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
    customName?: string,
    parentId?: string | null
  ): Promise<File> {
    try {
      // If parent_id is provided, validate that it exists and is a folder
      if (parentId) {
        const parent = await fileModel.findById(parentId);
        if (!parent) {
          throw new Error('Parent folder not found');
        }
        if (parent.mime_type !== 'folder') {
          throw new Error('Parent must be a folder');
        }
        if (parent.user_id !== userId) {
          throw new Error('Unauthorized: You can only upload files to your own folders');
        }
      }

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
        parent_id: parentId || null,
      };

      const savedFile = await fileModel.create(fileData);
      return savedFile;
    } catch (error) {
      logger.error('Error uploading file:', error);
      throw error;
    }
  }

  async getFiles(userId: string, limit: number = 100, offset: number = 0, parentId: string | null = null): Promise<FileListResponse> {
    const files = await fileModel.findByUserId(userId, limit, offset, parentId);
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

    if (file.user_id === userId) {
      return file;
    }

    const access = await shareService.checkFileAccess(fileId, userId);
    if (!access.hasAccess) {
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

    // If it's a folder, recursively delete all contents first
    if (file.mime_type === 'folder') {
      await this.deleteFolderContents(fileId, userId);
    } else {
      // Delete file from storage
      if (file.file_path) {
        await storageService.delete(file.file_path, file.storage_type);
      }
    }
    
    // Delete the file/folder record (CASCADE will handle nested items in DB, but we already handled storage)
    const deleted = await fileModel.delete(fileId);

    return deleted;
  }

  private async deleteFolderContents(folderId: string, userId: string): Promise<void> {
    // Get all items in this folder
    const items = await fileModel.findByUserId(userId, 1000, 0, folderId);
    
    // Recursively delete each item
    for (const item of items) {
      if (item.mime_type === 'folder') {
        // Recursively delete folder contents
        await this.deleteFolderContents(item.id, userId);
      } else {
        // Delete file from storage
        if (item.file_path) {
          try {
            await storageService.delete(item.file_path, item.storage_type);
          } catch (error) {
            logger.error(`Failed to delete file from storage: ${item.file_path}`, error);
            // Continue deletion even if storage deletion fails
          }
        }
      }
      // Delete the item record
      await fileModel.delete(item.id);
    }
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

    // Folders cannot be downloaded
    if (file.mime_type === 'folder') {
      throw new Error('Folders cannot be downloaded');
    }

    // Ensure file_path exists (should always be present for non-folder files)
    if (!file.file_path) {
      throw new Error('File path not found');
    }

    if (file.user_id === userId) {
      const buffer = await storageService.download(file.file_path, file.storage_type);
      return { file, buffer };
    }

    const access = await shareService.checkFileAccess(fileId, userId);
    if (!access.hasAccess) {
      throw new Error('Unauthorized access to file');
    }

    const buffer = await storageService.download(file.file_path, file.storage_type);
    return { file, buffer };
  }

  async createFolder(userId: string, name: string, parentId: string | null = null): Promise<File> {
    // Validate folder name
    if (!name || name.trim().length === 0) {
      throw new Error('Folder name is required');
    }

    const trimmedName = name.trim();

    // Check for duplicate folder name in the same parent
    const existingFolder = await fileModel.findByNameAndParent(userId, trimmedName, parentId);
    if (existingFolder && existingFolder.mime_type === 'folder') {
      throw new Error('A folder with this name already exists');
    }

    // If parent_id is provided, validate that it exists and is a folder
    if (parentId) {
      const parent = await fileModel.findById(parentId);
      if (!parent) {
        throw new Error('Parent folder not found');
      }
      if (parent.mime_type !== 'folder') {
        throw new Error('Parent must be a folder');
      }
      if (parent.user_id !== userId) {
        throw new Error('Unauthorized: You can only create folders in your own folders');
      }
      // Note: Circular reference prevention is handled by database foreign key constraints
      // For moving folders (update parent_id), we'd need additional validation
    }

    // Create folder record
    const folderData: CreateFileData = {
      user_id: userId,
      name: trimmedName,
      original_name: trimmedName,
      file_path: null, // Folders don't have a file path
      storage_type: env.STORAGE_TYPE === 's3' ? 's3' : 'local',
      mime_type: 'folder',
      size: 0,
      parent_id: parentId || null,
    };

    const folder = await fileModel.create(folderData);
    return folder;
  }
}

export const fileService = new FileService();

