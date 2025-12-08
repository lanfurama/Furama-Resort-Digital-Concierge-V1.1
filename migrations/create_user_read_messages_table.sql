-- Migration: Create user_read_messages table to track last read message for each user in each service chat
-- This allows us to show unread message badges and mark messages as read

CREATE TABLE IF NOT EXISTS user_read_messages (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(100) NOT NULL, -- room_number for guests, or 'staff_{serviceType}' for staff
    service_type VARCHAR(50) NOT NULL, -- BUGGY, DINING, SPA, etc.
    last_read_message_id INTEGER NOT NULL, -- ID of the last message the user has read
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(identifier, service_type)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_read_messages_lookup ON user_read_messages(identifier, service_type);

-- Add comment
COMMENT ON TABLE user_read_messages IS 'Tracks the last read message ID for each user (guest or staff) in each service chat';
