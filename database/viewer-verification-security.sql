-- Yeh Mera India Viewer verification and security schema
-- Non-destructive: creates only missing columns, tables and indexes.
-- Select database u192092963_yemeraindia in phpMyAdmin before running.

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at DATETIME NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_pending TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at DATETIME NULL;

CREATE TABLE IF NOT EXISTS auth_codes (
  id CHAR(36) NOT NULL,
  user_id BIGINT NULL,
  email VARCHAR(255) NOT NULL,
  purpose ENUM('signup','login') NOT NULL,
  code_hash CHAR(64) NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  consumed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_auth_codes_lookup (email, purpose, expires_at),
  INDEX idx_auth_codes_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS security_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT NULL,
  email VARCHAR(255) NULL,
  event_type VARCHAR(80) NOT NULL,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_security_events_created (created_at),
  INDEX idx_security_events_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Verification status review. This does not change any account.
SELECT id, name, email, role, status, registration_pending, email_verified_at, two_factor_enabled
FROM users
ORDER BY id;
