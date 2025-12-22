-- Migration: Add EXTEND_STAY service type
-- Description: Allows guests to request extending their stay
-- Date: 2025-01-XX

-- Check if EXTEND_STAY type already exists, if not, we need to update the type constraint
-- Note: This assumes service_requests.type is a VARCHAR or TEXT column
-- If it's an ENUM, you'll need to alter the enum type instead

-- For PostgreSQL, if type is VARCHAR/TEXT, no migration needed
-- If it's an ENUM, uncomment and run:
-- ALTER TYPE service_request_type ADD VALUE 'EXTEND_STAY';

-- Add comment for documentation
COMMENT ON COLUMN service_requests.type IS 'Service type: DINING, SPA, HOUSEKEEPING, POOL, BUTLER, or EXTEND_STAY';

