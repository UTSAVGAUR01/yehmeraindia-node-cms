-- ============================================================
-- YE MERA INDIA - Full CMS Schema
-- Run this after homepage_builder.sql when ready.
-- The app includes memory fallback so deployment stays live before SQL setup.
-- ============================================================

CREATE TABLE IF NOT EXISTS cms_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  hindi_name VARCHAR(120) DEFAULT NULL,
  description TEXT,
  icon VARCHAR(20) DEFAULT '✨',
  sort_order INT DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS media_assets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) DEFAULT 'image',
  category VARCHAR(120) DEFAULT NULL,
  alt_text VARCHAR(255) DEFAULT NULL,
  caption TEXT,
  uploaded_by VARCHAR(120) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS seo_meta (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  entity_type VARCHAR(40) NOT NULL,
  entity_id BIGINT UNSIGNED DEFAULT NULL,
  page_path VARCHAR(255) DEFAULT NULL,
  meta_title VARCHAR(255) DEFAULT NULL,
  meta_description TEXT,
  keywords TEXT,
  canonical_url VARCHAR(255) DEFAULT NULL,
  og_image VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_type VARCHAR(80) NOT NULL,
  page_path VARCHAR(255) DEFAULT NULL,
  referrer VARCHAR(255) DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Optional columns for existing posts table
ALTER TABLE posts ADD COLUMN language VARCHAR(20) DEFAULT 'en';
ALTER TABLE posts ADD COLUMN cover_image VARCHAR(500) DEFAULT NULL;
ALTER TABLE posts ADD COLUMN meta_title VARCHAR(255) DEFAULT NULL;
ALTER TABLE posts ADD COLUMN meta_description TEXT;
ALTER TABLE posts ADD COLUMN seo_keywords TEXT;
