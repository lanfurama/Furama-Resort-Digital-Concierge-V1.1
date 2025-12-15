-- Migration: Add driver location tracking columns to users table
-- Description: Adds current_lat, current_lng, and location_updated_at columns to track real-time driver positions
-- Date: 2025-01-XX

-- Add columns for driver location tracking
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS current_lat NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS current_lng NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITHOUT TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN users.current_lat IS 'Current latitude of driver (for DRIVER role only). Updated via GPS tracking.';
COMMENT ON COLUMN users.current_lng IS 'Current longitude of driver (for DRIVER role only). Updated via GPS tracking.';
COMMENT ON COLUMN users.location_updated_at IS 'Timestamp when driver location was last updated. Used to determine if location is stale.';

-- Create index for efficient queries on driver locations
CREATE INDEX IF NOT EXISTS idx_users_driver_location ON users(role, current_lat, current_lng) WHERE role = 'DRIVER';

-- Create index for location_updated_at to find stale locations
CREATE INDEX IF NOT EXISTS idx_users_location_updated_at ON users(location_updated_at) WHERE role = 'DRIVER';

