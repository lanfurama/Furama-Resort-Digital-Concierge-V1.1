-- SQL UPDATE statements to set locations for Facilities
-- Only Front Desk (Main Lobby) for Resort area

-- ============================================
-- RESORT AREA - FRONT DESK ONLY
-- ============================================

-- Main Lobby (Front Desk): Central point of resort area
-- This is the main reception/front desk for the resort
UPDATE public.locations 
SET lat = 16.0550, lng = 108.1900
WHERE name = 'Main Lobby' AND type = 'FACILITY';

-- Furama Resort Danang: Same as Main Lobby (reference point)
UPDATE public.locations 
SET lat = 16.0550, lng = 108.1900
WHERE name = 'Furama Resort Danang' AND type = 'FACILITY';

-- ============================================
-- VILLAS AREA FACILITIES
-- ============================================

-- Furama Villas Reception: Front desk for villas area
-- Located at the villas entrance
UPDATE public.locations 
SET lat = 16.0495, lng = 108.2020
WHERE name = 'Furama Villas Reception' AND type = 'FACILITY';

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify all facility locations are updated:
-- SELECT name, lat, lng, type 
-- FROM public.locations 
-- WHERE type IN ('FACILITY', 'RESTAURANT')
-- ORDER BY type, name;
