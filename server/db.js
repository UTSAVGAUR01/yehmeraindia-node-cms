import 'dotenv/config';
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function ensureColumn(table, column, definition) {
  const rows = await query(
    `SELECT COUNT(*) AS total
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (!Number(rows[0]?.total)) await query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
}

export async function initializeDatabase() {
  await query(`CREATE TABLE IF NOT EXISTS users (
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
  )`);

  // Preserve accounts created by the earlier admin/user schema while moving
  // to explicit admin, author and viewer roles.
  const roleColumn = await query(
    `SELECT COLUMN_TYPE AS column_type
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'
      LIMIT 1`,
  );
  if (String(roleColumn[0]?.column_type || '').includes("'user'")) {
    await query(
      "ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'author', 'viewer', 'user') NOT NULL DEFAULT 'viewer'",
    );
    await query("UPDATE users SET role = 'viewer' WHERE role = 'user'");
  }
  await query(
    "ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'author', 'viewer') NOT NULL DEFAULT 'viewer'",
  );

  await query(`CREATE TABLE IF NOT EXISTS posts (
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
  )`);

  await ensureColumn('posts', 'image_alt', 'VARCHAR(255) NULL');
  await ensureColumn('posts', 'featured', 'TINYINT(1) NOT NULL DEFAULT 0');
  await ensureColumn('posts', 'published_at', 'DATETIME NULL');
  await ensureColumn('posts', 'keywords', 'TEXT NULL');
  await query('ALTER TABLE posts MODIFY COLUMN cover_image LONGTEXT NULL');
  await query("UPDATE posts SET published_at = COALESCE(published_at, created_at) WHERE status = 'published'");

  await query(`CREATE TABLE IF NOT EXISTS books (
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
  )`);
  await ensureColumn('books', 'keywords', 'TEXT NULL');

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
    status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
    published_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_play_events_status (status, event_at),
    KEY idx_play_events_author (author_id),
    CONSTRAINT fk_play_events_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
  )`);
  await ensureColumn('play_events', 'keywords', 'TEXT NULL');

  await query(`CREATE TABLE IF NOT EXISTS social_videos (
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
  )`);

  await query(`CREATE TABLE IF NOT EXISTS homepage_content (
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
  )`);

  await ensureColumn('homepage_content', 'about_image', 'LONGTEXT NULL');
  await ensureColumn('homepage_content', 'work_eyebrow', "VARCHAR(255) NOT NULL DEFAULT 'Selected work'");
  await ensureColumn('homepage_content', 'work_body', 'TEXT NULL');
  await ensureColumn('homepage_content', 'work_image', 'LONGTEXT NULL');
  await ensureColumn('homepage_content', 'ai_eyebrow', "VARCHAR(255) NOT NULL DEFAULT 'The AI Lab'");
  await ensureColumn('homepage_content', 'ai_image', 'LONGTEXT NULL');
  await ensureColumn('homepage_content', 'journal_eyebrow', "VARCHAR(255) NOT NULL DEFAULT 'From the journal'");
  await ensureColumn('homepage_content', 'journal_title', "VARCHAR(500) NOT NULL DEFAULT 'Notes from the page, stage and lab.'");
  await ensureColumn('homepage_content', 'journal_body', 'TEXT NULL');
  await ensureColumn('homepage_content', 'journal_image', 'LONGTEXT NULL');
  await ensureColumn('homepage_content', 'contact_title', "VARCHAR(500) NOT NULL DEFAULT 'Stories, stagecraft and ideas for tomorrow.'");
  await ensureColumn('homepage_content', 'contact_body', 'TEXT NULL');
  await ensureColumn('homepage_content', 'contact_image', 'LONGTEXT NULL');
  await ensureColumn('homepage_content', 'journal_page_eyebrow', "VARCHAR(255) NOT NULL DEFAULT 'Yeh Mera India Journal'");
  await ensureColumn('homepage_content', 'journal_page_title', "VARCHAR(500) NOT NULL DEFAULT 'Ideas from the page, the stage and the future.'");
  await ensureColumn('homepage_content', 'journal_page_body', 'TEXT NULL');
  await ensureColumn('homepage_content', 'journal_page_image', 'LONGTEXT NULL');

  await query(`INSERT IGNORE INTO homepage_content
    (id, hero_eyebrow, hero_title, hero_body, hero_image, about_eyebrow, about_title,
     about_body, work_title, ai_title, ai_body, contact_email)
    VALUES (1, ?, ?, ?, '', ?, ?, ?, ?, ?, ?, ?)` , [
      'Author · Playwright · AI Explorer',
      'Stories rooted in India.\nIdeas shaped for tomorrow.',
      'A home for stories, stagecraft, and experiments at the meeting point of culture and artificial intelligence.',
      'Writer · dramatist · curious technologist',
      'One creative life, many forms of expression.',
      'This platform presents an Indian author and playwright whose work moves between the written page, the living stage and emerging technology. Yeh Mera India is both a personal archive and an open invitation to think, feel and imagine.',
      'Words made to be read, heard and performed.',
      'New tools. Human imagination.',
      'Experiments with generative art, multilingual storytelling and research tools, always guided by authorship, attribution and respect for culture.',
      'hello@yehmeraindia.com',
    ]);

  await query(`CREATE TABLE IF NOT EXISTS author_messages (
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
  )`);

  await query(`CREATE TABLE IF NOT EXISTS ai_settings (
    id TINYINT UNSIGNED NOT NULL DEFAULT 1,
    admin_text_model VARCHAR(100) NOT NULL,
    author_text_model VARCHAR(100) NOT NULL,
    image_model VARCHAR(100) NOT NULL,
    updated_by BIGINT UNSIGNED NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_ai_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
  )`);
  const allowedTextModels = new Set(['gpt-5.5', 'gpt-5.4', 'gpt-5.4-mini', 'gpt-5-mini', 'gpt-4.1-mini']);
  const allowedImageModels = new Set(['gpt-image-2', 'gpt-image-1-mini', 'gpt-image-1']);
  const adminTextModel = allowedTextModels.has(process.env.OPENAI_TEXT_MODEL)
    ? process.env.OPENAI_TEXT_MODEL
    : 'gpt-5.5';
  const authorTextModel = allowedTextModels.has(process.env.OPENAI_AUTHOR_TEXT_MODEL)
    ? process.env.OPENAI_AUTHOR_TEXT_MODEL
    : adminTextModel;
  const imageModel = allowedImageModels.has(process.env.OPENAI_IMAGE_MODEL)
    ? process.env.OPENAI_IMAGE_MODEL
    : 'gpt-image-2';
  await query(
    `INSERT IGNORE INTO ai_settings (id, admin_text_model, author_text_model, image_model)
     VALUES (1, ?, ?, ?)`,
    [
      adminTextModel,
      authorTextModel,
      imageModel,
    ],
  );

  await query(`CREATE TABLE IF NOT EXISTS ai_jobs (
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
  )`);
  await query(
    "ALTER TABLE ai_jobs MODIFY COLUMN job_type ENUM('rewrite', 'page_rewrite', 'post_image', 'page_image', 'book_image') NOT NULL",
  );
  await query("DELETE FROM ai_jobs WHERE expires_at < NOW()");

  const counts = await query('SELECT COUNT(*) AS total FROM posts');
  if (!Number(counts[0]?.total)) {
    await query(
      `INSERT INTO posts (author_id, title, slug, excerpt, content, cover_image, image_alt, category, status, featured, published_at)
       VALUES (NULL, ?, ?, ?, ?, '', ?, 'Journal', 'published', 1, NOW())`,
      [
        'Welcome to Yeh Mera India',
        'welcome-to-yeh-mera-india',
        'A new stage for stories rooted in India and ideas shaped for tomorrow.',
        "Yeh Mera India brings literature, theatre, culture and responsible experiments with artificial intelligence into one living archive.\n\nEvery post begins with a human point of view. Technology helps us research, translate, illustrate and reach more readers, but the author's voice remains at the centre.",
        'A writer working beside an Indian theatre stage'
      ]
    );
  }
}
