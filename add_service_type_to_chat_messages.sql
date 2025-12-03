-- Add service_type column to chat_messages table
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS service_type VARCHAR(50);

-- Update existing messages to have a default service type (if any exist)
-- You can set this to a specific service or leave NULL for general chat
UPDATE chat_messages SET service_type = 'GENERAL' WHERE service_type IS NULL;

-- Add index for faster queries by service type
CREATE INDEX IF NOT EXISTS idx_chat_messages_service_type ON chat_messages(service_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_service ON chat_messages(room_number, service_type);

-- Add comment
COMMENT ON COLUMN chat_messages.service_type IS 'Service type for the chat: DINING, SPA, POOL, BUTLER, BUGGY, or GENERAL';

