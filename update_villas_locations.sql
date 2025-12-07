-- SQL UPDATE statements to reorganize villa locations
-- Update lat and lng for VILLA type locations to group them together by series
-- Increased spacing between locations (0.0008-0.001 degrees = ~80-100 meters) for better user selection

-- ============================================
-- D-series Villas (Group 1: Top-left area)
-- ============================================
-- Base coordinates for D-series: 16.0550, 108.2015
-- Spacing: 0.0008 degrees (~88 meters) between each villa
UPDATE public.locations 
SET lat = 16.0550, lng = 108.2015
WHERE name = 'D01' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0558, lng = 108.2007
WHERE name = 'D03' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0566, lng = 108.1999
WHERE name = 'D04' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0574, lng = 108.1991
WHERE name = 'D05' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0582, lng = 108.1983
WHERE name = 'D06' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0590, lng = 108.1975
WHERE name = 'D07' AND type = 'VILLA';

-- ============================================
-- P-series Villas (Group 2: Top-right to mid area)
-- ============================================
-- P01, P06, P07: Top-right cluster
-- Spacing: 0.0008 degrees horizontally
UPDATE public.locations 
SET lat = 16.0565, lng = 108.2025
WHERE name = 'P01' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0565, lng = 108.2017
WHERE name = 'P06' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0565, lng = 108.2009
WHERE name = 'P07' AND type = 'VILLA';

-- P25-P32: Mid-left cluster
-- Spacing: 0.0008 degrees vertically
UPDATE public.locations 
SET lat = 16.0545, lng = 108.2018
WHERE name = 'P25' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0553, lng = 108.2018
WHERE name = 'P26' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0561, lng = 108.2018
WHERE name = 'P28' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0569, lng = 108.2018
WHERE name = 'P29' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0577, lng = 108.2018
WHERE name = 'P31' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0585, lng = 108.2018
WHERE name = 'P32' AND type = 'VILLA';

-- P34-P37: Bottom-left cluster
-- Spacing: 0.0008 degrees vertically
UPDATE public.locations 
SET lat = 16.0535, lng = 108.2005
WHERE name = 'P34' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0543, lng = 108.2005
WHERE name = 'P35' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0551, lng = 108.2005
WHERE name = 'P36' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0559, lng = 108.2005
WHERE name = 'P37' AND type = 'VILLA';

-- ============================================
-- R-series Rooms (Group 3: Mid to bottom area)
-- ============================================
-- R01-R02: Top cluster
-- Spacing: 0.0008 degrees horizontally
UPDATE public.locations 
SET lat = 16.0560, lng = 108.2010
WHERE name = 'R01' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0560, lng = 108.2002
WHERE name = 'R02' AND type = 'VILLA';

-- R05, R08, R11: Mid-top cluster
-- Spacing: 0.0008 degrees horizontally
UPDATE public.locations 
SET lat = 16.0555, lng = 108.2000
WHERE name = 'R05' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0555, lng = 108.1992
WHERE name = 'R08' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0555, lng = 108.1984
WHERE name = 'R11' AND type = 'VILLA';

-- R16-R20: Mid cluster
-- Spacing: 0.0008 degrees vertically
UPDATE public.locations 
SET lat = 16.0540, lng = 108.1990
WHERE name = 'R16' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0548, lng = 108.1990
WHERE name = 'R17' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0556, lng = 108.1990
WHERE name = 'R18' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0564, lng = 108.1990
WHERE name = 'R19' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0572, lng = 108.1990
WHERE name = 'R20' AND type = 'VILLA';

-- R23-R27: Mid-bottom cluster
-- Spacing: 0.0008 degrees vertically
UPDATE public.locations 
SET lat = 16.0535, lng = 108.1975
WHERE name = 'R23' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0543, lng = 108.1975
WHERE name = 'R24' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0551, lng = 108.1975
WHERE name = 'R25' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0559, lng = 108.1975
WHERE name = 'R27' AND type = 'VILLA';

-- R31-R36: Bottom cluster
-- Spacing: 0.0008 degrees vertically
UPDATE public.locations 
SET lat = 16.0525, lng = 108.1965
WHERE name = 'R31' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0533, lng = 108.1965
WHERE name = 'R32' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0541, lng = 108.1965
WHERE name = 'R33' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0549, lng = 108.1965
WHERE name = 'R34' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0557, lng = 108.1965
WHERE name = 'R35' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0565, lng = 108.1965
WHERE name = 'R36' AND type = 'VILLA';

-- R39-R45: Bottom-right cluster (CRITICAL: This is the most crowded cluster)
-- Spacing: 0.001 degrees vertically (~110 meters) for better separation
UPDATE public.locations 
SET lat = 16.0520, lng = 108.1950
WHERE name = 'R39' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0530, lng = 108.1950
WHERE name = 'R40' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0540, lng = 108.1950
WHERE name = 'R41' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0550, lng = 108.1950
WHERE name = 'R42' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0560, lng = 108.1950
WHERE name = 'R43' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0570, lng = 108.1950
WHERE name = 'R45' AND type = 'VILLA';

-- ============================================
-- S-series Villas (Group 4: Bottom area)
-- ============================================
-- S01-S08: Bottom-right cluster (CRITICAL: Very crowded cluster)
-- Spacing: 0.001 degrees vertically (~110 meters) for better separation
UPDATE public.locations 
SET lat = 16.0515, lng = 108.1935
WHERE name = 'S01' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0525, lng = 108.1935
WHERE name = 'S02' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0535, lng = 108.1935
WHERE name = 'S03' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0545, lng = 108.1935
WHERE name = 'S04' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0555, lng = 108.1935
WHERE name = 'S05' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0565, lng = 108.1935
WHERE name = 'S06' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0575, lng = 108.1935
WHERE name = 'S07' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0585, lng = 108.1935
WHERE name = 'S08' AND type = 'VILLA';

-- S19-S26: Bottom-center cluster (CRITICAL: Very crowded cluster)
-- Spacing: 0.001 degrees vertically (~110 meters) for better separation
UPDATE public.locations 
SET lat = 16.0510, lng = 108.1920
WHERE name = 'S19' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0520, lng = 108.1920
WHERE name = 'S20' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0530, lng = 108.1920
WHERE name = 'S21' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0540, lng = 108.1920
WHERE name = 'S22' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0550, lng = 108.1920
WHERE name = 'S23' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0560, lng = 108.1920
WHERE name = 'S24' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0570, lng = 108.1920
WHERE name = 'S25' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0580, lng = 108.1920
WHERE name = 'S26' AND type = 'VILLA';

-- S33-S40: Bottom-left cluster (CRITICAL: Very crowded cluster)
-- Spacing: 0.001 degrees vertically (~110 meters) for better separation
UPDATE public.locations 
SET lat = 16.0500, lng = 108.1900
WHERE name = 'S33' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0510, lng = 108.1900
WHERE name = 'S34' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0520, lng = 108.1900
WHERE name = 'S35' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0530, lng = 108.1900
WHERE name = 'S36' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0540, lng = 108.1900
WHERE name = 'S37' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0550, lng = 108.1900
WHERE name = 'S38' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0560, lng = 108.1900
WHERE name = 'S39' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0570, lng = 108.1900
WHERE name = 'S40' AND type = 'VILLA';

-- S43-S48: Very bottom cluster
-- Spacing: 0.0008 degrees vertically
UPDATE public.locations 
SET lat = 16.0495, lng = 108.1880
WHERE name = 'S43' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0503, lng = 108.1880
WHERE name = 'S44' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0511, lng = 108.1880
WHERE name = 'S45' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0519, lng = 108.1880
WHERE name = 'S46' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0527, lng = 108.1880
WHERE name = 'S47' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0535, lng = 108.1880
WHERE name = 'S48' AND type = 'VILLA';

-- ============================================
-- Q-series Villas (Group 5: Very bottom area)
-- ============================================
-- Spacing: 0.0008 degrees horizontally
UPDATE public.locations 
SET lat = 16.0490, lng = 108.1865
WHERE name = 'Q5' AND type = 'VILLA';

UPDATE public.locations 
SET lat = 16.0490, lng = 108.1857
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



