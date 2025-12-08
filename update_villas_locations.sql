-- SQL UPDATE statements for Villas
-- Arranged in a very compact square grid, ordered by name (alphabetically)
-- All 77 villas grouped tightly together in one small square block
-- Grid: 9 columns × 9 rows (77 villas total)

-- ============================================
-- VILLAS - Very Compact Square Grid Layout
-- ============================================
-- Starting position: 16.0400, 108.2000
-- Spacing: 0.0005 degrees (very tight, close together)
-- All villas sorted: D → P → Q → R → S (within each series, sorted by number)

-- Row 1 (9 villas: D01-D07, P01, P06)
UPDATE public.locations SET lat = 16.0400, lng = 108.2000 WHERE name = 'D01' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0400, lng = 108.2005 WHERE name = 'D03' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0400, lng = 108.2010 WHERE name = 'D04' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0400, lng = 108.2015 WHERE name = 'D05' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0400, lng = 108.2020 WHERE name = 'D06' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0400, lng = 108.2025 WHERE name = 'D07' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0400, lng = 108.2030 WHERE name = 'P01' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0400, lng = 108.2035 WHERE name = 'P06' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0400, lng = 108.2040 WHERE name = 'P07' AND type = 'VILLA';

-- Row 2 (9 villas: P25-P36)
UPDATE public.locations SET lat = 16.0405, lng = 108.2000 WHERE name = 'P25' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0405, lng = 108.2005 WHERE name = 'P26' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0405, lng = 108.2010 WHERE name = 'P28' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0405, lng = 108.2015 WHERE name = 'P29' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0405, lng = 108.2020 WHERE name = 'P31' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0405, lng = 108.2025 WHERE name = 'P32' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0405, lng = 108.2030 WHERE name = 'P34' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0405, lng = 108.2035 WHERE name = 'P35' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0405, lng = 108.2040 WHERE name = 'P36' AND type = 'VILLA';

-- Row 3 (9 villas: P37, Q5-Q6, R01-R05)
UPDATE public.locations SET lat = 16.0410, lng = 108.2000 WHERE name = 'P37' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0410, lng = 108.2005 WHERE name = 'Q5' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0410, lng = 108.2010 WHERE name = 'Q6' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0410, lng = 108.2015 WHERE name = 'R01' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0410, lng = 108.2020 WHERE name = 'R02' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0410, lng = 108.2025 WHERE name = 'R05' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0410, lng = 108.2030 WHERE name = 'R08' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0410, lng = 108.2035 WHERE name = 'R11' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0410, lng = 108.2040 WHERE name = 'R16' AND type = 'VILLA';

-- Row 4 (9 villas: R17-R31)
UPDATE public.locations SET lat = 16.0415, lng = 108.2000 WHERE name = 'R17' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0415, lng = 108.2005 WHERE name = 'R18' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0415, lng = 108.2010 WHERE name = 'R19' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0415, lng = 108.2015 WHERE name = 'R20' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0415, lng = 108.2020 WHERE name = 'R23' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0415, lng = 108.2025 WHERE name = 'R24' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0415, lng = 108.2030 WHERE name = 'R25' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0415, lng = 108.2035 WHERE name = 'R27' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0415, lng = 108.2040 WHERE name = 'R31' AND type = 'VILLA';

-- Row 5 (9 villas: R32-R42)
UPDATE public.locations SET lat = 16.0420, lng = 108.2000 WHERE name = 'R32' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0420, lng = 108.2005 WHERE name = 'R33' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0420, lng = 108.2010 WHERE name = 'R34' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0420, lng = 108.2015 WHERE name = 'R35' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0420, lng = 108.2020 WHERE name = 'R36' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0420, lng = 108.2025 WHERE name = 'R39' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0420, lng = 108.2030 WHERE name = 'R40' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0420, lng = 108.2035 WHERE name = 'R41' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0420, lng = 108.2040 WHERE name = 'R42' AND type = 'VILLA';

-- Row 6 (9 villas: R43-R45, S01-S05)
UPDATE public.locations SET lat = 16.0425, lng = 108.2000 WHERE name = 'R43' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0425, lng = 108.2005 WHERE name = 'R45' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0425, lng = 108.2010 WHERE name = 'S01' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0425, lng = 108.2015 WHERE name = 'S02' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0425, lng = 108.2020 WHERE name = 'S03' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0425, lng = 108.2025 WHERE name = 'S04' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0425, lng = 108.2030 WHERE name = 'S05' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0425, lng = 108.2035 WHERE name = 'S06' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0425, lng = 108.2040 WHERE name = 'S07' AND type = 'VILLA';

-- Row 7 (9 villas: S08, S19-S26)
UPDATE public.locations SET lat = 16.0430, lng = 108.2000 WHERE name = 'S08' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0430, lng = 108.2005 WHERE name = 'S19' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0430, lng = 108.2010 WHERE name = 'S20' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0430, lng = 108.2015 WHERE name = 'S21' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0430, lng = 108.2020 WHERE name = 'S22' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0430, lng = 108.2025 WHERE name = 'S23' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0430, lng = 108.2030 WHERE name = 'S24' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0430, lng = 108.2035 WHERE name = 'S25' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0430, lng = 108.2040 WHERE name = 'S26' AND type = 'VILLA';

-- Row 8 (9 villas: S33-S43)
UPDATE public.locations SET lat = 16.0435, lng = 108.2000 WHERE name = 'S33' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0435, lng = 108.2005 WHERE name = 'S34' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0435, lng = 108.2010 WHERE name = 'S35' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0435, lng = 108.2015 WHERE name = 'S36' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0435, lng = 108.2020 WHERE name = 'S37' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0435, lng = 108.2025 WHERE name = 'S38' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0435, lng = 108.2030 WHERE name = 'S39' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0435, lng = 108.2035 WHERE name = 'S40' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0435, lng = 108.2040 WHERE name = 'S43' AND type = 'VILLA';

-- Row 9 (5 villas: S44-S48 - last row)
UPDATE public.locations SET lat = 16.0440, lng = 108.2000 WHERE name = 'S44' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0440, lng = 108.2005 WHERE name = 'S45' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0440, lng = 108.2010 WHERE name = 'S46' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0440, lng = 108.2015 WHERE name = 'S47' AND type = 'VILLA';
UPDATE public.locations SET lat = 16.0440, lng = 108.2020 WHERE name = 'S48' AND type = 'VILLA';

-- ============================================
-- Verification Query
-- ============================================
-- SELECT name, lat, lng, type 
-- FROM public.locations 
-- WHERE type = 'VILLA' 
-- ORDER BY lat, lng;
