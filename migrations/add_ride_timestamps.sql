-- Migration: Add timestamp columns to ride_requests table
-- This tracks: req_timestamp (request created), pick_timestamp (driver pickup), drop_timestamp (ride completed)

-- Add pick_timestamp column (when driver picks up guest - status = ON_TRIP)
ALTER TABLE ride_requests 
ADD COLUMN IF NOT EXISTS pick_timestamp TIMESTAMP;

-- Add drop_timestamp column (when ride is completed - status = COMPLETED)
ALTER TABLE ride_requests 
ADD COLUMN IF NOT EXISTS drop_timestamp TIMESTAMP;

-- Add assigned_timestamp column (when driver accepts ride - status = ASSIGNED/ARRIVING)
ALTER TABLE ride_requests 
ADD COLUMN IF NOT EXISTS assigned_timestamp TIMESTAMP;

-- Add comments
COMMENT ON COLUMN ride_requests.pick_timestamp IS 'Timestamp when driver picked up the guest (status = ON_TRIP)';
COMMENT ON COLUMN ride_requests.drop_timestamp IS 'Timestamp when ride was completed (status = COMPLETED)';
COMMENT ON COLUMN ride_requests.assigned_timestamp IS 'Timestamp when driver accepted the ride (status = ASSIGNED/ARRIVING)';

-- Note: req_timestamp is already tracked by the existing 'timestamp' column (bigint) or 'created_at' (timestamp)
