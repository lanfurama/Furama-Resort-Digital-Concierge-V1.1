-- Test script to verify language column exists and can be updated
-- Run this to check if the column exists
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'language';

-- Check current language values
SELECT id, room_number, last_name, language
FROM users
WHERE room_number = '101';

-- Manually test update (replace with your user ID)
UPDATE users 
SET language = 'Japanese', updated_at = CURRENT_TIMESTAMP 
WHERE room_number = '101' 
RETURNING id, room_number, language;

-- Verify update
SELECT id, room_number, last_name, language
FROM users
WHERE room_number = '101';

