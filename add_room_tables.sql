-- Add room_types and rooms tables to database

-- Room Types Table
CREATE TABLE IF NOT EXISTS room_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    number VARCHAR(20) NOT NULL UNIQUE,
    type_id INTEGER NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied', 'Maintenance')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rooms_type_id ON rooms(type_id);
CREATE INDEX IF NOT EXISTS idx_rooms_number ON rooms(number);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_room_types_location_id ON room_types(location_id);

-- Create triggers for updated_at
CREATE TRIGGER update_room_types_updated_at BEFORE UPDATE ON room_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data from constants.ts
INSERT INTO room_types (name, description, location_id) VALUES
    ('Ocean Suite', 'Luxury suite with ocean view', (SELECT id FROM locations WHERE name = 'Main Lobby' LIMIT 1)),
    ('Garden Villa', 'Private villa surrounded by lush gardens', (SELECT id FROM locations WHERE name = 'Furama Villas Reception' LIMIT 1)),
    ('Presidential Suite', 'Top-tier luxury experience', (SELECT id FROM locations WHERE name = 'Main Lobby' LIMIT 1)),
    ('Lagoon Bungalow', 'Direct access to the lagoon pool', (SELECT id FROM locations WHERE name = 'Lagoon Pool' LIMIT 1))
ON CONFLICT (name) DO NOTHING;

INSERT INTO rooms (number, type_id, status) VALUES
    ('101', (SELECT id FROM room_types WHERE name = 'Ocean Suite' LIMIT 1), 'Occupied'),
    ('102', (SELECT id FROM room_types WHERE name = 'Ocean Suite' LIMIT 1), 'Available'),
    ('205', (SELECT id FROM room_types WHERE name = 'Garden Villa' LIMIT 1), 'Occupied'),
    ('305', (SELECT id FROM room_types WHERE name = 'Lagoon Bungalow' LIMIT 1), 'Available'),
    ('888', (SELECT id FROM room_types WHERE name = 'Presidential Suite' LIMIT 1), 'Occupied')
ON CONFLICT (number) DO NOTHING;

