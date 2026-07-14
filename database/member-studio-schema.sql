USE `u192092963_yemeraindia`;

-- Yeh Mera India Member Studio schema
-- Non-destructive: creates missing tables only. No DROP, TRUNCATE, DELETE or data replacement.

CREATE TABLE IF NOT EXISTS role_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  requested_role ENUM('author','admin') NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
  admin_note TEXT NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_role_requests_user (user_id, created_at),
  INDEX idx_role_requests_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS conversation_threads (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  subject VARCHAR(220) NOT NULL,
  status ENUM('open','closed') NOT NULL DEFAULT 'open',
  last_message_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_conversation_user (user_id, last_message_at),
  INDEX idx_conversation_status (status, last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS conversation_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  thread_id BIGINT UNSIGNED NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  sender_type ENUM('member','staff') NOT NULL,
  body TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_conversation_messages_thread (thread_id, created_at),
  INDEX idx_conversation_messages_unread (thread_id, sender_type, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS password_reset_codes (
  id CHAR(36) NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  email VARCHAR(254) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  verified_at DATETIME NULL,
  reset_token_hash CHAR(64) NULL,
  reset_expires_at DATETIME NULL,
  consumed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_password_reset_email (email, expires_at),
  INDEX idx_password_reset_token (reset_token_hash, reset_expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Verification only. These statements do not change existing data.
SELECT DATABASE() AS selected_database;

SELECT TABLE_NAME, TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN (
    'role_requests',
    'conversation_threads',
    'conversation_messages',
    'password_reset_codes'
  )
ORDER BY TABLE_NAME;

SELECT 'role_requests' AS table_name, COUNT(*) AS total_rows FROM role_requests
UNION ALL SELECT 'conversation_threads', COUNT(*) FROM conversation_threads
UNION ALL SELECT 'conversation_messages', COUNT(*) FROM conversation_messages
UNION ALL SELECT 'password_reset_codes', COUNT(*) FROM password_reset_codes;
