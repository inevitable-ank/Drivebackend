import { Pool } from 'pg';
import { getPool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface File {
  id: string;
  user_id: string;
  name: string;
  original_name: string;
  file_path: string;
  file_url?: string | null;
  storage_type: 'local' | 's3';
  mime_type?: string | null;
  size: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateFileData {
  user_id: string;
  name: string;
  original_name: string;
  file_path: string;
  file_url?: string | null;
  storage_type: 'local' | 's3';
  mime_type?: string | null;
  size: number;
}

export interface UpdateFileData {
  name?: string;
}

export class FileModel {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  async create(fileData: CreateFileData): Promise<File> {
    const id = uuidv4();
    const query = `
      INSERT INTO files (id, user_id, name, original_name, file_path, file_url, storage_type, mime_type, size)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, user_id, name, original_name, file_path, file_url, storage_type, mime_type, size, created_at, updated_at
    `;

    const values = [
      id,
      fileData.user_id,
      fileData.name,
      fileData.original_name,
      fileData.file_path,
      fileData.file_url || null,
      fileData.storage_type,
      fileData.mime_type || null,
      fileData.size,
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToFile(result.rows[0]);
  }

  async findById(id: string): Promise<File | null> {
    const query = `
      SELECT id, user_id, name, original_name, file_path, file_url, storage_type, mime_type, size, created_at, updated_at
      FROM files
      WHERE id = $1
    `;

    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToFile(result.rows[0]);
  }

  async findByUserId(userId: string, limit: number = 100, offset: number = 0): Promise<File[]> {
    const query = `
      SELECT id, user_id, name, original_name, file_path, file_url, storage_type, mime_type, size, created_at, updated_at
      FROM files
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.pool.query(query, [userId, limit, offset]);
    return result.rows.map(row => this.mapRowToFile(row));
  }

  async searchByUserId(userId: string, searchTerm: string, limit: number = 100, offset: number = 0): Promise<File[]> {
    const query = `
      SELECT id, user_id, name, original_name, file_path, file_url, storage_type, mime_type, size, created_at, updated_at
      FROM files
      WHERE user_id = $1 AND (name ILIKE $2 OR original_name ILIKE $2)
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `;

    const searchPattern = `%${searchTerm}%`;
    const result = await this.pool.query(query, [userId, searchPattern, limit, offset]);
    return result.rows.map(row => this.mapRowToFile(row));
  }

  async update(id: string, updates: UpdateFileData): Promise<File | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE files
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, user_id, name, original_name, file_path, file_url, storage_type, mime_type, size, created_at, updated_at
    `;

    const result = await this.pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToFile(result.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const query = `
      DELETE FROM files
      WHERE id = $1
    `;

    const result = await this.pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async countByUserId(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM files
      WHERE user_id = $1
    `;

    const result = await this.pool.query(query, [userId]);
    return parseInt(result.rows[0].count, 10);
  }

  private mapRowToFile(row: any): File {
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      original_name: row.original_name,
      file_path: row.file_path,
      file_url: row.file_url,
      storage_type: row.storage_type,
      mime_type: row.mime_type,
      size: row.size,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

export const fileModel = new FileModel();

