-- Seed locations data from constants.ts
-- This file inserts the default locations that match MOCK_LOCATIONS in constants.ts

INSERT INTO public.locations (lat, lng, name, type) VALUES
(16.0400, 108.2485, 'Main Lobby', 'FACILITY'),
(16.0390, 108.2490, 'Ocean Pool', 'FACILITY'),
(16.0385, 108.2480, 'Lagoon Pool', 'FACILITY'),
(16.0410, 108.2475, 'Don Cipriani''s Italian Restaurant', 'RESTAURANT'),
(16.0405, 108.2470, 'Furama Villas Reception', 'FACILITY')
ON CONFLICT DO NOTHING;

-- Verify the data
SELECT id, name, lat, lng, type FROM public.locations ORDER BY name;

