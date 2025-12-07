import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database connection configuration
if (!process.env.DB_HOST || !process.env.DB_PORT || !process.env.DB_NAME || 
    !process.env.DB_USER || !process.env.DB_PASSWORD) {
  console.error('❌ Missing required database environment variables.');
  console.error('Please set DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD in your .env file');
  process.exit(1);
}

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

if (process.env.DB_SSL === 'true') {
  dbConfig.ssl = { rejectUnauthorized: false };
} else if (process.env.DB_SSL === 'false') {
  dbConfig.ssl = false;
}

const pool = new Pool(dbConfig);

async function runSQLFile(filePath) {
  try {
    console.log(`\n📄 Reading SQL file: ${filePath}`);
    const sql = readFileSync(filePath, 'utf8');
    
    // Split SQL by semicolons and filter out empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    try {
      await client.query('BEGIN');
      console.log('🔄 Starting transaction...');
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        try {
          await client.query(statement);
          successCount++;
          if ((i + 1) % 10 === 0) {
            console.log(`   ✓ Executed ${i + 1}/${statements.length} statements...`);
          }
        } catch (error) {
          errorCount++;
          console.error(`   ✗ Error in statement ${i + 1}:`, error.message);
          // Continue with other statements
        }
      }
      
      await client.query('COMMIT');
      console.log(`\n✅ Transaction completed!`);
      console.log(`   ✓ Success: ${successCount} statements`);
      if (errorCount > 0) {
        console.log(`   ✗ Errors: ${errorCount} statements`);
      }
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Transaction rolled back due to error:', error.message);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`❌ Error running SQL file ${filePath}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting SQL updates...\n');
    console.log('Database:', process.env.DB_NAME);
    console.log('Host:', process.env.DB_HOST);
    console.log('Port:', process.env.DB_PORT);
    
    // Run facilities first, then villas
    const facilitiesPath = join(__dirname, 'update_facilities_locations.sql');
    const villasPath = join(__dirname, 'update_villas_locations.sql');
    
    await runSQLFile(facilitiesPath);
    await runSQLFile(villasPath);
    
    console.log('\n✨ All SQL updates completed successfully!');
  } catch (error) {
    console.error('\n❌ Failed to run SQL updates:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

