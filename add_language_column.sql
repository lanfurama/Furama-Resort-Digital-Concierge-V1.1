-- Add language column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT 'English';

-- Update existing users to have default language
UPDATE users SET language = 'English' WHERE language IS NULL;

-- Add comment
COMMENT ON COLUMN users.language IS 'Preferred language for the user (English, Vietnamese, Korean, Japanese, Chinese, French, Russian)';

