USE `u192092963_yemeraindia`;

-- Yeh Mera India catalog column type repair
-- Preserves all existing rows. No DROP, DELETE, TRUNCATE or table recreation.

ALTER TABLE books
  MODIFY COLUMN title VARCHAR(220) NOT NULL,
  MODIFY COLUMN description LONGTEXT NOT NULL,
  MODIFY COLUMN purchase_url VARCHAR(2000) NOT NULL,
  MODIFY COLUMN cover_image LONGTEXT NULL,
  MODIFY COLUMN image_prompt TEXT NULL,
  MODIFY COLUMN keywords TEXT NULL,
  MODIFY COLUMN status ENUM('draft','published') NOT NULL DEFAULT 'draft',
  MODIFY COLUMN published_at DATETIME NULL;

ALTER TABLE play_events
  MODIFY COLUMN play_title VARCHAR(220) NOT NULL,
  MODIFY COLUMN event_title VARCHAR(220) NOT NULL,
  MODIFY COLUMN description LONGTEXT NOT NULL,
  MODIFY COLUMN venue VARCHAR(300) NOT NULL,
  MODIFY COLUMN event_at DATETIME NULL,
  MODIFY COLUMN ticket_url VARCHAR(2000) NULL,
  MODIFY COLUMN keywords TEXT NULL,
  MODIFY COLUMN status ENUM('draft','published') NOT NULL DEFAULT 'draft',
  MODIFY COLUMN published_at DATETIME NULL;

ALTER TABLE social_videos
  MODIFY COLUMN title VARCHAR(220) NOT NULL,
  MODIFY COLUMN description LONGTEXT NOT NULL,
  MODIFY COLUMN video_url VARCHAR(2000) NOT NULL,
  MODIFY COLUMN platform ENUM('youtube','instagram') NOT NULL DEFAULT 'youtube',
  MODIFY COLUMN keywords TEXT NULL,
  MODIFY COLUMN related_type ENUM('none','book','play','post') NOT NULL DEFAULT 'none',
  MODIFY COLUMN related_id BIGINT UNSIGNED NULL,
  MODIFY COLUMN status ENUM('draft','published') NOT NULL DEFAULT 'draft',
  MODIFY COLUMN published_at DATETIME NULL;

ALTER TABLE posts
  MODIFY COLUMN title VARCHAR(220) NOT NULL,
  MODIFY COLUMN slug VARCHAR(260) NOT NULL,
  MODIFY COLUMN excerpt TEXT NULL,
  MODIFY COLUMN content LONGTEXT NOT NULL,
  MODIFY COLUMN cover_image LONGTEXT NULL,
  MODIFY COLUMN image_alt VARCHAR(255) NULL,
  MODIFY COLUMN keywords TEXT NULL,
  MODIFY COLUMN category VARCHAR(100) NOT NULL DEFAULT 'Journal',
  MODIFY COLUMN status ENUM('draft','published') NOT NULL DEFAULT 'draft',
  MODIFY COLUMN featured TINYINT(1) NOT NULL DEFAULT 0,
  MODIFY COLUMN published_at DATETIME NULL;

-- Verification only
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('posts','books','play_events','social_videos')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

SELECT 'posts' AS table_name, COUNT(*) AS total_rows FROM posts
UNION ALL SELECT 'books', COUNT(*) FROM books
UNION ALL SELECT 'play_events', COUNT(*) FROM play_events
UNION ALL SELECT 'social_videos', COUNT(*) FROM social_videos;
