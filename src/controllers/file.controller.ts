import { Request, Response, NextFunction } from 'express';
import { fileService } from '../services/file.service';
import { sendSuccessResponse, sendErrorResponse } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';
import { logger } from '../utils/logger';
import { uploadSingle, handleUploadError } from '../middlewares/upload.middleware';

export class FileController {
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    uploadSingle(req, res, async (err) => {
      if (err) {
        handleUploadError(err, res, next);
        return;
      }

      try {
        const user = (req as any).user;
        if (!user || !user.id) {
          sendErrorResponse(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
          return;
        }

        if (!req.file) {
          sendErrorResponse(res, 'No file uploaded', HTTP_STATUS.BAD_REQUEST);
          return;
        }

        const customName = req.body.name;
        const file = await fileService.uploadFile(req.file, user.id, customName);

        sendSuccessResponse(
          res,
          'File uploaded successfully',
          { file },
          HTTP_STATUS.CREATED
        );
      } catch (error: any) {
        logger.error('Upload error:', error);
        next(error);
      }
    });
  }

  async getFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        sendErrorResponse(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
        return;
      }

      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await fileService.getFiles(user.id, limit, offset);

      sendSuccessResponse(res, 'Files retrieved successfully', result);
    } catch (error: any) {
      logger.error('Get files error:', error);
      next(error);
    }
  }

  async getFileById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        sendErrorResponse(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
        return;
      }

      const { id } = req.params;
      const file = await fileService.getFileById(id, user.id);

      if (!file) {
        sendErrorResponse(res, 'File not found', HTTP_STATUS.NOT_FOUND);
        return;
      }

      sendSuccessResponse(res, 'File retrieved successfully', { file });
    } catch (error: any) {
      if (error.message === 'Unauthorized access to file') {
        sendErrorResponse(res, error.message, HTTP_STATUS.FORBIDDEN);
        return;
      }
      logger.error('Get file error:', error);
      next(error);
    }
  }

  async deleteFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        sendErrorResponse(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
        return;
      }

      const { id } = req.params;
      await fileService.deleteFile(id, user.id);

      sendSuccessResponse(res, 'File deleted successfully', null, HTTP_STATUS.NO_CONTENT);
    } catch (error: any) {
      if (error.message === 'File not found') {
        sendErrorResponse(res, error.message, HTTP_STATUS.NOT_FOUND);
        return;
      }
      if (error.message === 'Unauthorized access to file') {
        sendErrorResponse(res, error.message, HTTP_STATUS.FORBIDDEN);
        return;
      }
      logger.error('Delete file error:', error);
      next(error);
    }
  }

  async renameFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        sendErrorResponse(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
        return;
      }

      const { id } = req.params;
      const { name } = req.body;

      if (!name || typeof name !== 'string') {
        sendErrorResponse(res, 'File name is required', HTTP_STATUS.BAD_REQUEST);
        return;
      }

      const file = await fileService.renameFile(id, user.id, name);

      sendSuccessResponse(res, 'File renamed successfully', { file });
    } catch (error: any) {
      if (error.message === 'File not found') {
        sendErrorResponse(res, error.message, HTTP_STATUS.NOT_FOUND);
        return;
      }
      if (error.message === 'Unauthorized access to file') {
        sendErrorResponse(res, error.message, HTTP_STATUS.FORBIDDEN);
        return;
      }
      if (error.message === 'File name cannot be empty') {
        sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
        return;
      }
      logger.error('Rename file error:', error);
      next(error);
    }
  }

  async searchFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        sendErrorResponse(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
        return;
      }

      const { q } = req.query;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      if (!q || typeof q !== 'string') {
        sendErrorResponse(res, 'Search query is required', HTTP_STATUS.BAD_REQUEST);
        return;
      }

      const result = await fileService.searchFiles(user.id, q, limit, offset);

      sendSuccessResponse(res, 'Search completed successfully', result);
    } catch (error: any) {
      logger.error('Search files error:', error);
      next(error);
    }
  }

  async downloadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        sendErrorResponse(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
        return;
      }

      const { id } = req.params;
      const { file, buffer } = await fileService.getFileDownload(id, user.id);

      res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
      res.setHeader('Content-Length', buffer.length);

      res.send(buffer);
    } catch (error: any) {
      if (error.message === 'File not found') {
        sendErrorResponse(res, error.message, HTTP_STATUS.NOT_FOUND);
        return;
      }
      if (error.message === 'Unauthorized access to file') {
        sendErrorResponse(res, error.message, HTTP_STATUS.FORBIDDEN);
        return;
      }
      logger.error('Download file error:', error);
      next(error);
    }
  }
}

export const fileController = new FileController();

