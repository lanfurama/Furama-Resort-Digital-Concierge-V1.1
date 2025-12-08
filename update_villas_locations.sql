-- SQL UPDATE statements to reorganize villa locations
-- All villas arranged in a neat grid layout, evenly spaced for better visualization
-- Grid spacing: 0.002 degrees (~222 meters) for easier clicking and selection

-- ============================================
-- D-series Villas (Top row, horizontal)
-- ============================================
-- D-series: Arranged in a neat horizontal row at the top
-- Spacing: 0.002 degrees between each villa
UPDATE public.locations 
SET lat = 16.0570, lng = 108.1980
WHERE name = 'D01' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0570, lng = 108.2000
WHERE name = 'D03' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0570, lng = 108.2020
WHERE name = 'D04' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0570, lng = 108.1980
WHERE name = 'D05' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0570, lng = 108.2000
WHERE name = 'D06' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0570, lng = 108.2020
WHERE name = 'D07' AND type = 'VILLA';

-- ============================================
-- P-series Villas (Multiple rows)
-- ============================================
-- P01, P06, P07: Top row
UPDATE public.locations 
SET lat = 16.0560, lng = 108.2000
WHERE name = 'P01' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0560, lng = 108.2020
WHERE name = 'P06' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0560, lng = 108.2000
WHERE name = 'P07' AND type = 'VILLA';

-- P25-P32: Second row (vertical column)
UPDATE public.locations 
SET lat = 16.0550, lng = 108.1980
WHERE name = 'P25' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0550, lng = 108.2000
WHERE name = 'P26' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0550, lng = 108.2020
WHERE name = 'P28' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0550, lng = 108.1980
WHERE name = 'P29' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0550, lng = 108.2000
WHERE name = 'P31' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0550, lng = 108.2020
WHERE name = 'P32' AND type = 'VILLA';

-- P34-P37: Third row
UPDATE public.locations 
SET lat = 16.0540, lng = 108.2000
WHERE name = 'P34' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0540, lng = 108.2020
WHERE name = 'P35' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0540, lng = 108.1980
WHERE name = 'P36' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0540, lng = 108.2000
WHERE name = 'P37' AND type = 'VILLA';

-- ============================================
-- R-series Villas (Multiple rows)
-- ============================================
-- R01-R02: Fourth row
UPDATE public.locations 
SET lat = 16.0530, lng = 108.2000
WHERE name = 'R01' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0530, lng = 108.2020
WHERE name = 'R02' AND type = 'VILLA';

-- R05, R08, R11: Fourth row (extended)
UPDATE public.locations 
SET lat = 16.0530, lng = 108.1980
WHERE name = 'R05' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0530, lng = 108.2000
WHERE name = 'R08' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0530, lng = 108.2020
WHERE name = 'R11' AND type = 'VILLA';

-- R16-R20: Fifth row
UPDATE public.locations 
SET lat = 16.0520, lng = 108.2000
WHERE name = 'R16' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0520, lng = 108.2020
WHERE name = 'R17' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0520, lng = 108.1980
WHERE name = 'R18' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0520, lng = 108.2000
WHERE name = 'R19' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0520, lng = 108.2020
WHERE name = 'R20' AND type = 'VILLA';

-- R23-R27: Sixth row
UPDATE public.locations 
SET lat = 16.0510, lng = 108.1980
WHERE name = 'R23' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0510, lng = 108.2000
WHERE name = 'R24' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0510, lng = 108.2020
WHERE name = 'R25' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0510, lng = 108.1980
WHERE name = 'R27' AND type = 'VILLA';

-- R31-R36: Seventh row
UPDATE public.locations 
SET lat = 16.0500, lng = 108.2000
WHERE name = 'R31' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0500, lng = 108.2020
WHERE name = 'R32' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0500, lng = 108.1980
WHERE name = 'R33' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0500, lng = 108.2000
WHERE name = 'R34' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0500, lng = 108.2020
WHERE name = 'R35' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0500, lng = 108.1980
WHERE name = 'R36' AND type = 'VILLA';

-- R39-R45: Eighth row
UPDATE public.locations 
SET lat = 16.0490, lng = 108.1980
WHERE name = 'R39' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0490, lng = 108.2000
WHERE name = 'R40' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0490, lng = 108.2020
WHERE name = 'R41' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0490, lng = 108.1980
WHERE name = 'R42' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0490, lng = 108.2000
WHERE name = 'R43' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0490, lng = 108.2020
WHERE name = 'R45' AND type = 'VILLA';

-- ============================================
-- S-series Villas (Bottom rows)
-- ============================================
-- S01-S08: Ninth row
UPDATE public.locations 
SET lat = 16.0485, lng = 108.2000
WHERE name = 'S01' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0485, lng = 108.2020
WHERE name = 'S02' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0485, lng = 108.1980
WHERE name = 'S03' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0485, lng = 108.2000
WHERE name = 'S04' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0485, lng = 108.2020
WHERE name = 'S05' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0485, lng = 108.1980
WHERE name = 'S06' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0485, lng = 108.2000
WHERE name = 'S07' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0485, lng = 108.2020
WHERE name = 'S08' AND type = 'VILLA';

-- S19-S26: Tenth row
UPDATE public.locations 
SET lat = 16.0480, lng = 108.1980
WHERE name = 'S19' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0480, lng = 108.2000
WHERE name = 'S20' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0480, lng = 108.2020
WHERE name = 'S21' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0480, lng = 108.1980
WHERE name = 'S22' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0480, lng = 108.2000
WHERE name = 'S23' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0480, lng = 108.2020
WHERE name = 'S24' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0480, lng = 108.1980
WHERE name = 'S25' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0480, lng = 108.2000
WHERE name = 'S26' AND type = 'VILLA';

-- S33-S40: Eleventh row
UPDATE public.locations 
SET lat = 16.0485, lng = 108.2000
WHERE name = 'S33' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0485, lng = 108.2020
WHERE name = 'S34' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0485, lng = 108.1980
WHERE name = 'S35' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0485, lng = 108.2000
WHERE name = 'S36' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0485, lng = 108.2020
WHERE name = 'S37' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0485, lng = 108.1980
WHERE name = 'S38' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0485, lng = 108.2000
WHERE name = 'S39' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0485, lng = 108.2020
WHERE name = 'S40' AND type = 'VILLA';

-- S43-S48: Twelfth row
UPDATE public.locations 
SET lat = 16.0480, lng = 108.2000
WHERE name = 'S43' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0480, lng = 108.2020
WHERE name = 'S44' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0480, lng = 108.1980
WHERE name = 'S45' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0480, lng = 108.2000
WHERE name = 'S46' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0480, lng = 108.2020
WHERE name = 'S47' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0480, lng = 108.1980
WHERE name = 'S48' AND type = 'VILLA';

-- ============================================
-- Q-series Villas (Bottom left)
-- ============================================
UPDATE public.locations 
SET lat = 16.0480, lng = 108.1980
WHERE name = 'Q5' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0480, lng = 108.1960
WHERE name = 'Q6' AND type = 'VILLA';

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify all villa locations are updated:
-- SELECT name, lat, lng, type 
-- FROM public.locations 
-- WHERE type = 'VILLA' 
-- ORDER BY 
--   CASE 
--     WHEN name LIKE 'D%' THEN 1
--     WHEN name LIKE 'P%' THEN 2
--     WHEN name LIKE 'R%' THEN 3
--     WHEN name LIKE 'S%' THEN 4
--     WHEN name LIKE 'Q%' THEN 5
--     ELSE 6
--   END,
--   name;
