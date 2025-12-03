-- Check if language column exists in users table
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'language';

-- If column exists, show current values
SELECT id, room_number, last_name, language
FROM users
LIMIT 10;

