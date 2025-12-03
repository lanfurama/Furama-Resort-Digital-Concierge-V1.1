-- Debug script to check room_types and locations linkage
-- Check room_types with their location_id
SELECT 
    rt.id as room_type_id,
    rt.name as room_type_name,
    rt.location_id,
    l.id as location_id_from_locations,
    l.name as location_name
FROM room_types rt
LEFT JOIN locations l ON rt.location_id = l.id
ORDER BY rt.name;

-- Check all locations
SELECT id, name, type FROM locations ORDER BY name;

