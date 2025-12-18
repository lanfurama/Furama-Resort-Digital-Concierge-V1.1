-- Migration: Add RECEPTION role to user_role enum
-- Date: 2025-12-09
-- Description: Adds RECEPTION as a new user role option

-- Add RECEPTION to the user_role enum type
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'RECEPTION';

-- Verify the change
SELECT unnest(enum_range(NULL::public.user_role)) AS role;










