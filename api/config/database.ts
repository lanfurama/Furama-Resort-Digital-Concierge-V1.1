import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || '27.71.229.4',
  port: parseInt(process.env.DB_PORT || '6243'),
  database: process.env.DB_NAME || 'furama_resort_digital_concierge',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Satthuskt321@',
  ssl: {
    rejectUnauthorized: false // Required for some PostgreSQL servers
  },
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;

