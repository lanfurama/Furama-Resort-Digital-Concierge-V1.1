-- Migration: Add POOL and BUTLER to service_type enum
-- This allows service requests for Pool and Butler services

-- Note: PostgreSQL doesn't support IF NOT EXISTS for ALTER TYPE ADD VALUE
-- Run this migration only once. If values already exist, you'll get an error - that's okay, just skip.

-- Add POOL to service_type enum
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'POOL' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'service_type')
    ) THEN
        ALTER TYPE service_type ADD VALUE 'POOL';
    END IF;
END $$;

-- Add BUTLER to service_type enum
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'BUTLER' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'service_type')
    ) THEN
        ALTER TYPE service_type ADD VALUE 'BUTLER';
    END IF;
END $$;
