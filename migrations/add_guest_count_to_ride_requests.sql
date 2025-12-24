-- Migration: Add guest_count column to ride_requests table
-- This tracks the number of guests for each buggy request
-- Maximum capacity per buggy is 7 seats

-- Add guest_count column (default to 1 if not specified)
ALTER TABLE ride_requests 
ADD COLUMN IF NOT EXISTS guest_count INTEGER DEFAULT 1 NOT NULL;

-- Add constraint to ensure guest_count is between 1 and 7
ALTER TABLE ride_requests
ADD CONSTRAINT check_guest_count_range 
CHECK (guest_count >= 1 AND guest_count <= 7);

-- Add comment
COMMENT ON COLUMN ride_requests.guest_count IS 'Number of guests for this buggy request (1-7, maximum capacity per buggy)';

-- Update existing records to have guest_count = 1 (if any exist)
UPDATE ride_requests 
SET guest_count = 1 
WHERE guest_count IS NULL OR guest_count < 1;

