-- ============================================
-- Furama Resort Digital Concierge Database Schema
-- PostgreSQL Database Schema
-- ============================================

-- Drop existing views first (to avoid cascade notices)
DROP VIEW IF EXISTS pending_services CASCADE;
DROP VIEW IF EXISTS active_rides CASCADE;

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS ride_requests CASCADE;
DROP TABLE IF EXISTS resort_events CASCADE;
DROP TABLE IF EXISTS knowledge_items CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop ENUM types if they exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS buggy_status CASCADE;
DROP TYPE IF EXISTS service_type CASCADE;
DROP TYPE IF EXISTS service_request_status CASCADE;
DROP TYPE IF EXISTS location_type CASCADE;
DROP TYPE IF EXISTS message_role CASCADE;

-- ============================================
-- ENUM Types
-- ============================================

CREATE TYPE user_role AS ENUM ('GUEST', 'ADMIN', 'DRIVER', 'STAFF');
CREATE TYPE buggy_status AS ENUM ('IDLE', 'SEARCHING', 'ASSIGNED', 'ARRIVING', 'ON_TRIP', 'COMPLETED');
CREATE TYPE service_type AS ENUM ('DINING', 'SPA', 'HOUSEKEEPING');
CREATE TYPE service_request_status AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED');
CREATE TYPE location_type AS ENUM ('VILLA', 'FACILITY', 'RESTAURANT');
CREATE TYPE message_role AS ENUM ('user', 'model');

-- ============================================
-- Tables
-- ============================================

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    last_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    villa_type VARCHAR(100),
    role user_role NOT NULL DEFAULT 'GUEST',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_number, last_name)
);

-- Locations Table
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type location_type,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Menu Items Table
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'Dining', 'Spa', etc.
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Promotions Table
CREATE TABLE promotions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount VARCHAR(50),
    valid_until VARCHAR(100),
    image_color VARCHAR(50), -- For UI styling fallback
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge Items Table (for AI Training)
CREATE TABLE knowledge_items (
    id SERIAL PRIMARY KEY,
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resort Events Table
CREATE TABLE resort_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ride Requests Table (Buggy Bookings)
CREATE TABLE ride_requests (
    id SERIAL PRIMARY KEY,
    guest_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    pickup VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    status buggy_status NOT NULL DEFAULT 'SEARCHING',
    timestamp BIGINT NOT NULL,
    driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    eta INTEGER, -- Estimated time of arrival in minutes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Requests Table
CREATE TABLE service_requests (
    id SERIAL PRIMARY KEY,
    type service_type NOT NULL,
    status service_request_status NOT NULL DEFAULT 'PENDING',
    details TEXT NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages Table
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    role message_role NOT NULL,
    text TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    room_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX idx_users_room_number ON users(room_number);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_locations_name ON locations(name);
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_ride_requests_room_number ON ride_requests(room_number);
CREATE INDEX idx_ride_requests_status ON ride_requests(status);
CREATE INDEX idx_ride_requests_driver_id ON ride_requests(driver_id);
CREATE INDEX idx_service_requests_room_number ON service_requests(room_number);
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_service_requests_type ON service_requests(type);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- ============================================
-- Seed Data (from constants.ts)
-- ============================================

-- Insert Resort Center Location
INSERT INTO locations (lat, lng, name, type) VALUES
(16.0396, 108.2483, 'Furama Resort Danang', 'FACILITY');

-- Insert Mock Locations
INSERT INTO locations (lat, lng, name, type) VALUES
(16.0400, 108.2485, 'Main Lobby', 'FACILITY'),
(16.0390, 108.2490, 'Ocean Pool', 'FACILITY'),
(16.0385, 108.2480, 'Lagoon Pool', 'FACILITY'),
(16.0410, 108.2475, 'Don Cipriani''s Italian Restaurant', 'RESTAURANT'),
(16.0405, 108.2470, 'Furama Villas Reception', 'FACILITY');

-- Insert Mock Users
INSERT INTO users (last_name, room_number, villa_type, role) VALUES
('Smith', '101', 'Ocean Suite', 'GUEST'),
('Nguyen', '205', 'Garden Villa', 'GUEST'),
('Doe', '888', 'Presidential Suite', 'GUEST');

-- Insert Mock Promotions
INSERT INTO promotions (title, description, discount, valid_until, image_color, image_url) VALUES
('Sunset Happy Hour', 'Buy 1 Get 1 Free on all cocktails at Hai Van Lounge.', '50% OFF', 'Daily 17:00-19:00', 'bg-orange-500', 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=200&fit=crop&q=80'),
('Spa Retreat', '90-minute aromatherapy massage package.', '20% OFF', 'Nov 30', 'bg-purple-500', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=200&fit=crop&q=80'),
('Seafood Buffet', 'Unlimited lobster and local seafood at Cafe Indochine.', 'From $45', 'Sat & Sun', 'bg-blue-500', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=200&fit=crop&q=80');

-- Insert Knowledge Base Items
INSERT INTO knowledge_items (question, answer) VALUES
('Check-in time', 'Check-in is at 2:00 PM.'),
('Check-out time', 'Check-out is at 12:00 PM.'),
('Breakfast hours', 'Breakfast is served from 6:30 AM to 10:30 AM at Cafe Indochine.'),
('Wifi Password', 'The wifi network is ''Furama_Guest'' and there is no password required.');

-- Insert Menu Items
INSERT INTO menu_items (name, price, category, description) VALUES
('Wagyu Burger', 25.00, 'Dining', 'Premium beef with truffle fries'),
('Vietnamese Pho', 15.00, 'Dining', 'Traditional beef noodle soup'),
('Club Sandwich', 18.00, 'Dining', 'Classic triple-decker with chicken and bacon'),
('Aromatherapy Massage', 80.00, 'Spa', '60 mins relaxing massage'),
('Hot Stone Therapy', 95.00, 'Spa', '75 mins deep tissue relief'),
('Facial Rejuvenation', 60.00, 'Spa', '45 mins organic facial');

-- Insert Resort Events
INSERT INTO resort_events (title, date, time, location, description) VALUES
('Sunrise Yoga', '2023-11-20', '06:00:00', 'Ocean Beach', 'Start your day with a relaxing yoga session by the sea.'),
('Seafood Buffet', '2023-11-20', '18:30:00', 'Cafe Indochine', 'All-you-can-eat fresh local seafood.');

-- ============================================
-- Functions and Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_items_updated_at BEFORE UPDATE ON knowledge_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resort_events_updated_at BEFORE UPDATE ON resort_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ride_requests_updated_at BEFORE UPDATE ON ride_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON service_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Views (Optional - for common queries)
-- ============================================

-- View for active ride requests
CREATE OR REPLACE VIEW active_rides AS
SELECT 
    r.*,
    u.last_name as driver_last_name
FROM ride_requests r
LEFT JOIN users u ON r.driver_id = u.id
WHERE r.status != 'COMPLETED'
ORDER BY r.timestamp DESC;

-- View for pending service requests
CREATE OR REPLACE VIEW pending_services AS
SELECT 
    s.*,
    u.last_name as guest_last_name,
    u.villa_type
FROM service_requests s
LEFT JOIN users u ON s.room_number = u.room_number
WHERE s.status = 'PENDING'
ORDER BY s.timestamp DESC;

-- ============================================
-- End of Schema
-- ============================================

