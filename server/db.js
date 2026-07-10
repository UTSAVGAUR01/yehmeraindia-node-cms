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
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
  )`);

  await query(`CREATE TABLE IF NOT EXISTS posts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    author_id BIGINT UNSIGNED NULL,
    title VARCHAR(220) NOT NULL,
    slug VARCHAR(260) NOT NULL,
    excerpt TEXT NULL,
    content LONGTEXT NOT NULL,
    cover_image LONGTEXT NULL,
    image_alt VARCHAR(255) NULL,
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
  await query('ALTER TABLE posts MODIFY COLUMN cover_image LONGTEXT NULL');
  await query("UPDATE posts SET published_at = COALESCE(published_at, created_at) WHERE status = 'published'");

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
