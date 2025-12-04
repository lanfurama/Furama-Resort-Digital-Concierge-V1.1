-- Migration: Add timestamp columns to ride_requests table
-- This adds columns to track when buggy rides reach different statuses

ALTER TABLE ride_requests 
ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS arriving_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITHOUT TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN ride_requests.picked_up_at IS 'Timestamp when driver picked up the guest (status = ON_TRIP)';
COMMENT ON COLUMN ride_requests.completed_at IS 'Timestamp when ride was completed (status = COMPLETED)';
COMMENT ON COLUMN ride_requests.arriving_at IS 'Timestamp when driver arrived at pickup location (status = ARRIVING)';
COMMENT ON COLUMN ride_requests.assigned_at IS 'Timestamp when driver was assigned (status = ASSIGNED)';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ride_requests_picked_up_at ON ride_requests(picked_up_at);
CREATE INDEX IF NOT EXISTS idx_ride_requests_completed_at ON ride_requests(completed_at);
CREATE INDEX IF NOT EXISTS idx_ride_requests_arriving_at ON ride_requests(arriving_at);
CREATE INDEX IF NOT EXISTS idx_ride_requests_assigned_at ON ride_requests(assigned_at);

