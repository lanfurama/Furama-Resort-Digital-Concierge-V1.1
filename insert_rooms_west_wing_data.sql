-- Insert Rooms Data for Furama Resort Digital Concierge - West Wing
-- This script adds room data based on the provided floor plan image
-- Rooms are linked to room_types via subquery

-- Insert Rooms (skip duplicates if they already exist)
INSERT INTO public.rooms (number, type_id, status) VALUES
-- 100 Series (Floor 1 - West Wing)
('132', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('133', (SELECT id FROM public.room_types WHERE name = 'Garden Superior King' LIMIT 1), 'Available'),
('134', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('135', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('136', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('137', (SELECT id FROM public.room_types WHERE name = 'Garden Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('138', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('139', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('140', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('141', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('142', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('143', (SELECT id FROM public.room_types WHERE name = 'Garden Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('144', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('145', (SELECT id FROM public.room_types WHERE name = 'Garden Superior King' LIMIT 1), 'Available'),
('146', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('147', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('148', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('149', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('150', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('151', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('153', (SELECT id FROM public.room_types WHERE name = 'Garden Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('155', (SELECT id FROM public.room_types WHERE name = 'Garden Superior King' LIMIT 1), 'Available'),
('157', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('159', (SELECT id FROM public.room_types WHERE name = 'Garden Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('161', (SELECT id FROM public.room_types WHERE name = 'Garden Superior King' LIMIT 1), 'Available'),
('163', (SELECT id FROM public.room_types WHERE name = 'Garden Superior King' LIMIT 1), 'Available'),

-- 200 Series (Floor 2 - West Wing)
('232', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('233', (SELECT id FROM public.room_types WHERE name = 'Garden Superior King' LIMIT 1), 'Available'),
('234', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('235', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('236', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('237', (SELECT id FROM public.room_types WHERE name = 'Garden Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('238', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('239', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('240', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('241', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('242', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('243', (SELECT id FROM public.room_types WHERE name = 'Garden Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('244', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('245', (SELECT id FROM public.room_types WHERE name = 'Garden Superior King' LIMIT 1), 'Available'),
('246', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('247', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('248', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('249', (SELECT id FROM public.room_types WHERE name = 'Garden Superior King' LIMIT 1), 'Available'),
('250', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('251', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('253', (SELECT id FROM public.room_types WHERE name = 'Garden Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('255', (SELECT id FROM public.room_types WHERE name = 'Garden Superior King' LIMIT 1), 'Available'),
('257', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('259', (SELECT id FROM public.room_types WHERE name = 'Garden Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('261', (SELECT id FROM public.room_types WHERE name = 'Garden Superior King' LIMIT 1), 'Available'),
('263', (SELECT id FROM public.room_types WHERE name = 'Garden Superior King' LIMIT 1), 'Available'),

-- 300 Series (Floor 3 - West Wing)
('332', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('333', (SELECT id FROM public.room_types WHERE name = 'Garden Superior King' LIMIT 1), 'Available'),
('334', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('335', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('336', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('337', (SELECT id FROM public.room_types WHERE name = 'Garden Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('338', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('339', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('340', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('341', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('342', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('343', (SELECT id FROM public.room_types WHERE name = 'Garden Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('344', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('345', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('346', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('347', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('348', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('349', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('350', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('351', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('353', (SELECT id FROM public.room_types WHERE name = 'Garden Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('355', (SELECT id FROM public.room_types WHERE name = 'Garden Superior King' LIMIT 1), 'Available'),
('357', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('359', (SELECT id FROM public.room_types WHERE name = 'Garden Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('361', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('363', (SELECT id FROM public.room_types WHERE name = 'Garden Superior King' LIMIT 1), 'Available'),

-- 400 Series (Floor 4 - West Wing)
('433', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('435', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('436', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('437', (SELECT id FROM public.room_types WHERE name = 'Garden Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('438', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('439', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('440', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('441', (SELECT id FROM public.room_types WHERE name = 'Garden Superior King' LIMIT 1), 'Available'),
('442', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('443', (SELECT id FROM public.room_types WHERE name = 'Garden Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('444', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('445', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('446', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('447', (SELECT id FROM public.room_types WHERE name = 'Garden Superior Hollywood Twin' LIMIT 1), 'Available'),
('448', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('449', (SELECT id FROM public.room_types WHERE name = 'Garden Suite King' LIMIT 1), 'Available'),
('450', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('453', (SELECT id FROM public.room_types WHERE name = 'Garden Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('455', (SELECT id FROM public.room_types WHERE name = 'Garden Superior King' LIMIT 1), 'Available'),
('457', (SELECT id FROM public.room_types WHERE name = 'Garden Superior King' LIMIT 1), 'Available'),
('459', (SELECT id FROM public.room_types WHERE name = 'Garden Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('461', (SELECT id FROM public.room_types WHERE name = 'Garden Suite King' LIMIT 1), 'Available')
ON CONFLICT (number) DO NOTHING;

-- Verify the data
SELECT 
    r.number,
    r.status,
    rt.name as room_type,
    rt.description
FROM public.rooms r
JOIN public.room_types rt ON r.type_id = rt.id
WHERE r.number::integer >= 132 AND r.number::integer <= 461
ORDER BY r.number;

-- Count rooms by type in West Wing
SELECT 
    rt.name as room_type,
    COUNT(r.id) as room_count
FROM public.room_types rt
LEFT JOIN public.rooms r ON rt.id = r.type_id
WHERE r.number::integer >= 132 AND r.number::integer <= 461
GROUP BY rt.id, rt.name
ORDER BY rt.name;
