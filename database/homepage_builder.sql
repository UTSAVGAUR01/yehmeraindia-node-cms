-- ============================================================
-- YE MERA INDIA - Homepage Builder Schema
-- Run this in Hostinger MySQL database when ready.
-- The app also has memory fallback, so site stays live before running this.
-- ============================================================

CREATE TABLE IF NOT EXISTS hero_banners (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255) DEFAULT NULL,
  description TEXT,
  button1_text VARCHAR(100) DEFAULT NULL,
  button1_link VARCHAR(255) DEFAULT NULL,
  button2_text VARCHAR(100) DEFAULT NULL,
  button2_link VARCHAR(255) DEFAULT NULL,
  image_url LONGTEXT,
  mobile_image_url LONGTEXT,
  overlay_color VARCHAR(30) DEFAULT '#000000',
  overlay_opacity DECIMAL(4,2) DEFAULT 0.35,
  sort_order INT DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS sub_hero_banners (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  short_text VARCHAR(255) DEFAULT NULL,
  image_url LONGTEXT,
  button_text VARCHAR(100) DEFAULT NULL,
  button_link VARCHAR(255) DEFAULT NULL,
  sort_order INT DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS media_gallery (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  media_type ENUM('image','video') NOT NULL DEFAULT 'image',
  title VARCHAR(255) NOT NULL,
  caption TEXT,
  file_url LONGTEXT NOT NULL,
  category VARCHAR(100) DEFAULT NULL,
  is_featured TINYINT DEFAULT 0,
  sort_order INT DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS homepage_tiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url LONGTEXT,
  icon_name VARCHAR(100) DEFAULT NULL,
  bg_color VARCHAR(30) DEFAULT '#170805',
  button_text VARCHAR(100) DEFAULT NULL,
  button_link VARCHAR(255) DEFAULT NULL,
  tile_size ENUM('small','medium','large') DEFAULT 'medium',
  sort_order INT DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);
