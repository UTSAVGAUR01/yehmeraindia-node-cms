CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'author', 'viewer') NOT NULL DEFAULT 'viewer',
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
);

CREATE TABLE IF NOT EXISTS posts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  author_id BIGINT UNSIGNED NULL,
  title VARCHAR(220) NOT NULL,
  slug VARCHAR(260) NOT NULL,
  excerpt TEXT NULL,
  content LONGTEXT NOT NULL,
  cover_image LONGTEXT NULL,
  image_alt VARCHAR(255) NULL,
  keywords TEXT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'Journal',
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  featured TINYINT(1) NOT NULL DEFAULT 0,
  published_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_posts_slug (slug),
  KEY idx_posts_status (status),
  KEY idx_posts_author_id (author_id),
  CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS books (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  author_id BIGINT UNSIGNED NULL,
  title VARCHAR(220) NOT NULL,
  description LONGTEXT NOT NULL,
  purchase_url VARCHAR(2000) NOT NULL,
  cover_image LONGTEXT NULL,
  image_prompt TEXT NULL,
  keywords TEXT NULL,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  published_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_books_status (status, published_at),
  KEY idx_books_author (author_id),
  CONSTRAINT fk_books_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS play_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  author_id BIGINT UNSIGNED NULL,
  play_title VARCHAR(220) NOT NULL,
  event_title VARCHAR(220) NOT NULL,
  description LONGTEXT NOT NULL,
  venue VARCHAR(300) NOT NULL,
  event_at DATETIME NOT NULL,
  ticket_url VARCHAR(2000) NULL,
  keywords TEXT NULL,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  published_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_play_events_status (status, event_at),
  KEY idx_play_events_author (author_id),
  CONSTRAINT fk_play_events_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS social_videos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  author_id BIGINT UNSIGNED NULL,
  title VARCHAR(220) NOT NULL,
  description LONGTEXT NOT NULL,
  video_url VARCHAR(2000) NOT NULL,
  platform ENUM('youtube', 'instagram') NOT NULL,
  keywords TEXT NULL,
  related_type ENUM('none', 'book', 'play', 'post') NOT NULL DEFAULT 'none',
  related_id BIGINT UNSIGNED NULL,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  published_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_social_videos_status (status, published_at),
  KEY idx_social_videos_author (author_id),
  CONSTRAINT fk_social_videos_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS homepage_content (
  id TINYINT UNSIGNED NOT NULL DEFAULT 1,
  hero_eyebrow VARCHAR(255) NOT NULL,
  hero_title VARCHAR(500) NOT NULL,
  hero_body TEXT NOT NULL,
  hero_image LONGTEXT NULL,
  about_eyebrow VARCHAR(255) NOT NULL,
  about_title VARCHAR(500) NOT NULL,
  about_body TEXT NOT NULL,
  about_image LONGTEXT NULL,
  work_eyebrow VARCHAR(255) NOT NULL DEFAULT 'Selected work',
  work_title VARCHAR(500) NOT NULL,
  work_body TEXT NULL,
  work_image LONGTEXT NULL,
  ai_eyebrow VARCHAR(255) NOT NULL DEFAULT 'The AI Lab',
  ai_title VARCHAR(500) NOT NULL,
  ai_body TEXT NOT NULL,
  ai_image LONGTEXT NULL,
  journal_eyebrow VARCHAR(255) NOT NULL DEFAULT 'From the journal',
  journal_title VARCHAR(500) NOT NULL DEFAULT 'Notes from the page, stage and lab.',
  journal_body TEXT NULL,
  journal_image LONGTEXT NULL,
  contact_title VARCHAR(500) NOT NULL DEFAULT 'Stories, stagecraft and ideas for tomorrow.',
  contact_body TEXT NULL,
  contact_image LONGTEXT NULL,
  contact_email VARCHAR(160) NOT NULL,
  journal_page_eyebrow VARCHAR(255) NOT NULL DEFAULT 'Yeh Mera India Journal',
  journal_page_title VARCHAR(500) NOT NULL DEFAULT 'Ideas from the page, the stage and the future.',
  journal_page_body TEXT NULL,
  journal_page_image LONGTEXT NULL,
  updated_by BIGINT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_homepage_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ai_settings (
  id TINYINT UNSIGNED NOT NULL DEFAULT 1,
  admin_text_model VARCHAR(100) NOT NULL DEFAULT 'gpt-5.5',
  author_text_model VARCHAR(100) NOT NULL DEFAULT 'gpt-5.5',
  image_model VARCHAR(100) NOT NULL DEFAULT 'gpt-image-2',
  updated_by BIGINT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ai_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ai_jobs (
  id CHAR(36) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  job_type ENUM('rewrite', 'page_rewrite', 'post_image', 'page_image', 'book_image') NOT NULL,
  status ENUM('queued', 'in_progress', 'completed', 'failed') NOT NULL DEFAULT 'queued',
  provider_id VARCHAR(160) NULL,
  target_id BIGINT UNSIGNED NULL,
  result LONGTEXT NULL,
  error TEXT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ai_jobs_user (user_id, created_at),
  KEY idx_ai_jobs_expiry (expires_at),
  CONSTRAINT fk_ai_jobs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS author_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_id BIGINT UNSIGNED NOT NULL,
  viewer_id BIGINT UNSIGNED NOT NULL,
  author_id BIGINT UNSIGNED NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_messages_author (author_id, is_read, created_at),
  KEY idx_messages_viewer (viewer_id, created_at),
  CONSTRAINT fk_messages_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_viewer FOREIGN KEY (viewer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);
