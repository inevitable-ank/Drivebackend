import { Pool } from 'pg';
import { getPool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string | null;
  picture?: string | null;
  provider: 'email' | 'google';
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateUserData {
  email: string;
  name: string;
  password?: string;
  picture?: string | null;
  provider: 'email' | 'google';
}

export class UserModel {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  async create(userData: CreateUserData): Promise<User> {
    const id = uuidv4();
    const query = `
      INSERT INTO users (id, email, name, password, picture, provider)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, name, password, picture, provider, created_at, updated_at
    `;

    const values = [
      id,
      userData.email.toLowerCase(),
      userData.name,
      userData.password || null,
      userData.picture || null,
      userData.provider,
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToUser(result.rows[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, email, name, password, picture, provider, created_at, updated_at
      FROM users
      WHERE email = $1
    `;

    const result = await this.pool.query(query, [email.toLowerCase()]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  async findById(id: string): Promise<User | null> {
    const query = `
      SELECT id, email, name, password, picture, provider, created_at, updated_at
      FROM users
      WHERE id = $1
    `;

    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  async update(id: string, updates: Partial<CreateUserData>): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.password !== undefined) {
      fields.push(`password = $${paramCount++}`);
      values.push(updates.password);
    }
    if (updates.picture !== undefined) {
      fields.push(`picture = $${paramCount++}`);
      values.push(updates.picture);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, name, password, picture, provider, created_at, updated_at
    `;

    const result = await this.pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      password: row.password,
      picture: row.picture,
      provider: row.provider,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

export const userModel = new UserModel();

