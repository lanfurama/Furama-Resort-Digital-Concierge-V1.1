-- Migration: Add Performance Indexes
-- Description: Bổ sung indexes cho các cột thường xuyên dùng để tìm kiếm/lọc nhằm tăng tốc độ truy vấn
-- Date: 2026-01-16
-- Task: Database Indexing Audit

-- ============================================================================
-- TABLE: users (HIGH Priority)
-- ============================================================================
-- Lookup by room number (login, getByRoomNumber)
CREATE INDEX IF NOT EXISTS idx_users_room_number ON users(room_number);

-- Filter drivers (getDriversWithLocations, role-based queries)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- QR code login (getByCheckInCode)
CREATE INDEX IF NOT EXISTS idx_users_check_in_code ON users(check_in_code);

-- Combined login query (getByRoomNumberAndPassword)
CREATE INDEX IF NOT EXISTS idx_users_room_password ON users(room_number, password);

-- Driver online status check (updated_at comparison)
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users(updated_at);

-- ============================================================================
-- TABLE: ride_requests (VERY HIGH Priority)
-- ============================================================================
-- Guest ride history lookup (getByRoomNumber)
CREATE INDEX IF NOT EXISTS idx_ride_requests_room_number ON ride_requests(room_number);

-- Filter by status (getByStatus, active rides check)
CREATE INDEX IF NOT EXISTS idx_ride_requests_status ON ride_requests(status);

-- Driver's ride history and assignment
CREATE INDEX IF NOT EXISTS idx_ride_requests_driver_id ON ride_requests(driver_id);

-- ORDER BY timestamp DESC (most queries use this ordering)
CREATE INDEX IF NOT EXISTS idx_ride_requests_timestamp ON ride_requests(timestamp DESC);

-- Historical reports filtering (getHistoricalReports)
CREATE INDEX IF NOT EXISTS idx_ride_requests_drop_timestamp ON ride_requests(drop_timestamp DESC NULLS LAST);

-- Active ride check per room (getActiveByRoomNumber: WHERE room_number = ? AND status != 'COMPLETED')
CREATE INDEX IF NOT EXISTS idx_ride_requests_room_status ON ride_requests(room_number, status);

-- Driver's active rides lookup
CREATE INDEX IF NOT EXISTS idx_ride_requests_driver_status ON ride_requests(driver_id, status);

-- Duplicate check with case-insensitive guest name
CREATE INDEX IF NOT EXISTS idx_ride_requests_guest_name_lower ON ride_requests(LOWER(guest_name));

-- Combined index for created_at ordering in reports
CREATE INDEX IF NOT EXISTS idx_ride_requests_created_at ON ride_requests(created_at DESC);

-- ============================================================================
-- TABLE: service_requests (HIGH Priority)
-- ============================================================================
-- Guest service history (getByRoomNumber)
CREATE INDEX IF NOT EXISTS idx_service_requests_room_number ON service_requests(room_number);

-- Filter by status (getByStatus)
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);

-- Filter by service type (getByType)
CREATE INDEX IF NOT EXISTS idx_service_requests_type ON service_requests(type);

-- ORDER BY timestamp DESC
CREATE INDEX IF NOT EXISTS idx_service_requests_timestamp ON service_requests(timestamp DESC);

-- ============================================================================
-- TABLE: chat_messages (HIGH Priority)
-- ============================================================================
-- Get messages by user (getByUserId)
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

-- Get messages by room (getByRoomNumber)
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_number ON chat_messages(room_number);

-- Combined filter for service chat (getByRoomNumberAndService)
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_service ON chat_messages(room_number, service_type);

-- ORDER BY created_at (most chat queries order by this)
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Unread count query optimization (role + room + service + id comparison)
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_service_role ON chat_messages(room_number, service_type, role);

-- ============================================================================
-- TABLE: notifications (HIGH Priority)
-- ============================================================================
-- Get notifications by recipient (getByRecipientId)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);

-- Unread notifications filter (getUnreadByRecipientId)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON notifications(recipient_id, is_read);

-- ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================================
-- TABLE: rooms (MEDIUM Priority)
-- ============================================================================
-- Lookup by room number (getByNumber)
CREATE INDEX IF NOT EXISTS idx_rooms_number ON rooms(number);

-- Filter by room type (getByTypeId)
CREATE INDEX IF NOT EXISTS idx_rooms_type_id ON rooms(type_id);

-- Filter by availability status
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);

-- ============================================================================
-- TABLE: menu_items (MEDIUM Priority)
-- ============================================================================
-- Filter by category
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);

-- Filter by language
CREATE INDEX IF NOT EXISTS idx_menu_items_language ON menu_items(language);

-- Combined filter (getAll with both category and language)
CREATE INDEX IF NOT EXISTS idx_menu_items_category_language ON menu_items(category, language);

-- ============================================================================
-- TABLE: hotel_reviews (MEDIUM Priority)
-- Note: room_number already has UNIQUE constraint which creates an index
-- ============================================================================
-- ORDER BY created_at DESC (getAll)
CREATE INDEX IF NOT EXISTS idx_hotel_reviews_created_at ON hotel_reviews(created_at DESC);

-- ============================================================================
-- TABLE: promotions (LOW Priority)
-- ============================================================================
-- Filter by language (getAll with language filter)
CREATE INDEX IF NOT EXISTS idx_promotions_language ON promotions(language);

-- ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_promotions_created_at ON promotions(created_at DESC);

-- ============================================================================
-- TABLE: resort_events (LOW Priority)
-- ============================================================================
-- Filter by language
CREATE INDEX IF NOT EXISTS idx_resort_events_language ON resort_events(language);

-- ORDER BY date, time
CREATE INDEX IF NOT EXISTS idx_resort_events_date ON resort_events(date DESC, time DESC);

-- ============================================================================
-- TABLE: locations (LOW Priority)
-- ============================================================================
-- Filter by location type
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);

-- ORDER BY name
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);

-- ============================================================================
-- TABLE: user_read_messages (Supporting table for chat)
-- ============================================================================
-- Lookup for getLastReadMessageId
CREATE INDEX IF NOT EXISTS idx_user_read_messages_identifier_service ON user_read_messages(identifier, service_type);

-- ============================================================================
-- Verification Query (run separately to check indexes)
-- ============================================================================
-- SELECT indexname, tablename FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, indexname;

-- ============================================================================
-- Summary: 37 indexes created
-- - users: 5 indexes
-- - ride_requests: 9 indexes
-- - service_requests: 4 indexes
-- - chat_messages: 5 indexes
-- - notifications: 3 indexes
-- - rooms: 3 indexes
-- - menu_items: 3 indexes
-- - hotel_reviews: 1 index
-- - promotions: 2 indexes
-- - resort_events: 2 indexes
-- - locations: 2 indexes
-- - user_read_messages: 1 index
-- ============================================================================
