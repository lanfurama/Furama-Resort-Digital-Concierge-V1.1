-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    recipient_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('INFO', 'SUCCESS', 'WARNING')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Add comment
COMMENT ON TABLE notifications IS 'System notifications for guests and staff';
COMMENT ON COLUMN notifications.recipient_id IS 'Room number for guests, user ID for staff';
COMMENT ON COLUMN notifications.type IS 'Notification type: INFO, SUCCESS, or WARNING';

-- Insert sample notification
INSERT INTO notifications (recipient_id, title, message, type, is_read) VALUES
('101', 'Welcome', 'Welcome to Furama Resort & Villas!', 'INFO', FALSE);

