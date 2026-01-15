-- Add vehicle_type column to users table for Drivers
ALTER TABLE users ADD COLUMN vehicle_type VARCHAR(20) DEFAULT 'NORMAL';

-- Add is_vip column to room_types table to identify VIP villas
ALTER TABLE room_types ADD COLUMN is_vip BOOLEAN DEFAULT FALSE;
