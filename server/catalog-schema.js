import { query } from "./db.js";

async function columnExists(table, column) {
  const rows = await query(
    `SELECT COUNT(*) AS total
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  return Number(rows[0]?.total || 0) > 0;
}

async function indexExists(table, indexName) {
  const rows = await query(
    `SELECT COUNT(*) AS total
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [table, indexName],
  );
  return Number(rows[0]?.total || 0) > 0;
}

async function ensureColumn(table, column, definition) {
  if (!(await columnExists(table, column))) {
    await query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
}

async function ensureIndex(table, indexName, columns) {
  if (!(await indexExists(table, indexName))) {
    await query(`ALTER TABLE \`${table}\` ADD INDEX \`${indexName}\` (${columns})`);
  }
}

export async function ensureCatalogSchema() {
  await query(`CREATE TABLE IF NOT EXISTS books (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    author_id BIGINT UNSIGNED NULL,
    title VARCHAR(220) NOT NULL,
    description LONGTEXT NOT NULL,
    purchase_url VARCHAR(2000) NOT NULL,
    cover_image LONGTEXT NULL,
    image_prompt TEXT NULL,
    keywords TEXT NULL,
    status ENUM('draft','published') NOT NULL DEFAULT 'draft',
    published_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await ensureColumn("books", "author_id", "BIGINT UNSIGNED NULL");
  await ensureColumn("books", "description", "LONGTEXT NOT NULL");
  await ensureColumn("books", "purchase_url", "VARCHAR(2000) NOT NULL DEFAULT ''");
  await ensureColumn("books", "cover_image", "LONGTEXT NULL");
  await ensureColumn("books", "image_prompt", "TEXT NULL");
  await ensureColumn("books", "keywords", "TEXT NULL");
  await ensureColumn("books", "status", "ENUM('draft','published') NOT NULL DEFAULT 'draft'");
  await ensureColumn("books", "published_at", "DATETIME NULL");
  await ensureColumn("books", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
  await ensureColumn("books", "updated_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
  await ensureIndex("books", "idx_books_status", "status, published_at");
  await ensureIndex("books", "idx_books_author", "author_id");

  await query(`CREATE TABLE IF NOT EXISTS play_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    author_id BIGINT UNSIGNED NULL,
    play_title VARCHAR(220) NOT NULL,
    event_title VARCHAR(220) NOT NULL,
    description LONGTEXT NOT NULL,
    venue VARCHAR(300) NOT NULL,
    event_at DATETIME NOT NULL,
    ticket_url VARCHAR(2000) NULL,
    keywords TEXT NULL,
    status ENUM('draft','published') NOT NULL DEFAULT 'draft',
    published_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await ensureColumn("play_events", "author_id", "BIGINT UNSIGNED NULL");
  await ensureColumn("play_events", "play_title", "VARCHAR(220) NOT NULL DEFAULT ''");
  await ensureColumn("play_events", "event_title", "VARCHAR(220) NOT NULL DEFAULT ''");
  await ensureColumn("play_events", "description", "LONGTEXT NOT NULL");
  await ensureColumn("play_events", "venue", "VARCHAR(300) NOT NULL DEFAULT ''");
  await ensureColumn("play_events", "event_at", "DATETIME NULL");
  await ensureColumn("play_events", "ticket_url", "VARCHAR(2000) NULL");
  await ensureColumn("play_events", "keywords", "TEXT NULL");
  await ensureColumn("play_events", "status", "ENUM('draft','published') NOT NULL DEFAULT 'draft'");
  await ensureColumn("play_events", "published_at", "DATETIME NULL");
  await ensureColumn("play_events", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
  await ensureColumn("play_events", "updated_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
  await ensureIndex("play_events", "idx_play_events_status", "status, event_at");
  await ensureIndex("play_events", "idx_play_events_author", "author_id");

  await query(`CREATE TABLE IF NOT EXISTS social_videos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    author_id BIGINT UNSIGNED NULL,
    title VARCHAR(220) NOT NULL,
    description LONGTEXT NOT NULL,
    video_url VARCHAR(2000) NOT NULL,
    platform ENUM('youtube','instagram') NOT NULL,
    keywords TEXT NULL,
    related_type ENUM('none','book','play','post') NOT NULL DEFAULT 'none',
    related_id BIGINT UNSIGNED NULL,
    status ENUM('draft','published') NOT NULL DEFAULT 'draft',
    published_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await ensureColumn("social_videos", "author_id", "BIGINT UNSIGNED NULL");
  await ensureColumn("social_videos", "description", "LONGTEXT NOT NULL");
  await ensureColumn("social_videos", "video_url", "VARCHAR(2000) NOT NULL DEFAULT ''");
  await ensureColumn("social_videos", "platform", "ENUM('youtube','instagram') NOT NULL DEFAULT 'youtube'");
  await ensureColumn("social_videos", "keywords", "TEXT NULL");
  await ensureColumn("social_videos", "related_type", "ENUM('none','book','play','post') NOT NULL DEFAULT 'none'");
  await ensureColumn("social_videos", "related_id", "BIGINT UNSIGNED NULL");
  await ensureColumn("social_videos", "status", "ENUM('draft','published') NOT NULL DEFAULT 'draft'");
  await ensureColumn("social_videos", "published_at", "DATETIME NULL");
  await ensureColumn("social_videos", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
  await ensureColumn("social_videos", "updated_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
  await ensureIndex("social_videos", "idx_social_videos_status", "status, published_at");
  await ensureIndex("social_videos", "idx_social_videos_author", "author_id");

  return { repaired: true };
}
