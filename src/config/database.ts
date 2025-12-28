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

    // Create index on email for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
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

