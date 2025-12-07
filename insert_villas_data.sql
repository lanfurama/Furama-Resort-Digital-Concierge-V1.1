-- SQL INSERT statements for Villas Locations, Room Types, and Rooms
-- Based on Furama Resort villa data from images

-- ============================================
-- 1. INSERT LOCATIONS (Villas)
-- ============================================
-- Base coordinates for Furama Resort Danang: approximately 16.0544°N, 108.2022°E
-- Coordinates are approximate based on villa positions on the map

-- D-series Villas (top-left curved section)
INSERT INTO public.locations (lat, lng, name, type) 
SELECT * FROM (VALUES
(16.0550::numeric, 108.2015::numeric, 'D01'::varchar, 'VILLA'::location_type),
(16.0552::numeric, 108.2013::numeric, 'D03'::varchar, 'VILLA'::location_type),
(16.0554::numeric, 108.2011::numeric, 'D04'::varchar, 'VILLA'::location_type),
(16.0556::numeric, 108.2009::numeric, 'D05'::varchar, 'VILLA'::location_type),
(16.0558::numeric, 108.2007::numeric, 'D06'::varchar, 'VILLA'::location_type),
(16.0560::numeric, 108.2005::numeric, 'D07'::varchar, 'VILLA'::location_type)
) AS v(lat, lng, name, type)
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE locations.name = v.name);

-- P-series Villas
INSERT INTO public.locations (lat, lng, name, type) 
SELECT * FROM (VALUES
(16.0565::numeric, 108.2025::numeric, 'P01'::varchar, 'VILLA'::location_type),
(16.0567::numeric, 108.2023::numeric, 'P06'::varchar, 'VILLA'::location_type),
(16.0569::numeric, 108.2021::numeric, 'P07'::varchar, 'VILLA'::location_type),
(16.0545::numeric, 108.2018::numeric, 'P25'::varchar, 'VILLA'::location_type),
(16.0547::numeric, 108.2016::numeric, 'P26'::varchar, 'VILLA'::location_type),
(16.0549::numeric, 108.2014::numeric, 'P28'::varchar, 'VILLA'::location_type),
(16.0551::numeric, 108.2012::numeric, 'P29'::varchar, 'VILLA'::location_type),
(16.0553::numeric, 108.2010::numeric, 'P31'::varchar, 'VILLA'::location_type),
(16.0555::numeric, 108.2008::numeric, 'P32'::varchar, 'VILLA'::location_type),
(16.0535::numeric, 108.2005::numeric, 'P34'::varchar, 'VILLA'::location_type),
(16.0537::numeric, 108.2003::numeric, 'P35'::varchar, 'VILLA'::location_type),
(16.0539::numeric, 108.2001::numeric, 'P36'::varchar, 'VILLA'::location_type),
(16.0541::numeric, 108.1999::numeric, 'P37'::varchar, 'VILLA'::location_type)
) AS v(lat, lng, name, type)
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE locations.name = v.name);

-- R-series Rooms
INSERT INTO public.locations (lat, lng, name, type) 
SELECT * FROM (VALUES
(16.0560::numeric, 108.2010::numeric, 'R01'::varchar, 'VILLA'::location_type),
(16.0562::numeric, 108.2008::numeric, 'R02'::varchar, 'VILLA'::location_type),
(16.0555::numeric, 108.2000::numeric, 'R05'::varchar, 'VILLA'::location_type),
(16.0557::numeric, 108.1998::numeric, 'R08'::varchar, 'VILLA'::location_type),
(16.0559::numeric, 108.1996::numeric, 'R11'::varchar, 'VILLA'::location_type),
(16.0540::numeric, 108.1990::numeric, 'R16'::varchar, 'VILLA'::location_type),
(16.0542::numeric, 108.1988::numeric, 'R17'::varchar, 'VILLA'::location_type),
(16.0544::numeric, 108.1986::numeric, 'R18'::varchar, 'VILLA'::location_type),
(16.0546::numeric, 108.1984::numeric, 'R19'::varchar, 'VILLA'::location_type),
(16.0548::numeric, 108.1982::numeric, 'R20'::varchar, 'VILLA'::location_type),
(16.0535::numeric, 108.1975::numeric, 'R23'::varchar, 'VILLA'::location_type),
(16.0537::numeric, 108.1973::numeric, 'R24'::varchar, 'VILLA'::location_type),
(16.0539::numeric, 108.1971::numeric, 'R25'::varchar, 'VILLA'::location_type),
(16.0541::numeric, 108.1969::numeric, 'R27'::varchar, 'VILLA'::location_type),
(16.0525::numeric, 108.1965::numeric, 'R31'::varchar, 'VILLA'::location_type),
(16.0527::numeric, 108.1963::numeric, 'R32'::varchar, 'VILLA'::location_type),
(16.0529::numeric, 108.1961::numeric, 'R33'::varchar, 'VILLA'::location_type),
(16.0531::numeric, 108.1959::numeric, 'R34'::varchar, 'VILLA'::location_type),
(16.0533::numeric, 108.1957::numeric, 'R35'::varchar, 'VILLA'::location_type),
(16.0535::numeric, 108.1955::numeric, 'R36'::varchar, 'VILLA'::location_type),
(16.0520::numeric, 108.1950::numeric, 'R39'::varchar, 'VILLA'::location_type),
(16.0522::numeric, 108.1948::numeric, 'R40'::varchar, 'VILLA'::location_type),
(16.0524::numeric, 108.1946::numeric, 'R41'::varchar, 'VILLA'::location_type),
(16.0526::numeric, 108.1944::numeric, 'R42'::varchar, 'VILLA'::location_type),
(16.0528::numeric, 108.1942::numeric, 'R43'::varchar, 'VILLA'::location_type),
(16.0530::numeric, 108.1940::numeric, 'R45'::varchar, 'VILLA'::location_type)
) AS v(lat, lng, name, type)
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE locations.name = v.name);

-- S-series Villas
INSERT INTO public.locations (lat, lng, name, type) 
SELECT * FROM (VALUES
(16.0515::numeric, 108.1935::numeric, 'S01'::varchar, 'VILLA'::location_type),
(16.0517::numeric, 108.1933::numeric, 'S02'::varchar, 'VILLA'::location_type),
(16.0519::numeric, 108.1931::numeric, 'S03'::varchar, 'VILLA'::location_type),
(16.0521::numeric, 108.1929::numeric, 'S04'::varchar, 'VILLA'::location_type),
(16.0523::numeric, 108.1927::numeric, 'S05'::varchar, 'VILLA'::location_type),
(16.0525::numeric, 108.1925::numeric, 'S06'::varchar, 'VILLA'::location_type),
(16.0527::numeric, 108.1923::numeric, 'S07'::varchar, 'VILLA'::location_type),
(16.0529::numeric, 108.1921::numeric, 'S08'::varchar, 'VILLA'::location_type),
(16.0510::numeric, 108.1920::numeric, 'S19'::varchar, 'VILLA'::location_type),
(16.0512::numeric, 108.1918::numeric, 'S20'::varchar, 'VILLA'::location_type),
(16.0505::numeric, 108.1915::numeric, 'S21'::varchar, 'VILLA'::location_type),
(16.0507::numeric, 108.1913::numeric, 'S22'::varchar, 'VILLA'::location_type),
(16.0509::numeric, 108.1911::numeric, 'S23'::varchar, 'VILLA'::location_type),
(16.0511::numeric, 108.1909::numeric, 'S24'::varchar, 'VILLA'::location_type),
(16.0513::numeric, 108.1907::numeric, 'S25'::varchar, 'VILLA'::location_type),
(16.0515::numeric, 108.1905::numeric, 'S26'::varchar, 'VILLA'::location_type),
(16.0500::numeric, 108.1900::numeric, 'S33'::varchar, 'VILLA'::location_type),
(16.0502::numeric, 108.1898::numeric, 'S34'::varchar, 'VILLA'::location_type),
(16.0504::numeric, 108.1896::numeric, 'S35'::varchar, 'VILLA'::location_type),
(16.0506::numeric, 108.1894::numeric, 'S36'::varchar, 'VILLA'::location_type),
(16.0508::numeric, 108.1892::numeric, 'S37'::varchar, 'VILLA'::location_type),
(16.0510::numeric, 108.1890::numeric, 'S38'::varchar, 'VILLA'::location_type),
(16.0512::numeric, 108.1888::numeric, 'S39'::varchar, 'VILLA'::location_type),
(16.0514::numeric, 108.1886::numeric, 'S40'::varchar, 'VILLA'::location_type),
(16.0495::numeric, 108.1880::numeric, 'S43'::varchar, 'VILLA'::location_type),
(16.0497::numeric, 108.1878::numeric, 'S44'::varchar, 'VILLA'::location_type),
(16.0499::numeric, 108.1876::numeric, 'S45'::varchar, 'VILLA'::location_type),
(16.0501::numeric, 108.1874::numeric, 'S46'::varchar, 'VILLA'::location_type),
(16.0503::numeric, 108.1872::numeric, 'S47'::varchar, 'VILLA'::location_type),
(16.0505::numeric, 108.1870::numeric, 'S48'::varchar, 'VILLA'::location_type)
) AS v(lat, lng, name, type)
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE locations.name = v.name);

-- Q-series Villas
INSERT INTO public.locations (lat, lng, name, type) 
SELECT * FROM (VALUES
(16.0490::numeric, 108.1865::numeric, 'Q5'::varchar, 'VILLA'::location_type),
(16.0492::numeric, 108.1863::numeric, 'Q6'::varchar, 'VILLA'::location_type)
) AS v(lat, lng, name, type)
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE locations.name = v.name);

-- Reset sequence for locations
SELECT setval('public.locations_id_seq', (SELECT MAX(id) FROM public.locations));

-- ============================================
-- 2. INSERT ROOM_TYPES
-- ============================================
-- Create room types for each villa series based on bed configurations

-- D-series Villa Type (4 King Beds in BR2)
INSERT INTO public.room_types (name, description, location_id) VALUES
('D Villa', 'D-series Villa with 4 King Beds in BR2', NULL)
ON CONFLICT (name) DO NOTHING;

-- P-series Villa Type (KING-TWIN-KING configuration, some with doors, some with SPA)
INSERT INTO public.room_types (name, description, location_id) VALUES
('P Villa Standard', 'P-series Villa with KING-TWIN-KING bed configuration', NULL),
('P Villa with Door', 'P-series Villa with KING-TWIN-KING and door(s)', NULL),
('P Villa with SPA', 'P-series Villa with KING-TWIN-SPA configuration', NULL)
ON CONFLICT (name) DO NOTHING;

-- R-series Room Type (mostly TWIN beds, some with KING)
INSERT INTO public.room_types (name, description, location_id) VALUES
('R Room Standard', 'R-series Room with TWIN bed configuration', NULL),
('R Room with KING', 'R-series Room with KING bed in some bedrooms', NULL)
ON CONFLICT (name) DO NOTHING;

-- S-series Villa Type (TWIN-TWIN-KING or KING-TWIN-KING)
INSERT INTO public.room_types (name, description, location_id) VALUES
('S Villa Standard', 'S-series Villa with TWIN-TWIN-KING configuration', NULL),
('S Villa Premium', 'S-series Villa with KING-TWIN-KING configuration', NULL)
ON CONFLICT (name) DO NOTHING;

-- Q-series Villa Type
INSERT INTO public.room_types (name, description, location_id) VALUES
('Q Villa', 'Q-series Villa', NULL)
ON CONFLICT (name) DO NOTHING;

-- Reset sequence for room_types
SELECT setval('public.room_types_id_seq', (SELECT MAX(id) FROM public.room_types));

-- ============================================
-- 3. INSERT ROOMS
-- ============================================

-- D-series Rooms
-- Note: Using subquery to get type_id by name since we don't know the exact id
INSERT INTO public.rooms (number, type_id, status)
SELECT 'D01', id, 'Available' FROM public.room_types WHERE name = 'D Villa'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'D03', id, 'Available' FROM public.room_types WHERE name = 'D Villa'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'D04', id, 'Available' FROM public.room_types WHERE name = 'D Villa'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'D05', id, 'Available' FROM public.room_types WHERE name = 'D Villa'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'D06', id, 'Available' FROM public.room_types WHERE name = 'D Villa'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'D07', id, 'Available' FROM public.room_types WHERE name = 'D Villa'
ON CONFLICT (number) DO NOTHING;

-- P-series Rooms
-- P01, P25, P26, P28, P29, P32, P37: Standard (No door)
INSERT INTO public.rooms (number, type_id, status)
SELECT 'P01', id, 'Available' FROM public.room_types WHERE name = 'P Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'P25', id, 'Available' FROM public.room_types WHERE name = 'P Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'P26', id, 'Available' FROM public.room_types WHERE name = 'P Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'P28', id, 'Available' FROM public.room_types WHERE name = 'P Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'P29', id, 'Available' FROM public.room_types WHERE name = 'P Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'P32', id, 'Available' FROM public.room_types WHERE name = 'P Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'P37', id, 'Available' FROM public.room_types WHERE name = 'P Villa Standard'
ON CONFLICT (number) DO NOTHING;

-- P06, P07, P36, P31: With Door
INSERT INTO public.rooms (number, type_id, status)
SELECT 'P06', id, 'Available' FROM public.room_types WHERE name = 'P Villa with Door'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'P07', id, 'Available' FROM public.room_types WHERE name = 'P Villa with Door'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'P36', id, 'Available' FROM public.room_types WHERE name = 'P Villa with Door'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'P31', id, 'Available' FROM public.room_types WHERE name = 'P Villa with Door'
ON CONFLICT (number) DO NOTHING;

-- P34, P35: With SPA
INSERT INTO public.rooms (number, type_id, status)
SELECT 'P34', id, 'Available' FROM public.room_types WHERE name = 'P Villa with SPA'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'P35', id, 'Available' FROM public.room_types WHERE name = 'P Villa with SPA'
ON CONFLICT (number) DO NOTHING;

-- R-series Rooms
-- R01, R02, R05, R08, R11, R16, R17, R18, R19, R20, R23, R24, R27, R39, R41, R42, R43, R45: Standard (all TWIN)
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R01', id, 'Available' FROM public.room_types WHERE name = 'R Room Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R02', id, 'Available' FROM public.room_types WHERE name = 'R Room Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R05', id, 'Available' FROM public.room_types WHERE name = 'R Room Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R08', id, 'Available' FROM public.room_types WHERE name = 'R Room Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R11', id, 'Available' FROM public.room_types WHERE name = 'R Room Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R16', id, 'Available' FROM public.room_types WHERE name = 'R Room Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R17', id, 'Available' FROM public.room_types WHERE name = 'R Room Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R18', id, 'Available' FROM public.room_types WHERE name = 'R Room Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R19', id, 'Available' FROM public.room_types WHERE name = 'R Room Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R20', id, 'Available' FROM public.room_types WHERE name = 'R Room Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R23', id, 'Available' FROM public.room_types WHERE name = 'R Room Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R24', id, 'Available' FROM public.room_types WHERE name = 'R Room Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R27', id, 'Available' FROM public.room_types WHERE name = 'R Room Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R39', id, 'Available' FROM public.room_types WHERE name = 'R Room Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R41', id, 'Available' FROM public.room_types WHERE name = 'R Room Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R42', id, 'Available' FROM public.room_types WHERE name = 'R Room Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R43', id, 'Available' FROM public.room_types WHERE name = 'R Room Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R45', id, 'Available' FROM public.room_types WHERE name = 'R Room Standard'
ON CONFLICT (number) DO NOTHING;

-- R25, R40, R31, R32, R33, R34, R35, R36: With KING
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R25', id, 'Available' FROM public.room_types WHERE name = 'R Room with KING'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R40', id, 'Available' FROM public.room_types WHERE name = 'R Room with KING'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R31', id, 'Available' FROM public.room_types WHERE name = 'R Room with KING'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R32', id, 'Available' FROM public.room_types WHERE name = 'R Room with KING'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R33', id, 'Available' FROM public.room_types WHERE name = 'R Room with KING'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R34', id, 'Available' FROM public.room_types WHERE name = 'R Room with KING'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R35', id, 'Available' FROM public.room_types WHERE name = 'R Room with KING'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'R36', id, 'Available' FROM public.room_types WHERE name = 'R Room with KING'
ON CONFLICT (number) DO NOTHING;

-- S-series Rooms
-- S01-S08, S19-S24, S26, S33-S35, S37-S40: TWIN-TWIN-KING (Standard)
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S01', id, 'Available' FROM public.room_types WHERE name = 'S Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S02', id, 'Available' FROM public.room_types WHERE name = 'S Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S03', id, 'Available' FROM public.room_types WHERE name = 'S Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S04', id, 'Available' FROM public.room_types WHERE name = 'S Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S05', id, 'Available' FROM public.room_types WHERE name = 'S Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S06', id, 'Available' FROM public.room_types WHERE name = 'S Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S07', id, 'Available' FROM public.room_types WHERE name = 'S Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S08', id, 'Available' FROM public.room_types WHERE name = 'S Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S19', id, 'Available' FROM public.room_types WHERE name = 'S Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S20', id, 'Available' FROM public.room_types WHERE name = 'S Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S21', id, 'Available' FROM public.room_types WHERE name = 'S Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S22', id, 'Available' FROM public.room_types WHERE name = 'S Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S23', id, 'Available' FROM public.room_types WHERE name = 'S Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S24', id, 'Available' FROM public.room_types WHERE name = 'S Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S26', id, 'Available' FROM public.room_types WHERE name = 'S Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S33', id, 'Available' FROM public.room_types WHERE name = 'S Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S34', id, 'Available' FROM public.room_types WHERE name = 'S Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S35', id, 'Available' FROM public.room_types WHERE name = 'S Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S37', id, 'Available' FROM public.room_types WHERE name = 'S Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S38', id, 'Available' FROM public.room_types WHERE name = 'S Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S39', id, 'Available' FROM public.room_types WHERE name = 'S Villa Standard'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S40', id, 'Available' FROM public.room_types WHERE name = 'S Villa Standard'
ON CONFLICT (number) DO NOTHING;

-- S25, S36, S43-S48: KING-TWIN-KING (Premium)
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S25', id, 'Available' FROM public.room_types WHERE name = 'S Villa Premium'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S36', id, 'Available' FROM public.room_types WHERE name = 'S Villa Premium'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S43', id, 'Available' FROM public.room_types WHERE name = 'S Villa Premium'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S44', id, 'Available' FROM public.room_types WHERE name = 'S Villa Premium'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S45', id, 'Available' FROM public.room_types WHERE name = 'S Villa Premium'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S46', id, 'Available' FROM public.room_types WHERE name = 'S Villa Premium'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S47', id, 'Available' FROM public.room_types WHERE name = 'S Villa Premium'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'S48', id, 'Available' FROM public.room_types WHERE name = 'S Villa Premium'
ON CONFLICT (number) DO NOTHING;

-- Q-series Rooms
INSERT INTO public.rooms (number, type_id, status)
SELECT 'Q5', id, 'Available' FROM public.room_types WHERE name = 'Q Villa'
ON CONFLICT (number) DO NOTHING;
INSERT INTO public.rooms (number, type_id, status)
SELECT 'Q6', id, 'Available' FROM public.room_types WHERE name = 'Q Villa'
ON CONFLICT (number) DO NOTHING;

-- Reset sequence for rooms
SELECT setval('public.rooms_id_seq', (SELECT MAX(id) FROM public.rooms));

