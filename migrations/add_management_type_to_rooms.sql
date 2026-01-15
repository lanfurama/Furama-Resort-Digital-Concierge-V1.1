-- Migration: Add management_type to rooms table
-- Created: 2026-01-15
-- Description: Adds a column to distinguish between Furama Managed and Owner Managed villas

-- 1. Add the column with a default value of 'FURAMA_MANAGED'
ALTER TABLE public.rooms 
ADD COLUMN management_type VARCHAR(50) DEFAULT 'FURAMA_MANAGED';

-- 2. (Optional) Create an index if you plan to filter by this column frequently
CREATE INDEX idx_rooms_management_type ON public.rooms(management_type);

-- 3. Update existing records if specific villas are known to be Owner Managed (Example)
-- UPDATE public.rooms SET management_type = 'OWNER_MANAGED' WHERE number IN ('S01', 'S02', 'Q5');
