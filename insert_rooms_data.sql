-- Insert Rooms Data for Furama Resort Digital Concierge - East Wing
-- This script adds room data based on the provided floor plan image
-- Rooms are linked to room_types via subquery

-- Insert Rooms (skip duplicates if they already exist)
INSERT INTO public.rooms (number, type_id, status) VALUES
-- 100 Series (Floor 1)
('101', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite' LIMIT 1), 'Available'),
('102', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('103', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite' LIMIT 1), 'Available'),
('104', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('105', (SELECT id FROM public.room_types WHERE name = 'Ocean Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('106', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('107', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite Hollywood Twin' LIMIT 1), 'Available'),
('108', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('109', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite Hollywood Twin' LIMIT 1), 'Available'),
('110', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('111', (SELECT id FROM public.room_types WHERE name = 'Ocean Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('112', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('113', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite' LIMIT 1), 'Available'),
('114', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('115', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite' LIMIT 1), 'Available'),
('116', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('117', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite' LIMIT 1), 'Available'),
('118', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('119', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite' LIMIT 1), 'Available'),
('120', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('121', (SELECT id FROM public.room_types WHERE name = 'Ocean Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('123', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite Hollywood Twin' LIMIT 1), 'Available'),
('125', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite Hollywood Twin' LIMIT 1), 'Available'),
('127', (SELECT id FROM public.room_types WHERE name = 'Ocean Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('129', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite' LIMIT 1), 'Available'),
('131', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite' LIMIT 1), 'Available'),

-- 200 Series (Floor 2)
('201', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite' LIMIT 1), 'Available'),
('202', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('203', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite' LIMIT 1), 'Available'),
('204', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('205', (SELECT id FROM public.room_types WHERE name = 'Ocean Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('206', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('207', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite Hollywood Twin' LIMIT 1), 'Available'),
('208', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('209', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite Hollywood Twin' LIMIT 1), 'Available'),
('210', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('211', (SELECT id FROM public.room_types WHERE name = 'Ocean Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('212', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('213', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite' LIMIT 1), 'Available'),
('214', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('215', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite' LIMIT 1), 'Available'),
('216', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('217', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite' LIMIT 1), 'Available'),
('218', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('219', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite' LIMIT 1), 'Available'),
('220', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('221', (SELECT id FROM public.room_types WHERE name = 'Ocean Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('223', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite Hollywood Twin' LIMIT 1), 'Available'),
('225', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite Hollywood Twin' LIMIT 1), 'Available'),
('227', (SELECT id FROM public.room_types WHERE name = 'Ocean Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('229', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite' LIMIT 1), 'Available'),
('231', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite' LIMIT 1), 'Available'),

-- 300 Series (Floor 3)
('301', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite' LIMIT 1), 'Available'),
('302', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('303', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite' LIMIT 1), 'Available'),
('304', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('305', (SELECT id FROM public.room_types WHERE name = 'Ocean Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('306', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('307', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite Hollywood Twin' LIMIT 1), 'Available'),
('308', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('309', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite Hollywood Twin' LIMIT 1), 'Available'),
('310', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('311', (SELECT id FROM public.room_types WHERE name = 'Ocean Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('312', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('313', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite' LIMIT 1), 'Available'),
('314', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('315', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite' LIMIT 1), 'Available'),
('316', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('317', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite' LIMIT 1), 'Available'),
('318', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('319', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite' LIMIT 1), 'Available'),
('320', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior Hollywood Twin' LIMIT 1), 'Available'),
('321', (SELECT id FROM public.room_types WHERE name = 'Ocean Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('323', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite Hollywood Twin' LIMIT 1), 'Available'),
('325', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite Hollywood Twin' LIMIT 1), 'Available'),
('327', (SELECT id FROM public.room_types WHERE name = 'Ocean Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('329', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite' LIMIT 1), 'Available'),
('331', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite' LIMIT 1), 'Available'),

-- 400 Series (Floor 4)
('401', (SELECT id FROM public.room_types WHERE name = 'Presidential Suite' LIMIT 1), 'Available'),
('405', (SELECT id FROM public.room_types WHERE name = 'Presidential Suite' LIMIT 1), 'Available'),
('406', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('407', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite Hollywood Twin' LIMIT 1), 'Available'),
('408', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('409', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite Hollywood Twin' LIMIT 1), 'Available'),
('410', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('411', (SELECT id FROM public.room_types WHERE name = 'Ocean Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('412', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('413', (SELECT id FROM public.room_types WHERE name = 'Ocean Suite King' LIMIT 1), 'Available'),
('414', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('416', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('417', (SELECT id FROM public.room_types WHERE name = 'Ocean Suite King' LIMIT 1), 'Available'),
('418', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('420', (SELECT id FROM public.room_types WHERE name = 'Lagoon Superior King' LIMIT 1), 'Available'),
('421', (SELECT id FROM public.room_types WHERE name = 'Presidential Suite' LIMIT 1), 'Available'),
('423', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite Hollywood Twin' LIMIT 1), 'Available'),
('425', (SELECT id FROM public.room_types WHERE name = 'Ocean Studio Suite Hollywood Twin' LIMIT 1), 'Available'),
('427', (SELECT id FROM public.room_types WHERE name = 'Ocean Deluxe Hollywood Twin' LIMIT 1), 'Available'),
('429', (SELECT id FROM public.room_types WHERE name = 'Ocean Suite King' LIMIT 1), 'Available')
ON CONFLICT (number) DO NOTHING;

-- Verify the data
SELECT 
    r.number,
    r.status,
    rt.name as room_type,
    rt.description
FROM public.rooms r
JOIN public.room_types rt ON r.type_id = rt.id
ORDER BY r.number;

-- Count rooms by type
SELECT 
    rt.name as room_type,
    COUNT(r.id) as room_count
FROM public.room_types rt
LEFT JOIN public.rooms r ON rt.id = r.type_id
GROUP BY rt.id, rt.name
ORDER BY rt.name;
