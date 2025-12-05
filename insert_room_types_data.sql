-- Insert Room Types Data for Furama Resort Digital Concierge
-- This script adds room type data based on the provided image

-- Note: If your table has 'code' and 'quantity' columns, you may need to alter the table first:
-- ALTER TABLE public.room_types ADD COLUMN IF NOT EXISTS code VARCHAR(10);
-- ALTER TABLE public.room_types ADD COLUMN IF NOT EXISTS quantity INTEGER;

-- Insert Room Types (skip duplicates if they already exist)
INSERT INTO public.room_types (name, description) VALUES
('Garden Superior King', 'Garden Superior King (Code: AK, Quantity: 17)'),
('Garden Superior Hollywood Twin', 'Garden Superior Hollywood Twin (Code: AH, Quantity: 27)'),
('Garden Deluxe Hollywood Twin', 'Garden Deluxe Hollywood Twin (Code: BT, Quantity: 16)'),
('Lagoon Superior King', 'Lagoon Superior King (Code: CK, Quantity: 32)'),
('Lagoon Superior Hollywood Twin', 'Lagoon Superior Hollywood Twin (Code: CT, Quantity: 44)'),
('Ocean Deluxe Hollywood Twin', 'Ocean Deluxe Hollywood Twin (Code: DT, Quantity: 14)'),
('Ocean Studio Suite', 'Ocean Studio Suite (Code: ES, Quantity: 24)'),
('Ocean Studio Suite Hollywood Twin', 'Ocean Studio Suite Hollywood Twin (Code: EH, Quantity: 18)'),
('Garden Suite King', 'Garden Suite King (NO SELL) (Code: SG, Quantity: 2)'),
('Ocean Suite King', 'Ocean Suite King (Code: SU, Quantity: 2)'),
('Presidential Suite', 'Presidential Suite (Code: PS, Quantity: 2)')
ON CONFLICT (name) DO NOTHING;

-- If your table has code and quantity columns, use this version instead:
/*
INSERT INTO public.room_types (name, code, quantity, description) VALUES
('Garden Superior King', 'AK', 17, 'Garden Superior King'),
('Garden Superior Hollywood Twin', 'AH', 27, 'Garden Superior Hollywood Twin'),
('Garden Deluxe Hollywood Twin', 'BT', 16, 'Garden Deluxe Hollywood Twin'),
('Lagoon Superior King', 'CK', 32, 'Lagoon Superior King'),
('Lagoon Superior Hollywood Twin', 'CT', 44, 'Lagoon Superior Hollywood Twin'),
('Ocean Deluxe Hollywood Twin', 'DT', 14, 'Ocean Deluxe Hollywood Twin'),
('Ocean Studio Suite', 'ES', 24, 'Ocean Studio Suite'),
('Ocean Studio Suite Hollywood Twin', 'EH', 18, 'Ocean Studio Suite Hollywood Twin'),
('Garden Suite King', 'SG', 2, 'Garden Suite King (NO SELL)'),
('Ocean Suite King', 'SU', 2, 'Ocean Suite King'),
('Presidential Suite', 'PS', 2, 'Presidential Suite')
ON CONFLICT (name) DO NOTHING;
*/

-- Verify the data
SELECT * FROM public.room_types ORDER BY name;
