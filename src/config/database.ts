import { Pool, PoolClient } from 'pg';
import { env } from './env';
import { logger } from '../utils/logger';

let pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
    });

    pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });
  }
  return pool;
};

export const connectDatabase = async (): Promise<void> => {
  try {
    const pool = getPool();
    const client = await pool.connect();
    
    // Test connection
    await client.query('SELECT NOW()');
    logger.info('Database connected successfully');
    
    // Initialize schema
    await initializeSchema(client);
    
    client.release();
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

const initializeSchema = async (client: PoolClient): Promise<void> => {
  try {
    // Create users table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255),
        picture TEXT,
        provider VARCHAR(50) NOT NULL DEFAULT 'email',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS files (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(500) NOT NULL,
        original_name VARCHAR(500) NOT NULL,
        file_path TEXT NOT NULL,
        file_url TEXT,
        storage_type VARCHAR(20) NOT NULL DEFAULT 'local',
        mime_type VARCHAR(100),
        size BIGINT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_files_name ON files(name)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS file_shares (
        id VARCHAR(255) PRIMARY KEY,
        file_id VARCHAR(255) NOT NULL,
        owner_id VARCHAR(255) NOT NULL,
        shared_with_id VARCHAR(255) NOT NULL,
        permission VARCHAR(20) NOT NULL DEFAULT 'read',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (shared_with_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(file_id, shared_with_id)
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON file_shares(file_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_file_shares_shared_with_id ON file_shares(shared_with_id)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS share_links (
        id VARCHAR(255) PRIMARY KEY,
        file_id VARCHAR(255) NOT NULL,
        owner_id VARCHAR(255) NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        permission VARCHAR(20) NOT NULL DEFAULT 'view',
        expires_at TIMESTAMP,
        password VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_share_links_file_id ON share_links(file_id)
    `);

    logger.info('Database schema initialized successfully');
  } catch (error) {
    logger.error('Schema initialization failed:', error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection closed');
  }
};

