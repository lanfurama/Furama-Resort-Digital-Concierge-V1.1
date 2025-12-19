-- Migration: Add email column to users table
-- Description: Adds email column to support email notifications for staff (Admin, Driver, Reception, Supervisor)
-- Date: 2025-01-XX

-- Add email column (nullable, as existing users may not have email)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN users.email IS 'Email address for notifications. Used for Admin, Driver, Reception, Supervisor roles.';

-- Create index for efficient email lookups (optional, for future email-based queries)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;

