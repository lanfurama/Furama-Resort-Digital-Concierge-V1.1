-- SQL UPDATE statements to set locations for Facilities and Restaurants
-- All locations arranged in a neat grid layout for better visualization
-- Increased spacing for easier clicking

-- ============================================
-- RESORT AREA - CENTRAL FACILITIES
-- ============================================

-- Main Lobby (Front Desk): Central point of resort area
UPDATE public.locations 
SET lat = 16.0530, lng = 108.1940
WHERE name = 'Main Lobby' AND type = 'FACILITY';

-- Furama Resort Danang: Same as Main Lobby (reference point)
UPDATE public.locations 
SET lat = 16.0530, lng = 108.1940
WHERE name = 'Furama Resort Danang' AND type = 'FACILITY';

-- Ocean Pool: North of Main Lobby (increased spacing)
UPDATE public.locations 
SET lat = 16.0550, lng = 108.1940
WHERE name = 'Ocean Pool' AND type = 'FACILITY';

-- Lagoon Pool: South of Main Lobby (increased spacing)
UPDATE public.locations 
SET lat = 16.0510, lng = 108.1940
WHERE name = 'Lagoon Pool' AND type = 'FACILITY';

-- Don Cipriani's Italian Restaurant: East of Main Lobby (increased spacing)
UPDATE public.locations 
SET lat = 16.0530, lng = 108.1960
WHERE name = 'Don Cipriani''s Italian Restaurant' AND type = 'RESTAURANT';

-- ============================================
-- VILLAS AREA FACILITIES
-- ============================================

-- Furama Villas Reception: Front desk for villas area
-- Located at the top of villas area with more spacing
UPDATE public.locations 
SET lat = 16.0570, lng = 108.2000
WHERE name = 'Furama Villas Reception' AND type = 'FACILITY';

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify all facility locations are updated:
-- SELECT name, lat, lng, type 
-- FROM public.locations 
-- WHERE type IN ('FACILITY', 'RESTAURANT')
-- ORDER BY type, name;
