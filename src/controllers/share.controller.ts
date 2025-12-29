import { Request, Response, NextFunction } from 'express';
import { shareService } from '../services/share.service';
import { sendSuccessResponse, sendErrorResponse } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export class ShareController {
  async shareWithUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        sendErrorResponse(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
        return;
      }

      const { id } = req.params;
      if (!id) {
        sendErrorResponse(res, 'File ID is required', HTTP_STATUS.BAD_REQUEST);
        return;
      }

      const { email, permission } = req.body;

      if (!email || typeof email !== 'string') {
        sendErrorResponse(res, 'Email is required', HTTP_STATUS.BAD_REQUEST);
        return;
      }

      if (permission && !['view', 'edit'].includes(permission)) {
        sendErrorResponse(res, 'Permission must be "view" or "edit"', HTTP_STATUS.BAD_REQUEST);
        return;
      }

      const result = await shareService.shareWithUser({
        fileId: id,
        ownerId: user.id,
        email: email.trim().toLowerCase(),
        permission: permission || 'view',
      });

      sendSuccessResponse(
        res,
        'File shared successfully',
        {
          file: result.file,
          shared_with: {
            user_id: result.share.shared_with_id,
            email: email,
            permission: result.share.permission,
          },
        },
        HTTP_STATUS.CREATED
      );
    } catch (error: any) {
      if (error.message === 'File not found') {
        sendErrorResponse(res, error.message, HTTP_STATUS.NOT_FOUND);
        return;
      }
      if (error.message.includes('Unauthorized')) {
        sendErrorResponse(res, error.message, HTTP_STATUS.FORBIDDEN);
        return;
      }
      if (error.message === 'User with this email does not exist') {
        sendErrorResponse(res, error.message, HTTP_STATUS.NOT_FOUND);
        return;
      }
      if (error.message === 'Cannot share file with yourself') {
        sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
        return;
      }
      logger.error('Share with user error:', error);
      next(error);
    }
  }

  async getShareInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        sendErrorResponse(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
        return;
      }

      const { id } = req.params;
      if (!id) {
        sendErrorResponse(res, 'File ID is required', HTTP_STATUS.BAD_REQUEST);
        return;
      }

      const shareInfo = await shareService.getShareInfo(id, user.id);

      sendSuccessResponse(res, 'Share info retrieved successfully', shareInfo);
    } catch (error: any) {
      if (error.message === 'File not found') {
        sendErrorResponse(res, error.message, HTTP_STATUS.NOT_FOUND);
        return;
      }
      if (error.message.includes('Unauthorized')) {
        sendErrorResponse(res, error.message, HTTP_STATUS.FORBIDDEN);
        return;
      }
      logger.error('Get share info error:', error);
      next(error);
    }
  }

  async createShareLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        sendErrorResponse(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
        return;
      }

      const { id } = req.params;
      if (!id) {
        sendErrorResponse(res, 'File ID is required', HTTP_STATUS.BAD_REQUEST);
        return;
      }

      const { permission, expires_at, password } = req.body;

      if (permission && !['view', 'edit'].includes(permission)) {
        sendErrorResponse(res, 'Permission must be "view" or "edit"', HTTP_STATUS.BAD_REQUEST);
        return;
      }

      let expiresAt: Date | undefined;
      if (expires_at) {
        expiresAt = new Date(expires_at);
        if (isNaN(expiresAt.getTime())) {
          sendErrorResponse(res, 'Invalid expiration date format', HTTP_STATUS.BAD_REQUEST);
          return;
        }
      }

      const shareLink = await shareService.createShareLink(
        id,
        user.id,
        permission || 'view',
        expiresAt,
        password
      );

      const frontendUrl = env.FRONTEND_URL || 'http://localhost:3000';
      const shareLinkUrl = `${frontendUrl}/shared/${shareLink.token}`;

      sendSuccessResponse(
        res,
        'Share link created successfully',
        {
          share_link: shareLinkUrl,
          token: shareLink.token,
          permission: shareLink.permission,
          expires_at: shareLink.expires_at,
        },
        HTTP_STATUS.CREATED
      );
    } catch (error: any) {
      if (error.message === 'File not found') {
        sendErrorResponse(res, error.message, HTTP_STATUS.NOT_FOUND);
        return;
      }
      if (error.message.includes('Unauthorized')) {
        sendErrorResponse(res, error.message, HTTP_STATUS.FORBIDDEN);
        return;
      }
      logger.error('Create share link error:', error);
      next(error);
    }
  }

  async revokeShareAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        sendErrorResponse(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
        return;
      }

      const { id, userId } = req.params;
      if (!id || !userId) {
        sendErrorResponse(res, 'File ID and User ID are required', HTTP_STATUS.BAD_REQUEST);
        return;
      }

      await shareService.revokeShareAccess(id, userId, user.id);

      sendSuccessResponse(res, 'Share access revoked successfully', null, HTTP_STATUS.NO_CONTENT);
    } catch (error: any) {
      if (error.message === 'File not found') {
        sendErrorResponse(res, error.message, HTTP_STATUS.NOT_FOUND);
        return;
      }
      if (error.message.includes('Unauthorized')) {
        sendErrorResponse(res, error.message, HTTP_STATUS.FORBIDDEN);
        return;
      }
      logger.error('Revoke share access error:', error);
      next(error);
    }
  }

  async removeShareLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        sendErrorResponse(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
        return;
      }

      const { id } = req.params;
      if (!id) {
        sendErrorResponse(res, 'File ID is required', HTTP_STATUS.BAD_REQUEST);
        return;
      }

      await shareService.removeShareLink(id, user.id);

      sendSuccessResponse(res, 'Share link removed successfully', null, HTTP_STATUS.NO_CONTENT);
    } catch (error: any) {
      if (error.message === 'File not found') {
        sendErrorResponse(res, error.message, HTTP_STATUS.NOT_FOUND);
        return;
      }
      if (error.message.includes('Unauthorized')) {
        sendErrorResponse(res, error.message, HTTP_STATUS.FORBIDDEN);
        return;
      }
      logger.error('Remove share link error:', error);
      next(error);
    }
  }

  async getSharedFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        sendErrorResponse(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
        return;
      }

      const sharedFiles = await shareService.getSharedFiles(user.id);

      sendSuccessResponse(res, 'Shared files retrieved successfully', { files: sharedFiles });
    } catch (error: any) {
      logger.error('Get shared files error:', error);
      next(error);
    }
  }

  async getFileByShareToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      if (!token) {
        sendErrorResponse(res, 'Share token is required', HTTP_STATUS.BAD_REQUEST);
        return;
      }

      const { file, permission } = await shareService.getFileByShareToken(token);

      sendSuccessResponse(res, 'File retrieved successfully', {
        file,
        permission,
      });
    } catch (error: any) {
      if (error.message === 'Invalid or expired share link' || error.message === 'Share link has expired') {
        sendErrorResponse(res, error.message, HTTP_STATUS.NOT_FOUND);
        return;
      }
      if (error.message === 'File not found') {
        sendErrorResponse(res, error.message, HTTP_STATUS.NOT_FOUND);
        return;
      }
      logger.error('Get file by share token error:', error);
      next(error);
    }
  }

  async downloadSharedFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      if (!token) {
        sendErrorResponse(res, 'Share token is required', HTTP_STATUS.BAD_REQUEST);
        return;
      }

      const { file, buffer } = await shareService.downloadFileByShareToken(token);

      res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
      res.setHeader('Content-Length', buffer.length);

      res.send(buffer);
    } catch (error: any) {
      if (error.message === 'Invalid or expired share link' || error.message === 'Share link has expired') {
        sendErrorResponse(res, error.message, HTTP_STATUS.NOT_FOUND);
        return;
      }
      if (error.message === 'File not found') {
        sendErrorResponse(res, error.message, HTTP_STATUS.NOT_FOUND);
        return;
      }
      logger.error('Download shared file error:', error);
      next(error);
    }
  }
}

export const shareController = new ShareController();

