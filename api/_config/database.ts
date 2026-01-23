import pg from 'pg';
import dotenv from 'dotenv';
import logger from '../_utils/logger.js';

dotenv.config();

const { Pool } = pg;

// Database connection configuration
// All credentials must come from environment variables for security
// Never hardcode credentials in source code!
if (!process.env.DB_HOST || !process.env.DB_PORT || !process.env.DB_NAME || 
    !process.env.DB_USER || !process.env.DB_PASSWORD) {
  throw new Error('Missing required database environment variables. Please set DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD in your .env file or Vercel environment variables.');
}

const dbConfig: any = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

// If DB_SSL environment variable is set, use SSL
if (process.env.DB_SSL === 'true') {
  dbConfig.ssl = {
    rejectUnauthorized: false // Accept self-signed certificates
  };
} else if (process.env.DB_SSL === 'false') {
  dbConfig.ssl = false; // Explicitly disable SSL
}
// If DB_SSL is not set, don't include ssl option (let pg library decide)

const pool = new Pool(dbConfig);

// Test connection
pool.on('connect', () => {
  logger.info('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error({ err }, '❌ Unexpected error on idle client');
  process.exit(-1);
});

export default pool;

