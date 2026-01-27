-- Migration: Add merged-ride columns to ride_requests table
-- Supports driver merge-suggestion flow and per-guest Picked Up / Completed for merged trips

-- is_merged: true when this ride was created by merging two SEARCHING rides
ALTER TABLE ride_requests
ADD COLUMN IF NOT EXISTS is_merged BOOLEAN DEFAULT false;

-- segments: JSON array of route segments (from, to, onBoard) for merged trips
-- Example: [{"from":"Villa A","to":"Lobby","onBoard":[{"name":"...","roomNumber":"101","count":2}]}]
ALTER TABLE ride_requests
ADD COLUMN IF NOT EXISTS segments JSONB DEFAULT NULL;

-- merged_progress: 0..2*segments.length; step 2k = picked up at segment k's "from", step 2k+1 = dropped at segment k's "to"
ALTER TABLE ride_requests
ADD COLUMN IF NOT EXISTS merged_progress INTEGER DEFAULT 0;

COMMENT ON COLUMN ride_requests.is_merged IS 'True if ride was created by merging two rides (driver or staff)';
COMMENT ON COLUMN ride_requests.segments IS 'Route segments for merged trips: from, to, onBoard per segment';
COMMENT ON COLUMN ride_requests.merged_progress IS 'Driver progress for merged ride: 0..2*segments.length (pick/drop steps)';
