-- Migration: Add check_in and check_out columns to users table
-- This allows guest access control based on check-in and check-out dates
-- If check_in/check_out are NULL, guest can login anytime (backward compatible)

-- Add check_in column (when guest can start accessing the system)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS check_in TIMESTAMP;

-- Add check_out column (when guest access expires)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS check_out TIMESTAMP;

-- Add comments
COMMENT ON COLUMN users.check_in IS 'Check-in date/time - guest can login starting from this time. NULL means no restriction.';
COMMENT ON COLUMN users.check_out IS 'Check-out date/time - guest access expires after this time. NULL means no restriction.';

