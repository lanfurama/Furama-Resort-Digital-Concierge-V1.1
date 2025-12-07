-- SQL UPDATE statements to set locations for Facilities and Restaurants
-- Based on villa locations from update_villas_locations.sql
-- Villas range: lat 16.0490-16.0569, lng 108.1863-108.2025

-- ============================================
-- FACILITIES AND RESTAURANTS
-- ============================================

-- Furama Villas Reception: Near center of villa clusters (P-series and R-series area)
-- Positioned to be easily accessible from all villa groups
UPDATE public.locations 
SET lat = 16.0535, lng = 108.1980
WHERE name = 'Furama Villas Reception' AND type = 'FACILITY';

-- Main Lobby: Central location, easily accessible from all areas
-- Positioned near top-center area, close to P-series villas
UPDATE public.locations 
SET lat = 16.0545, lng = 108.2010
WHERE name = 'Main Lobby' AND type = 'FACILITY';

-- Ocean Pool: Near the ocean, east side (higher longitude)
-- Positioned near top-right area, close to P01, P06, P07 villas
UPDATE public.locations 
SET lat = 16.0555, lng = 108.2028
WHERE name = 'Ocean Pool' AND type = 'FACILITY';

-- Lagoon Pool: Near the ocean but lower than Ocean Pool
-- Positioned near D-series villas area
UPDATE public.locations 
SET lat = 16.0530, lng = 108.2015
WHERE name = 'Lagoon Pool' AND type = 'FACILITY';

-- Don Cipriani's Italian Restaurant: Near Main Lobby for easy access
-- Positioned close to Main Lobby and P-series villas
UPDATE public.locations 
SET lat = 16.0548, lng = 108.2012
WHERE name = 'Don Cipriani''s Italian Restaurant' AND type = 'RESTAURANT';

-- Furama Resort Danang: Main resort center/reception
-- Positioned near Main Lobby as the central point
UPDATE public.locations 
SET lat = 16.0544, lng = 108.2010
WHERE name = 'Furama Resort Danang' AND type = 'FACILITY';

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify all facility locations are updated:
-- SELECT name, lat, lng, type 
-- FROM public.locations 
-- WHERE type IN ('FACILITY', 'RESTAURANT')
-- ORDER BY type, name;

