import { Pool } from 'pg';
import { getPool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface FileShare {
  id: string;
  file_id: string;
  owner_id: string;
  shared_with_id: string;
  permission: 'view' | 'edit';
  created_at?: Date;
}

export interface ShareLink {
  id: string;
  file_id: string;
  owner_id: string;
  token: string;
  permission: 'view' | 'edit';
  expires_at?: Date | null;
  password?: string | null;
  created_at?: Date;
}

export interface CreateShareData {
  file_id: string;
  owner_id: string;
  shared_with_id: string;
  permission: 'view' | 'edit';
}

export interface CreateShareLinkData {
  file_id: string;
  owner_id: string;
  permission: 'view' | 'edit';
  expires_at?: Date;
  password?: string;
}

export class ShareModel {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  async createShare(shareData: CreateShareData): Promise<FileShare> {
    const id = uuidv4();
    const query = `
      INSERT INTO file_shares (id, file_id, owner_id, shared_with_id, permission)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (file_id, shared_with_id) 
      DO UPDATE SET permission = $5, created_at = CURRENT_TIMESTAMP
      RETURNING id, file_id, owner_id, shared_with_id, permission, created_at
    `;

    const values = [
      id,
      shareData.file_id,
      shareData.owner_id,
      shareData.shared_with_id,
      shareData.permission,
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToShare(result.rows[0]);
  }

  async getSharesByFileId(fileId: string): Promise<FileShare[]> {
    const query = `
      SELECT id, file_id, owner_id, shared_with_id, permission, created_at
      FROM file_shares
      WHERE file_id = $1
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query, [fileId]);
    return result.rows.map(row => this.mapRowToShare(row));
  }

  async getSharesByUserId(userId: string): Promise<FileShare[]> {
    const query = `
      SELECT id, file_id, owner_id, shared_with_id, permission, created_at
      FROM file_shares
      WHERE shared_with_id = $1
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows.map(row => this.mapRowToShare(row));
  }

  async deleteShare(fileId: string, sharedWithId: string): Promise<boolean> {
    const query = `
      DELETE FROM file_shares
      WHERE file_id = $1 AND shared_with_id = $2
    `;

    const result = await this.pool.query(query, [fileId, sharedWithId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async createShareLink(linkData: CreateShareLinkData): Promise<ShareLink> {
    const id = uuidv4();
    const token = uuidv4() + '-' + Date.now().toString(36);
    
    const query = `
      INSERT INTO share_links (id, file_id, owner_id, token, permission, expires_at, password)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, file_id, owner_id, token, permission, expires_at, password, created_at
    `;

    const values = [
      id,
      linkData.file_id,
      linkData.owner_id,
      token,
      linkData.permission,
      linkData.expires_at || null,
      linkData.password || null,
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToShareLink(result.rows[0]);
  }

  async getShareLinkByToken(token: string): Promise<ShareLink | null> {
    const query = `
      SELECT id, file_id, owner_id, token, permission, expires_at, password, created_at
      FROM share_links
      WHERE token = $1
    `;

    const result = await this.pool.query(query, [token]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToShareLink(result.rows[0]);
  }

  async getShareLinkByFileId(fileId: string): Promise<ShareLink | null> {
    const query = `
      SELECT id, file_id, owner_id, token, permission, expires_at, password, created_at
      FROM share_links
      WHERE file_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await this.pool.query(query, [fileId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToShareLink(result.rows[0]);
  }

  async deleteShareLink(fileId: string): Promise<boolean> {
    const query = `
      DELETE FROM share_links
      WHERE file_id = $1
    `;

    const result = await this.pool.query(query, [fileId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async checkFileAccess(fileId: string, userId: string): Promise<{ hasAccess: boolean; permission: 'view' | 'edit' | null }> {
    const shareQuery = `
      SELECT permission
      FROM file_shares
      WHERE file_id = $1 AND shared_with_id = $2
    `;

    const shareResult = await this.pool.query(shareQuery, [fileId, userId]);
    
    if (shareResult.rows.length > 0) {
      return {
        hasAccess: true,
        permission: shareResult.rows[0].permission,
      };
    }

    return {
      hasAccess: false,
      permission: null,
    };
  }

  private mapRowToShare(row: any): FileShare {
    return {
      id: row.id,
      file_id: row.file_id,
      owner_id: row.owner_id,
      shared_with_id: row.shared_with_id,
      permission: row.permission,
      created_at: row.created_at,
    };
  }

  private mapRowToShareLink(row: any): ShareLink {
    return {
      id: row.id,
      file_id: row.file_id,
      owner_id: row.owner_id,
      token: row.token,
      permission: row.permission,
      expires_at: row.expires_at,
      password: row.password,
      created_at: row.created_at,
    };
  }
}

export const shareModel = new ShareModel();

