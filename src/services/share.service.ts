import { shareModel, FileShare, ShareLink } from '../models/share.model';
import { fileModel } from '../models/file.model';
import { userModel } from '../models/user.model';
import { env } from '../config/env';

export interface ShareWithUserData {
  fileId: string;
  ownerId: string;
  email: string;
  permission: 'view' | 'edit';
}

export interface ShareInfo {
  shared_with: Array<{
    user_id: string;
    email: string;
    name: string;
    permission: 'view' | 'edit';
    shared_at: Date;
  }>;
  share_link: {
    enabled: boolean;
    link?: string;
    token?: string;
    permission?: 'view' | 'edit';
    expires_at?: Date | null;
  } | null;
}

export interface SharedFileInfo {
  id: string;
  name: string;
  original_name: string;
  mime_type: string | null;
  size: number;
  created_at: Date;
  shared_by: {
    id: string;
    name: string;
    email: string;
  };
  permission: 'view' | 'edit';
  shared_at: Date;
}

export class ShareService {
  async shareWithUser(data: ShareWithUserData): Promise<{ file: any; share: FileShare }> {
    const file = await fileModel.findById(data.fileId);
    
    if (!file) {
      throw new Error('File not found');
    }

    if (file.user_id !== data.ownerId) {
      throw new Error('Unauthorized: You can only share your own files');
    }

    const userToShareWith = await userModel.findByEmail(data.email.toLowerCase());
    
    if (!userToShareWith) {
      throw new Error('User with this email does not exist');
    }

    if (userToShareWith.id === data.ownerId) {
      throw new Error('Cannot share file with yourself');
    }

    const share = await shareModel.createShare({
      file_id: data.fileId,
      owner_id: data.ownerId,
      shared_with_id: userToShareWith.id,
      permission: data.permission,
    });

    return { file, share };
  }

  async getShareInfo(fileId: string, userId: string): Promise<ShareInfo> {
    const file = await fileModel.findById(fileId);
    
    if (!file) {
      throw new Error('File not found');
    }

    if (file.user_id !== userId) {
      throw new Error('Unauthorized: You can only view share info for your own files');
    }

    const shares = await shareModel.getSharesByFileId(fileId);
    const shareLink = await shareModel.getShareLinkByFileId(fileId);

    const sharedWith = await Promise.all(
      shares.map(async (share) => {
        const user = await userModel.findById(share.shared_with_id);
        return {
          user_id: share.shared_with_id,
          email: user?.email || '',
          name: user?.name || '',
          permission: share.permission,
          shared_at: share.created_at || new Date(),
        };
      })
    );

    let shareLinkInfo = null;
    if (shareLink) {
      const isExpired = shareLink.expires_at && new Date(shareLink.expires_at) < new Date();
      
      if (!isExpired) {
        const frontendUrl = env.FRONTEND_URL || 'http://localhost:3000';
        shareLinkInfo = {
          enabled: true,
          link: `${frontendUrl}/shared/${shareLink.token}`,
          token: shareLink.token,
          permission: shareLink.permission,
          expires_at: shareLink.expires_at,
        };
      }
    }

    return {
      shared_with: sharedWith,
      share_link: shareLinkInfo,
    };
  }

  async createShareLink(
    fileId: string,
    ownerId: string,
    permission: 'view' | 'edit' = 'view',
    expiresAt?: Date,
    password?: string
  ): Promise<ShareLink> {
    const file = await fileModel.findById(fileId);
    
    if (!file) {
      throw new Error('File not found');
    }

    if (file.user_id !== ownerId) {
      throw new Error('Unauthorized: You can only create share links for your own files');
    }

    const existingLink = await shareModel.getShareLinkByFileId(fileId);
    if (existingLink) {
      await shareModel.deleteShareLink(fileId);
    }

    const shareLink = await shareModel.createShareLink({
      file_id: fileId,
      owner_id: ownerId,
      permission,
      expires_at: expiresAt,
      password,
    });

    return shareLink;
  }

  async revokeShareAccess(fileId: string, sharedWithId: string, ownerId: string): Promise<boolean> {
    const file = await fileModel.findById(fileId);
    
    if (!file) {
      throw new Error('File not found');
    }

    if (file.user_id !== ownerId) {
      throw new Error('Unauthorized: You can only revoke access to your own files');
    }

    const deleted = await shareModel.deleteShare(fileId, sharedWithId);
    return deleted;
  }

  async removeShareLink(fileId: string, ownerId: string): Promise<boolean> {
    const file = await fileModel.findById(fileId);
    
    if (!file) {
      throw new Error('File not found');
    }

    if (file.user_id !== ownerId) {
      throw new Error('Unauthorized: You can only remove share links for your own files');
    }

    const deleted = await shareModel.deleteShareLink(fileId);
    return deleted;
  }

  async getSharedFiles(userId: string): Promise<SharedFileInfo[]> {
    const shares = await shareModel.getSharesByUserId(userId);

    const sharedFiles = await Promise.all(
      shares.map(async (share) => {
        const file = await fileModel.findById(share.file_id);
        const owner = await userModel.findById(share.owner_id);

        if (!file || !owner) {
          return null;
        }

        return {
          id: file.id,
          name: file.name,
          original_name: file.original_name,
          mime_type: file.mime_type,
          size: file.size,
          created_at: file.created_at || new Date(),
          shared_by: {
            id: owner.id,
            name: owner.name,
            email: owner.email,
          },
          permission: share.permission,
          shared_at: share.created_at || new Date(),
        };
      })
    );

    return sharedFiles.filter((file): file is SharedFileInfo => file !== null);
  }

  async getFileByShareToken(token: string): Promise<{ file: any; permission: 'view' | 'edit' }> {
    const shareLink = await shareModel.getShareLinkByToken(token);
    
    if (!shareLink) {
      throw new Error('Invalid or expired share link');
    }

    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      throw new Error('Share link has expired');
    }

    const file = await fileModel.findById(shareLink.file_id);
    
    if (!file) {
      throw new Error('File not found');
    }

    return {
      file,
      permission: shareLink.permission,
    };
  }

  async checkFileAccess(fileId: string, userId: string): Promise<{ hasAccess: boolean; permission: 'view' | 'edit' | null }> {
    const file = await fileModel.findById(fileId);
    
    if (!file) {
      return { hasAccess: false, permission: null };
    }

    if (file.user_id === userId) {
      return { hasAccess: true, permission: 'edit' };
    }

    return await shareModel.checkFileAccess(fileId, userId);
  }
}

export const shareService = new ShareService();

