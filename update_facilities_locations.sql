-- SQL UPDATE statements for Facilities and Restaurants
-- Arranged in a very compact square grid, ordered by name
-- All locations grouped tightly together in one small square block

-- ============================================
-- FACILITIES & RESTAURANTS - Very Compact Square Grid
-- ============================================
-- 6 locations arranged in 3x2 grid
-- Starting position: 16.0500, 108.1900
-- Spacing: 0.0005 degrees (very tight, close together)

-- Row 1 (3 items)
UPDATE public.locations 
SET lat = 16.0500, lng = 108.1900
WHERE name = 'Don Cipriani''s Italian Restaurant' AND type = 'RESTAURANT';

UPDATE public.locations 
SET lat = 16.0500, lng = 108.1905
WHERE name = 'Furama Resort Danang' AND type = 'FACILITY';

UPDATE public.locations 
SET lat = 16.0500, lng = 108.1910
WHERE name = 'Furama Villas Reception' AND type = 'FACILITY';

-- Row 2 (3 items)
UPDATE public.locations 
SET lat = 16.0505, lng = 108.1900
WHERE name = 'Lagoon Pool' AND type = 'FACILITY';

UPDATE public.locations 
SET lat = 16.0505, lng = 108.1905
WHERE name = 'Main Lobby' AND type = 'FACILITY';

UPDATE public.locations 
SET lat = 16.0505, lng = 108.1910
WHERE name = 'Ocean Pool' AND type = 'FACILITY';

-- ============================================
-- Verification Query
-- ============================================
-- SELECT name, lat, lng, type 
-- FROM public.locations 
-- WHERE type IN ('FACILITY', 'RESTAURANT')
-- ORDER BY lat, lng;
