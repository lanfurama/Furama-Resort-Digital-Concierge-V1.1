import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database connection configuration
// Try different SSL configurations based on server requirements
const dbConfig: any = {
  host: process.env.DB_HOST || '27.71.229.4',
  port: parseInt(process.env.DB_PORT || '6243'),
  database: process.env.DB_NAME || 'furama_resort_digital_concierge',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Satthuskt321@',
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
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;

