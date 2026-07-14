-- Yeh Mera India profile settings schema helper
-- Safe and non-destructive. Existing users and content remain unchanged.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_changed_at DATETIME NULL;

SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME IN ('name', 'email', 'password', 'role', 'status', 'password_changed_at')
ORDER BY ORDINAL_POSITION;
