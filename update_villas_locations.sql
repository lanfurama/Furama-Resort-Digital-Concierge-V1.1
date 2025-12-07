-- SQL UPDATE statements to reorganize villa locations
-- All villas arranged in neat clusters, grouped by series
-- Increased spacing between locations (0.0008-0.001 degrees = ~80-100 meters) for better user selection

-- ============================================
-- D-series Villas (North cluster, near beach)
-- ============================================
-- D-series: Arranged in a neat horizontal row, north area
-- Spacing: 0.0008 degrees (~88 meters) between each villa
UPDATE public.locations 
SET lat = 16.0565, lng = 108.1990
WHERE name = 'D01' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0565, lng = 108.1998
WHERE name = 'D03' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0565, lng = 108.2006
WHERE name = 'D04' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0565, lng = 108.2014
WHERE name = 'D05' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0565, lng = 108.2022
WHERE name = 'D06' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0565, lng = 108.2030
WHERE name = 'D07' AND type = 'VILLA';

-- ============================================
-- P-series Villas (Multiple clusters around center)
-- ============================================
-- P01, P06, P07: Northeast cluster
-- Spacing: 0.0008 degrees
UPDATE public.locations 
SET lat = 16.0555, lng = 108.2015
WHERE name = 'P01' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0555, lng = 108.2023
WHERE name = 'P06' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0555, lng = 108.2031
WHERE name = 'P07' AND type = 'VILLA';

-- P25-P32: Central cluster (inner ring)
-- Arranged in a neat vertical column
UPDATE public.locations 
SET lat = 16.0530, lng = 108.1995
WHERE name = 'P25' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0538, lng = 108.1995
WHERE name = 'P26' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0546, lng = 108.1995
WHERE name = 'P28' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0554, lng = 108.1995
WHERE name = 'P29' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0562, lng = 108.1995
WHERE name = 'P31' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0570, lng = 108.1995
WHERE name = 'P32' AND type = 'VILLA';

-- P34-P37: South-central cluster
-- Spacing: 0.0008 degrees vertically
UPDATE public.locations 
SET lat = 16.0520, lng = 108.2000
WHERE name = 'P34' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0528, lng = 108.2000
WHERE name = 'P35' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0536, lng = 108.2000
WHERE name = 'P36' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0544, lng = 108.2000
WHERE name = 'P37' AND type = 'VILLA';

-- ============================================
-- R-series Rooms (Central to south clusters)
-- ============================================
-- R01-R02: North-central cluster
-- Spacing: 0.0008 degrees horizontally
UPDATE public.locations 
SET lat = 16.0545, lng = 108.2005
WHERE name = 'R01' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0545, lng = 108.2013
WHERE name = 'R02' AND type = 'VILLA';

-- R05, R08, R11: East cluster
-- Spacing: 0.0008 degrees horizontally
UPDATE public.locations 
SET lat = 16.0535, lng = 108.2015
WHERE name = 'R05' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0535, lng = 108.2023
WHERE name = 'R08' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0535, lng = 108.2031
WHERE name = 'R11' AND type = 'VILLA';

-- R16-R20: Central-south cluster
-- Spacing: 0.0008 degrees vertically
UPDATE public.locations 
SET lat = 16.0520, lng = 108.2005
WHERE name = 'R16' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0528, lng = 108.2005
WHERE name = 'R17' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0536, lng = 108.2005
WHERE name = 'R18' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0544, lng = 108.2005
WHERE name = 'R19' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0552, lng = 108.2005
WHERE name = 'R20' AND type = 'VILLA';

-- R23-R27: Southwest cluster
-- Spacing: 0.0008 degrees vertically
UPDATE public.locations 
SET lat = 16.0515, lng = 108.1990
WHERE name = 'R23' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0523, lng = 108.1990
WHERE name = 'R24' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0531, lng = 108.1990
WHERE name = 'R25' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0539, lng = 108.1990
WHERE name = 'R27' AND type = 'VILLA';

-- R31-R36: South cluster
-- Spacing: 0.0008 degrees vertically
UPDATE public.locations 
SET lat = 16.0510, lng = 108.2000
WHERE name = 'R31' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0518, lng = 108.2000
WHERE name = 'R32' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0526, lng = 108.2000
WHERE name = 'R33' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0534, lng = 108.2000
WHERE name = 'R34' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0542, lng = 108.2000
WHERE name = 'R35' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0550, lng = 108.2000
WHERE name = 'R36' AND type = 'VILLA';

-- R39-R45: South cluster (CRITICAL: crowded cluster)
-- Spacing: 0.001 degrees vertically (~110 meters) for better separation
UPDATE public.locations 
SET lat = 16.0500, lng = 108.1995
WHERE name = 'R39' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0510, lng = 108.1995
WHERE name = 'R40' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0520, lng = 108.1995
WHERE name = 'R41' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0530, lng = 108.1995
WHERE name = 'R42' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0540, lng = 108.1995
WHERE name = 'R43' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0550, lng = 108.1995
WHERE name = 'R45' AND type = 'VILLA';

-- ============================================
-- S-series Villas (South clusters)
-- ============================================
-- S01-S08: South cluster (CRITICAL: crowded cluster)
-- Spacing: 0.001 degrees vertically (~110 meters) for better separation
UPDATE public.locations 
SET lat = 16.0500, lng = 108.2000
WHERE name = 'S01' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0510, lng = 108.2000
WHERE name = 'S02' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0520, lng = 108.2000
WHERE name = 'S03' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0530, lng = 108.2000
WHERE name = 'S04' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0540, lng = 108.2000
WHERE name = 'S05' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0550, lng = 108.2000
WHERE name = 'S06' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0560, lng = 108.2000
WHERE name = 'S07' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0570, lng = 108.2000
WHERE name = 'S08' AND type = 'VILLA';

-- S19-S26: Southwest cluster (CRITICAL: crowded cluster)
-- Spacing: 0.001 degrees vertically (~110 meters) for better separation
UPDATE public.locations 
SET lat = 16.0500, lng = 108.1985
WHERE name = 'S19' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0510, lng = 108.1985
WHERE name = 'S20' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0520, lng = 108.1985
WHERE name = 'S21' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0530, lng = 108.1985
WHERE name = 'S22' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0540, lng = 108.1985
WHERE name = 'S23' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0550, lng = 108.1985
WHERE name = 'S24' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0560, lng = 108.1985
WHERE name = 'S25' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0570, lng = 108.1985
WHERE name = 'S26' AND type = 'VILLA';

-- S33-S40: South cluster (CRITICAL: crowded cluster)
-- Spacing: 0.001 degrees vertically (~110 meters) for better separation
UPDATE public.locations 
SET lat = 16.0500, lng = 108.1980
WHERE name = 'S33' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0510, lng = 108.1980
WHERE name = 'S34' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0520, lng = 108.1980
WHERE name = 'S35' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0530, lng = 108.1980
WHERE name = 'S36' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0540, lng = 108.1980
WHERE name = 'S37' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0550, lng = 108.1980
WHERE name = 'S38' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0560, lng = 108.1980
WHERE name = 'S39' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0570, lng = 108.1980
WHERE name = 'S40' AND type = 'VILLA';

-- S43-S48: Far south cluster
-- Spacing: 0.0008 degrees vertically
UPDATE public.locations 
SET lat = 16.0495, lng = 108.1975
WHERE name = 'S43' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0503, lng = 108.1975
WHERE name = 'S44' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0511, lng = 108.1975
WHERE name = 'S45' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0519, lng = 108.1975
WHERE name = 'S46' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0527, lng = 108.1975
WHERE name = 'S47' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0535, lng = 108.1975
WHERE name = 'S48' AND type = 'VILLA';

-- ============================================
-- Q-series Villas (Southwest, outermost)
-- ============================================
-- Spacing: 0.0008 degrees horizontally
UPDATE public.locations 
SET lat = 16.0490, lng = 108.1970
WHERE name = 'Q5' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0490, lng = 108.1978
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
