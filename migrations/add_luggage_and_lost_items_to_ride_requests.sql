-- Migration: Add notes column to ride_requests table
-- This allows tracking luggage information and lost items in a simple note field
-- Date: 2025-01-XX

-- Add notes column (for luggage info, lost items, or any special instructions)
ALTER TABLE ride_requests 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN ride_requests.notes IS 'General notes for the ride: luggage information, lost items, special instructions, or any other relevant information';
