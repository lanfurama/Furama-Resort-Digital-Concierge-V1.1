-- Insert Pool Services and Butler Request menu items for Furama Resort Danang
-- This script adds comprehensive pool services and butler services to the menu_items table

-- Pool Services (Category: 'Pool')
INSERT INTO menu_items (name, price, category, description) VALUES
    -- Pool Beverages & Snacks
    ('Fresh Coconut', 5.00, 'Pool', 'Chilled fresh coconut served at poolside'),
    ('Fresh Fruit Platter', 12.00, 'Pool', 'Assorted seasonal tropical fruits'),
    ('Poolside Cocktail', 8.00, 'Pool', 'Signature resort cocktails served at pool'),
    ('Iced Coffee', 4.00, 'Pool', 'Vietnamese iced coffee or espresso'),
    ('Fresh Juice Selection', 5.00, 'Pool', 'Orange, watermelon, or mixed fruit juice'),
    ('Mineral Water', 2.00, 'Pool', 'Bottled mineral water (500ml)'),
    
    -- Pool Accessories & Services
    ('Pool Towel Request', 0.00, 'Pool', 'Extra large resort towel delivery'),
    ('Sunscreen SPF 50', 15.00, 'Pool', 'Water resistant sun protection lotion'),
    ('Beach Umbrella Setup', 10.00, 'Pool', 'Umbrella setup at poolside or beach'),
    ('Poolside Lounger Reservation', 0.00, 'Pool', 'Reserve premium poolside lounger'),
    ('Pool Float Rental', 8.00, 'Pool', 'Inflatable pool float for adults'),
    ('Kids Pool Toys', 5.00, 'Pool', 'Pool toys and inflatables for children'),
    
    -- Pool Food Service
    ('Poolside Light Lunch', 18.00, 'Pool', 'Sandwich, salad, and beverage combo'),
    ('Fresh Seafood Platter', 35.00, 'Pool', 'Local seafood selection for sharing'),
    ('Poolside Snack Box', 10.00, 'Pool', 'Assorted snacks and refreshments')
ON CONFLICT DO NOTHING;

-- Butler Services (Category: 'Butler')
INSERT INTO menu_items (name, price, category, description) VALUES
    -- Basic Butler Services (Complimentary)
    ('Ice Bucket', 0.00, 'Butler', 'Bucket of ice cubes delivered to room'),
    ('Shoe Shine Service', 0.00, 'Butler', 'Complimentary shoe polishing service'),
    ('Unpacking Service', 0.00, 'Butler', 'Assistance with unpacking luggage'),
    ('Packing Service', 0.00, 'Butler', 'Assistance with packing luggage'),
    ('Clothing Pressing', 0.00, 'Butler', 'Quick pressing service for garments'),
    ('Wake-up Call Service', 0.00, 'Butler', 'Personal wake-up call with beverage'),
    
    -- Premium Butler Services
    ('Private Butler Service (Half Day)', 50.00, 'Butler', 'Dedicated butler for 4 hours'),
    ('Private Butler Service (Full Day)', 90.00, 'Butler', 'Dedicated butler for 8 hours'),
    ('Romantic Room Setup', 25.00, 'Butler', 'Rose petals, candles, and champagne setup'),
    ('Birthday Celebration Setup', 30.00, 'Butler', 'Room decoration and cake arrangement'),
    ('Anniversary Setup', 35.00, 'Butler', 'Special room decoration with flowers'),
    
    -- Concierge Services
    ('Restaurant Reservation', 0.00, 'Butler', 'Assistance with restaurant bookings'),
    ('Tour & Activity Booking', 0.00, 'Butler', 'Help booking local tours and activities'),
    ('Airport Transfer Arrangement', 0.00, 'Butler', 'Coordinate airport pickup/dropoff'),
    ('Laundry Service Coordination', 0.00, 'Butler', 'Arrange laundry and dry cleaning'),
    ('Special Occasion Planning', 15.00, 'Butler', 'Custom event planning assistance'),
    
    -- In-Room Services
    ('In-Room Dining Setup', 0.00, 'Butler', 'Table setup for in-room dining'),
    ('Evening Turndown Service', 0.00, 'Butler', 'Bed preparation and room refresh'),
    ('Morning Coffee Service', 0.00, 'Butler', 'Wake-up coffee/tea delivered to room'),
    ('Late Night Snack Service', 12.00, 'Butler', 'Complimentary late night snack selection'),
    ('Champagne Service', 45.00, 'Butler', 'Champagne with strawberries and chocolate')
ON CONFLICT DO NOTHING;

-- Verify inserted data
SELECT 
    category,
    COUNT(*) as item_count,
    SUM(CASE WHEN price = 0 THEN 1 ELSE 0 END) as complimentary_count,
    SUM(CASE WHEN price > 0 THEN 1 ELSE 0 END) as paid_count
FROM menu_items
WHERE category IN ('Pool', 'Butler')
GROUP BY category
ORDER BY category;

