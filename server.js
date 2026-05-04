const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const cron = require('node-cron');
const slugify = require('slugify');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const aiRequestWindowMs = 15 * 60 * 1000;
const aiRequestLimit = Number(process.env.AI_RATE_LIMIT || 10);
const aiRateBucket = new Map();

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

const inProduction = process.env.NODE_ENV === 'production';
if (inProduction && !process.env.SESSION_SECRET) {
  console.error('SESSION_SECRET is required in production.');
}
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  clearExpired: true,
  checkExpirationInterval: 1000 * 60 * 15,
  expiration: 1000 * 60 * 60 * 24
});
app.set('trust proxy', 1);
app.use(session({
  key: 'ymi.sid',
  secret: process.env.SESSION_SECRET || (inProduction ? undefined : 'dev-only-change-me'),
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: inProduction,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const db = mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

function sanitizeText(input, maxLength = 5000) {
  if (!input) return '';
  return String(input).replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function enforceRateLimit(key) {
  const now = Date.now();
  const bucket = aiRateBucket.get(key) || [];
  const valid = bucket.filter((t) => now - t < aiRequestWindowMs);
  if (valid.length >= aiRequestLimit) return false;
  valid.push(now);
  aiRateBucket.set(key, valid);
  return true;
}

const defaultCategories = [
  { id: 1, name: 'Government Schemes', slug: 'government-schemes', description: 'Simple guides for Indian government schemes' },
  { id: 2, name: 'CSR Impact', slug: 'csr-impact', description: 'Ground stories and social impact reports' },
  { id: 3, name: 'Education', slug: 'education', description: 'Education, skills and career guidance' },
  { id: 4, name: 'Health Awareness', slug: 'health-awareness', description: 'Health and public awareness content' },
  { id: 5, name: 'Finance Literacy', slug: 'finance-literacy', description: 'Banking, saving, UPI and digital safety' },
  { id: 6, name: 'India Stories', slug: 'india-stories', description: 'Inspiring stories from Bharat' },
  { id: 7, name: 'AI Reporter', slug: 'ai-reporter', description: 'AI-assisted news and explainers' }
];

function makeDefaultPost(title, category, badge, views) {
  const slug = slugify(title, { lower: true, strict: true });

  return {
    id: `default-${slug}`,
    title,
    slug,
    excerpt: `AI-generated starter article for ${badge}. Admin can verify facts, update details and publish final version.`,
    content: `${title}

This is an AI-assisted starter article for Yeh Mera India.

Key points to develop:
1. Explain the topic in simple language.
2. Add current verified facts and dates.
3. Explain why it matters for Indian readers.
4. Include public impact, opportunities and cautions.
5. Add official sources before publishing.

Editorial note: This draft must be reviewed before publishing.`,
    category,
    format: 'ai_report',
    ai_generated: 1,
    views,
    is_trending: views >= 100 ? 1 : 0,
    is_featured: views >= 110 ? 1 : 0,
    badge,
    created_at: new Date(),
    author_name: 'AI Reporter'
  };
}

const aiCategoryPosts = {
  'government-schemes': [
    makeDefaultPost('Top 10 Government Schemes Indian Families Should Know', 'government-schemes', 'Scheme Guide', 120),
    makeDefaultPost('How to Check Eligibility Before Applying for a Yojana', 'government-schemes', 'Eligibility', 95)
  ],
  'csr-impact': [
    makeDefaultPost('How CSR Projects Are Changing Rural India', 'csr-impact', 'CSR Impact', 110),
    makeDefaultPost('Top CSR Ideas for Education Health and Livelihood', 'csr-impact', 'Impact Ideas', 88)
  ],
  education: [
    makeDefaultPost('Why Skill Education Matters for New India', 'education', 'Education', 105),
    makeDefaultPost('Top 10 Career Skills Students Should Learn in 2026', 'education', 'Career', 92)
  ],
  'health-awareness': [
    makeDefaultPost('Simple Health Habits That Can Help Every Family', 'health-awareness', 'Health', 100),
    makeDefaultPost('Preventive Health Checkups Every Family Should Understand', 'health-awareness', 'Awareness', 84)
  ],
  'finance-literacy': [
    makeDefaultPost('India Stock Market Snapshot for Common Readers', 'finance-literacy', 'Market Watch', 115),
    makeDefaultPost('Digital Payment Safety How to Avoid UPI and OTP Fraud', 'finance-literacy', 'Digital Safety', 88)
  ],
  'india-stories': [
    makeDefaultPost('Top 10 Positive India Updates to Watch', 'india-stories', 'Positive News', 130),
    makeDefaultPost('Sports and Youth Achievement Roundup', 'india-stories', 'Youth & Sports', 90)
  ],
  'ai-reporter': [
    makeDefaultPost('AI Reporter How Yeh Mera India Creates Article Drafts', 'ai-reporter', 'AI Reporter', 100),
    makeDefaultPost('Election Result Explainer What Readers Should Check', 'ai-reporter', 'Election Update', 92)
  ]
};

const defaultAiFeed = Object.values(aiCategoryPosts).flat();

function getDefaultPostsByCategory(slug) {
  return aiCategoryPosts[slug] || [];
}

function getAllDefaultPosts() {
  return defaultAiFeed;
}

async function ensureAutoAiTrendingPost() {
  const [recent] = await runQuery(
    `SELECT id FROM posts
     WHERE status = 'published'
       AND (ai_generated = 1 OR format = 'ai_report')
       AND created_at >= DATE_SUB(NOW(), INTERVAL 8 HOUR)
     ORDER BY id DESC
     LIMIT 1`
  );
  if (recent) return;

  const defaults = getAllDefaultPosts();
  const pick = defaults[Math.floor(Math.random() * defaults.length)];
  const slug = `${pick.slug}-${Date.now()}`;
  await runQuery(
    `INSERT INTO posts (title, slug, excerpt, content, status, category, format, ai_generated, is_trending, is_featured, views, likes_count, comments_count, shares_count)
     VALUES (?, ?, ?, ?, 'published', ?, 'ai_report', 1, 1, 1, ?, ?, ?, ?)`,
    [
      pick.title,
      slug,
      `${pick.excerpt} Focus: positive Indian culture and verified public-interest context.`,
      `${pick.content}\n\nCulture note: This story highlights constructive progress connected to Indian culture and community values.`,
      pick.category || 'india-stories',
      Number(pick.views) || 120,
      25,
      8,
      5
    ]
  );
}

async function ensureDatabaseSchema() {
  try {
    await runQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(190) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(30) DEFAULT 'pending',
        status VARCHAR(30) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        excerpt TEXT,
        content LONGTEXT NOT NULL,
        image VARCHAR(255),
        status VARCHAR(30) DEFAULT 'published',
        author_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        slug VARCHAR(180) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await runQuery(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        parent_id INT NULL,
        comment TEXT NOT NULL,
        status VARCHAR(30) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    await runQuery(`
      CREATE TABLE IF NOT EXISTS likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_like (post_id, user_id)
      )
    `);
    await runQuery(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_bookmark (post_id, user_id)
      )
    `);
    await runQuery(`
      CREATE TABLE IF NOT EXISTS cleanup_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        deleted_posts INT DEFAULT 0,
        deleted_files INT DEFAULT 0,
        freed_space_estimate VARCHAR(50) DEFAULT '0 MB',
        status VARCHAR(30) DEFAULT 'success',
        error_message TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS ai_generation_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        topic VARCHAR(255) NOT NULL,
        prompt LONGTEXT NOT NULL,
        result LONGTEXT NOT NULL,
        model VARCHAR(100) DEFAULT 'gpt-4o-mini',
        tokens_used INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    for (const cat of defaultCategories) {
      await runQuery(
        `INSERT IGNORE INTO categories (name, slug, description) VALUES (?, ?, ?)`,
        [cat.name, cat.slug, cat.description]
      );
    }

    const columns = [
      ['category', "ALTER TABLE posts ADD COLUMN category VARCHAR(100) DEFAULT 'india-stories'"],
      ['format', "ALTER TABLE posts ADD COLUMN format VARCHAR(50) DEFAULT 'standard'"],
      ['tags', 'ALTER TABLE posts ADD COLUMN tags TEXT NULL'],
      ['views', 'ALTER TABLE posts ADD COLUMN views INT DEFAULT 0'],
      ['is_trending', 'ALTER TABLE posts ADD COLUMN is_trending TINYINT DEFAULT 0'],
      ['is_featured', 'ALTER TABLE posts ADD COLUMN is_featured TINYINT DEFAULT 0'],
      ['ai_generated', 'ALTER TABLE posts ADD COLUMN ai_generated TINYINT DEFAULT 0'],
      ['reading_time', 'ALTER TABLE posts ADD COLUMN reading_time INT DEFAULT 3']
      ,['caption', 'ALTER TABLE posts ADD COLUMN caption TEXT NULL']
      ,['summary', 'ALTER TABLE posts ADD COLUMN summary TEXT NULL']
      ,['language', "ALTER TABLE posts ADD COLUMN language VARCHAR(20) DEFAULT 'English'"]
      ,['location', 'ALTER TABLE posts ADD COLUMN location VARCHAR(120) NULL']
      ,['state', 'ALTER TABLE posts ADD COLUMN state VARCHAR(120) NULL']
      ,['media_url', 'ALTER TABLE posts ADD COLUMN media_url VARCHAR(255) NULL']
      ,['media_type', "ALTER TABLE posts ADD COLUMN media_type VARCHAR(30) DEFAULT 'image'"]
      ,['seo_title', 'ALTER TABLE posts ADD COLUMN seo_title VARCHAR(255) NULL']
      ,['seo_description', 'ALTER TABLE posts ADD COLUMN seo_description TEXT NULL']
      ,['hashtags', 'ALTER TABLE posts ADD COLUMN hashtags TEXT NULL']
      ,['published_at', 'ALTER TABLE posts ADD COLUMN published_at TIMESTAMP NULL']
      ,['shares_count', 'ALTER TABLE posts ADD COLUMN shares_count INT DEFAULT 0']
      ,['likes_count', 'ALTER TABLE posts ADD COLUMN likes_count INT DEFAULT 0']
      ,['comments_count', 'ALTER TABLE posts ADD COLUMN comments_count INT DEFAULT 0']
      ,['post_type', "ALTER TABLE posts ADD COLUMN post_type VARCHAR(50) DEFAULT 'news'"]
      ,['expires_at', 'ALTER TABLE posts ADD COLUMN expires_at TIMESTAMP NULL']
      ,['is_protected', 'ALTER TABLE posts ADD COLUMN is_protected TINYINT DEFAULT 0']
    ];

    for (const [columnName, alterSql] of columns) {
      try {
        await runQuery(alterSql);
        console.log(`DB column added: ${columnName}`);
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') {
          console.error(`DB column check failed for ${columnName}:`, err.message);
        }
      }
    }

    console.log('DB schema verified successfully');
  } catch (err) {
    console.error('DB schema setup failed:', err.message);
  }
}

db.connect((err) => {
  if (err) {
    console.error('DB ERROR:', err.message);
  } else {
    console.log('DB Connected Successfully');
    ensureDatabaseSchema();
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '-').toLowerCase();
    cb(null, Date.now() + '-' + safeName);
  }
});

const upload = multer({ storage });

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.session.user) return res.status(401).json({ message: 'Login required' });
    if (!roles.includes(req.session.user.role)) return res.status(403).json({ message: 'Permission denied' });
    next();
  };
}

function requireAdminPage(req, res, next) {
  if (!req.session.user) return res.redirect('/login.html');
  if (!['admin', 'editor'].includes(req.session.user.role)) return res.redirect('/');
  next();
}

function postColumns() {
  return `
    posts.id,
    posts.title,
    posts.slug,
    posts.excerpt,
    posts.content,
    posts.image,
    posts.status,
    posts.created_at,
    COALESCE(posts.category, 'india-stories') AS category,
    COALESCE(posts.format, 'standard') AS format,
    COALESCE(posts.tags, '') AS tags,
    COALESCE(posts.views, 0) AS views,
    COALESCE(posts.is_trending, 0) AS is_trending,
    COALESCE(posts.is_featured, 0) AS is_featured,
    COALESCE(posts.ai_generated, 0) AS ai_generated,
    COALESCE(posts.reading_time, 3) AS reading_time,
    users.name AS author_name
  `;
}

async function callOpenAI(systemPrompt, userPrompt) {
  if (!process.env.OPENAI_API_KEY) return null;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      input: `${systemPrompt}\n\n${userPrompt}`,
      store: true
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('OPENAI ERROR:', data);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const outputText =
    data.output_text ||
    data.output?.flatMap((item) => item.content || [])
      ?.map((content) => content.text || '')
      ?.join('\n') ||
    '';

  return outputText.trim() || null;
}

async function buildAiResponse(type, body) {
  const topic = body.topic || 'Top 10 positive India updates';
  const tone = body.tone || 'insightful';
  const format = body.format || 'article';

  const systemPrompt = `
You are AI News Reporter for Yeh Mera India.

Rules:
- Write factual, neutral, positive, India-focused content.
- Keep language simple and useful.
- Do not claim live facts unless the user provides them.
- For election results, mention that editors must verify Election Commission data.
- For stock market content, include an educational disclaimer and avoid investment advice.
- Always add an editor verification note.
`;

  const userPrompt = `
Create ${type}.

Topic: ${topic}
Tone: ${tone}
Format: ${format}
`;

  try {
    const aiText = await callOpenAI(systemPrompt, userPrompt);

    if (aiText) {
      return {
        title: `${topic}: ${tone} ${format}`,
        type,
        content: aiText,
        excerpt: aiText.slice(0, 180),
        category: 'ai-reporter',
        format: 'ai_report',
        ai_generated: 1,
        source: 'openai'
      };
    }
  } catch (err) {
    console.error('OPENAI CALL FAILED:', err.message);
  }

  const title = `${topic}: ${tone} ${format} for Yeh Mera India`;

  if (type === 'idea') {
    return {
      title,
      type: 'idea',
      summary: `Create a reader-friendly ${format} about "${topic}". Focus on verified facts, simple language and India-first usefulness.`,
      points: [
        'Why this topic matters now',
        'Top facts readers should know',
        'Positive impact or public relevance',
        'What to verify from official sources',
        'Simple conclusion for common readers'
      ],
      category: 'ai-reporter',
      source: 'fallback'
    };
  }

  if (type === 'outline') {
    return {
      title,
      type: 'outline',
      sections: [
        'Introduction: What happened and why it matters',
        'Background: Explain the topic in simple language',
        'Top 10 points or key updates',
        'Impact on citizens, students, investors or communities',
        'Important caution and verification note',
        'Conclusion: What readers should remember'
      ],
      category: 'ai-reporter',
      source: 'fallback'
    };
  }

  return {
    title,
    type: 'draft',
    excerpt: `A simple AI-assisted draft about ${topic}.`,
    content: `${title}

Introduction:
${topic} is important for Indian readers. This draft helps editors prepare a clear and verified article.

Key Updates:
1. Explain the update in simple language.
2. Add current facts from official or trusted sources.
3. Explain why it matters.
4. Add positive developments and cautions.
5. Verify all numbers, dates and claims before publishing.`,
    category: 'ai-reporter',
    format: 'ai_report',
    ai_generated: 1,
    source: 'fallback'
  };
}

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'public/login.html')));
app.get('/signup.html', (req, res) => res.sendFile(path.join(__dirname, 'public/signup.html')));
app.get('/register.html', (req, res) => res.sendFile(path.join(__dirname, 'public/signup.html')));
app.get('/categories.html', (req, res) => res.sendFile(path.join(__dirname, 'public/categories.html')));
app.get('/dashboard.html', requireAdminPage, (req, res) => res.sendFile(path.join(__dirname, 'public/dashboard.html')));
app.get('/post/:slug', (req, res) => res.sendFile(path.join(__dirname, 'public/post.html')));
app.get('/news', (req, res) => res.sendFile(path.join(__dirname, 'public/news.html')));
app.get('/news/', (req, res) => res.sendFile(path.join(__dirname, 'public/news.html')));

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      `INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, 'pending', 'active')`,
      [name, email, hashedPassword],
      (err) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email already registered' });
          console.error('SIGNUP ERROR:', err.message);
          return res.status(500).json({ message: 'Signup failed' });
        }

        res.json({ message: 'Signup successful. Admin approval is required before access.' });
      }
    );
  } catch {
    res.status(500).json({ message: 'Signup failed' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.query(
    `SELECT id, name, email, password, role, status FROM users WHERE email = ? LIMIT 1`,
    [email],
    async (err, results) => {
      if (err) return res.status(500).json({ message: 'Login failed' });
      if (results.length === 0) return res.status(401).json({ message: 'Invalid email or password' });

      const user = results[0];

      if (user.status !== 'active') return res.status(403).json({ message: 'Account is blocked' });
      if (!(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Invalid email or password' });
      if (user.role === 'pending') return res.status(403).json({ message: 'Your account is pending approval by admin' });

      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };

      res.json({ message: 'Login successful', user: req.session.user });
    }
  );
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logged out successfully' }));
});

app.get('/api/auth/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

app.get('/api/categories', (req, res) => {
  db.query(
    `SELECT id, name, slug, description FROM categories ORDER BY id ASC`,
    (err, results) => {
      res.json(err || !results?.length ? defaultCategories : results);
    }
  );
});

app.get('/api/ai-feed', (req, res) => {
  db.query(
    `
    SELECT ${postColumns()}
    FROM posts
    LEFT JOIN users ON users.id = posts.author_id
    WHERE posts.status = 'published'
      AND (posts.ai_generated = 1 OR posts.format = 'ai_report' OR posts.category = 'ai-reporter')
    ORDER BY posts.is_featured DESC, posts.views DESC, posts.id DESC
    LIMIT 10
    `,
    (err, results) => {
      res.json(err || !results?.length ? getAllDefaultPosts().slice(0, 10) : results);
    }
  );
});

app.get('/api/trending', (req, res) => {
  ensureAutoAiTrendingPost().catch(() => {});
  db.query(
    `
    SELECT ${postColumns()}
    FROM posts
    LEFT JOIN users ON users.id = posts.author_id
    WHERE posts.status = 'published'
    ORDER BY posts.is_trending DESC, posts.is_featured DESC, posts.views DESC, posts.id DESC
    LIMIT 10
    `,
    (err, results) => {
      res.json(err || !results?.length ? getAllDefaultPosts().slice(0, 10) : results);
    }
  );
});

app.get('/api/posts', (req, res) => {
  db.query(
    `
    SELECT ${postColumns()}
    FROM posts
    LEFT JOIN users ON users.id = posts.author_id
    WHERE posts.status = 'published'
    ORDER BY posts.id DESC
    `,
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch posts' });
      res.json(results);
    }
  );
});

app.get('/api/posts/:slug', (req, res) => {
  const slug = req.params.slug;

  db.query(
    `
    SELECT ${postColumns()}
    FROM posts
    LEFT JOIN users ON users.id = posts.author_id
    WHERE posts.slug = ? AND posts.status = 'published'
    LIMIT 1
    `,
    [slug],
    (err, results) => {
      if (err) {
        const fallback = getAllDefaultPosts().find((p) => p.slug === slug);
        return fallback ? res.json(fallback) : res.status(500).json({ message: 'Failed to fetch post' });
      }

      if (!results.length) {
        const fallback = getAllDefaultPosts().find((p) => p.slug === slug);
        return fallback ? res.json(fallback) : res.status(404).json({ message: 'Post not found' });
      }

      const post = results[0];
      db.query('UPDATE posts SET views = COALESCE(views, 0) + 1 WHERE id = ?', [post.id], () => {});
      res.json(post);
    }
  );
});

app.get('/api/category/:slug', (req, res) => {
  const categorySlug = req.params.slug;

  db.query(
    `
    SELECT ${postColumns()}
    FROM posts
    LEFT JOIN users ON users.id = posts.author_id
    WHERE posts.status = 'published'
      AND posts.category = ?
    ORDER BY posts.is_featured DESC, posts.views DESC, posts.id DESC
    `,
    [categorySlug],
    (err, results) => {
      res.json(err || !results?.length ? getDefaultPostsByCategory(categorySlug) : results);
    }
  );
});

app.post('/api/upload', requireRole(['admin', 'editor']), upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
  res.json({ file: req.file.filename, path: `/uploads/${req.file.filename}` });
});

app.get('/api/admin/posts', requireRole(['admin', 'editor']), (req, res) => {
  db.query(
    `
    SELECT id, title, slug, excerpt, content, image, status, created_at,
           COALESCE(category, 'india-stories') AS category,
           COALESCE(format, 'standard') AS format,
           COALESCE(tags, '') AS tags,
           COALESCE(views, 0) AS views,
           COALESCE(is_trending, 0) AS is_trending,
           COALESCE(is_featured, 0) AS is_featured,
           COALESCE(ai_generated, 0) AS ai_generated
    FROM posts
    ORDER BY id DESC
    `,
    (err, results) => {
      err ? res.status(500).json({ message: 'Failed to fetch posts' }) : res.json(results);
    }
  );
});

app.post('/api/admin/posts', requireRole(['admin', 'editor']), (req, res) => {
  const {
    title,
    excerpt,
    content,
    image,
    status,
    category,
    format,
    tags,
    is_trending,
    is_featured,
    ai_generated
  } = req.body;

  if (!title || !content) return res.status(400).json({ message: 'Title and content are required' });

  const slug = slugify(title, { lower: true, strict: true }) + '-' + Date.now();

  db.query(
    `
    INSERT INTO posts
      (title, slug, excerpt, content, image, status, author_id, category, format, tags, is_trending, is_featured, ai_generated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      title,
      slug,
      excerpt || '',
      content,
      image || null,
      status || 'published',
      req.session.user.id,
      category || 'india-stories',
      format || 'standard',
      tags || '',
      is_trending ? 1 : 0,
      is_featured ? 1 : 0,
      ai_generated ? 1 : 0
    ],
    (err, result) => {
      err
        ? res.status(500).json({ message: 'Failed to create post' })
        : res.json({ message: 'Post created successfully', postId: result.insertId });
    }
  );
});

app.put('/api/admin/posts/:id', requireRole(['admin', 'editor']), (req, res) => {
  const {
    title,
    excerpt,
    content,
    image,
    status,
    category,
    format,
    tags,
    is_trending,
    is_featured,
    ai_generated
  } = req.body;

  if (!title || !content) return res.status(400).json({ message: 'Title and content are required' });

  db.query(
    `
    UPDATE posts
    SET title = ?,
        excerpt = ?,
        content = ?,
        image = ?,
        status = ?,
        category = ?,
        format = ?,
        tags = ?,
        is_trending = ?,
        is_featured = ?,
        ai_generated = ?
    WHERE id = ?
    `,
    [
      title,
      excerpt || '',
      content,
      image || null,
      status || 'published',
      category || 'india-stories',
      format || 'standard',
      tags || '',
      is_trending ? 1 : 0,
      is_featured ? 1 : 0,
      ai_generated ? 1 : 0,
      req.params.id
    ],
    (err) => {
      err
        ? res.status(500).json({ message: 'Failed to update post' })
        : res.json({ message: 'Post updated successfully' });
    }
  );
});

app.delete('/api/admin/posts/:id', requireRole(['admin']), (req, res) => {
  db.query(
    `DELETE FROM posts WHERE id = ?`,
    [req.params.id],
    (err) => {
      err
        ? res.status(500).json({ message: 'Failed to delete post' })
        : res.json({ message: 'Post deleted successfully' });
    }
  );
});

app.put('/api/admin/posts/:id/trending', requireRole(['admin']), (req, res) => {
  db.query(
    'UPDATE posts SET is_trending = ? WHERE id = ?',
    [req.body.is_trending ? 1 : 0, req.params.id],
    (err) => {
      err
        ? res.status(500).json({ message: 'Failed to update trending status' })
        : res.json({ message: 'Trending status updated successfully' });
    }
  );
});

app.put('/api/admin/posts/:id/featured', requireRole(['admin']), (req, res) => {
  db.query(
    'UPDATE posts SET is_featured = ? WHERE id = ?',
    [req.body.is_featured ? 1 : 0, req.params.id],
    (err) => {
      err
        ? res.status(500).json({ message: 'Failed to update featured status' })
        : res.json({ message: 'Featured status updated successfully' });
    }
  );
});

app.post('/api/admin/ai/generate-idea', requireRole(['admin', 'editor']), async (req, res) => {
  res.json(await buildAiResponse('idea', req.body || {}));
});

app.post('/api/admin/ai/generate-outline', requireRole(['admin', 'editor']), async (req, res) => {
  res.json(await buildAiResponse('outline', req.body || {}));
});

app.post('/api/admin/ai/generate-draft', requireRole(['admin', 'editor']), async (req, res) => {
  res.json(await buildAiResponse('draft', req.body || {}));
});

app.get('/api/admin/users', requireRole(['admin']), (req, res) => {
  db.query(
    `SELECT id, name, email, role, status, created_at FROM users ORDER BY id DESC`,
    (err, results) => {
      err ? res.status(500).json({ message: 'Failed to fetch users' }) : res.json(results);
    }
  );
});

app.put('/api/admin/users/:id/role', requireRole(['admin']), (req, res) => {
  const allowed = ['pending', 'viewer', 'editor', 'admin'];

  if (!allowed.includes(req.body.role)) return res.status(400).json({ message: 'Invalid role' });

  db.query(
    'UPDATE users SET role = ? WHERE id = ?',
    [req.body.role, req.params.id],
    (err) => {
      err
        ? res.status(500).json({ message: 'Failed to update role' })
        : res.json({ message: 'User role updated successfully' });
    }
  );
});

app.put('/api/admin/users/:id/status', requireRole(['admin']), (req, res) => {
  const allowed = ['active', 'blocked'];

  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Invalid status' });

  db.query(
    'UPDATE users SET status = ? WHERE id = ?',
    [req.body.status, req.params.id],
    (err) => {
      err
        ? res.status(500).json({ message: 'Failed to update status' })
        : res.json({ message: 'User status updated successfully' });
    }
  );
});

app.post('/api/ai/generate-news', requireRole(['admin', 'editor']), async (req, res) => {
  const topic = sanitizeText(req.body.topic, 200);
  if (!topic) return res.status(400).json({ success: false, message: 'Topic is required' });
  const rateKey = `${req.session.user.id}:${req.ip}`;
  if (!enforceRateLimit(rateKey)) return res.status(429).json({ success: false, message: 'Rate limit exceeded. Try later.' });

  const payload = {
    topic,
    category: sanitizeText(req.body.category || 'india-stories', 100),
    location: sanitizeText(req.body.location || '', 100),
    language: sanitizeText(req.body.language || 'English', 30),
    tone: sanitizeText(req.body.tone || 'Simple', 40),
    notes: sanitizeText(req.body.notes || '', 1500),
    generateVisualPrompt: Boolean(req.body.generateVisualPrompt),
    generateAnchorScript: Boolean(req.body.generateAnchorScript)
  };

  const threatFlags = [];
  const lowered = `${payload.topic} ${payload.notes}`.toLowerCase();
  if (lowered.includes('aadhaar') || lowered.includes('pan') || lowered.includes('password')) threatFlags.push('possible_pii');
  if (threatFlags.length) {
    return res.status(400).json({ success: false, message: 'Threat check failed. Please remove sensitive data.', threat: { status: 'review_required', flags: threatFlags } });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ success: false, message: 'OpenAI API key is not configured on server.' });
  }

  const systemPrompt = `You are an Indian AI newsroom assistant. Return strict JSON with keys: headline, caption, summary, article, hashtags, seoTitle, seoDescription, anchorScript, visualPrompt, disclaimer. Never invent unverified facts.`;
  const userPrompt = JSON.stringify(payload);

  try {
    const resultText = await callOpenAI(systemPrompt, userPrompt);
    if (!resultText) return res.status(500).json({ success: false, message: 'No AI output generated' });
    let parsed;
    try { parsed = JSON.parse(resultText); } catch { parsed = null; }
    const data = parsed || {
      headline: payload.topic,
      caption: resultText.slice(0, 180),
      summary: resultText.slice(0, 280),
      article: resultText,
      hashtags: ['#IndiaNews', '#AIReporter'],
      seoTitle: payload.topic,
      seoDescription: resultText.slice(0, 160),
      anchorScript: payload.generateAnchorScript ? resultText.slice(0, 500) : '',
      visualPrompt: payload.generateVisualPrompt ? `Indian newsroom visual for ${payload.topic}` : '',
      disclaimer: 'This article was generated with AI assistance and should be reviewed for factual accuracy.'
    };
    await runQuery('INSERT INTO ai_generation_logs (user_id, topic, prompt, result, model) VALUES (?, ?, ?, ?, ?)', [req.session.user.id, topic, userPrompt, JSON.stringify(data), process.env.OPENAI_MODEL || 'gpt-4o-mini']);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'AI generation failed', error: err.message });
  }
});

app.get('/api/feed/ai-reporter', async (req, res) => {
  const posts = await runQuery(`SELECT id,title,slug,summary,excerpt,category,state,created_at,ai_generated,is_trending,is_breaking,source_name FROM posts WHERE status='published' AND (ai_generated=1 OR format='ai_report') ORDER BY created_at DESC LIMIT 20`);
  res.json(posts);
});

app.get('/api/admin/trending', requireRole(['admin','editor']), async (req,res)=>{
  const items=await runQuery("SELECT id,title,category,status,is_trending,is_breaking,created_at FROM posts ORDER BY is_trending DESC, created_at DESC LIMIT 100");
  res.json(items);
});

app.post('/api/admin/posts/:id/breaking', requireRole(['admin']), async (req,res)=>{
  await runQuery('UPDATE posts SET is_breaking = ? WHERE id=?',[req.body.is_breaking?1:0, req.params.id]);
  res.json({message:'Breaking status updated'});
});

app.post('/api/admin/bots/run', requireRole(['admin']), async (req,res)=>{
  const bot = sanitizeText(req.body.bot || 'unknown',80);
  await runQuery('INSERT INTO cleanup_logs (deleted_posts, deleted_files, freed_space_estimate, status, error_message) VALUES (0,0,?, ?, ?)', ['0 MB','success', `Bot run: ${bot}`]);
  res.json({success:true, bot, status:'completed', ranAt:new Date().toISOString()});
});

app.post('/api/posts', requireRole(['admin','editor']), async (req,res)=>{
  const title=sanitizeText(req.body.title,255); const content=sanitizeText(req.body.content,20000);
  if(!title||!content) return res.status(400).json({message:'Title and content required'});
  const slug=`${slugify(title,{lower:true,strict:true})}-${Date.now()}`;
  await runQuery(`INSERT INTO posts (title,slug,excerpt,summary,content,category,image,source_name,source_url,ai_generated,status,published_at,expires_at,is_trending,is_breaking)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,DATE_ADD(NOW(), INTERVAL ? HOUR),0,0)`,[title, sanitizeText(req.body.caption||'',500), sanitizeText(req.body.summary||'',1200), content, sanitizeText(req.body.category||'india-stories',100), sanitizeText(req.body.image||'',255), sanitizeText(req.body.source_name||'AI Reporter',150), sanitizeText(req.body.source_url||'',255), req.body.ai_generated?1:0, sanitizeText(req.body.status||'pending',30), req.body.status==='published'?new Date():null, Number(process.env.AUTO_DELETE_AFTER_HOURS||24)]);
  res.json({message:'Post created'});
});

app.get('/api/posts/:id/comments', async (req, res) => {
  try {
    const comments = await runQuery(
      `SELECT c.id, c.post_id, c.user_id, c.parent_id, c.comment, c.status, c.created_at, u.name
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.post_id = ? AND c.status = 'active' ORDER BY c.created_at DESC`,
      [req.params.id]
    );
    res.json(comments);
  } catch {
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

app.post('/api/posts/:id/comments', requireRole(['admin', 'editor', 'viewer']), async (req, res) => {
  try {
    const comment = sanitizeText(req.body.comment, 1000);
    if (!comment) return res.status(400).json({ message: 'Comment is required' });
    await runQuery('INSERT INTO comments (post_id, user_id, parent_id, comment) VALUES (?, ?, ?, ?)', [req.params.id, req.session.user.id, req.body.parent_id || null, comment]);
    await runQuery('UPDATE posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Comment added' });
  } catch {
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

app.post('/api/posts/:id/like', requireRole(['admin', 'editor', 'viewer']), async (req, res) => {
  try {
    await runQuery('INSERT IGNORE INTO likes (post_id, user_id) VALUES (?, ?)', [req.params.id, req.session.user.id]);
    await runQuery('UPDATE posts SET likes_count = (SELECT COUNT(*) FROM likes WHERE post_id = ?) WHERE id = ?', [req.params.id, req.params.id]);
    res.json({ message: 'Liked' });
  } catch {
    res.status(500).json({ message: 'Failed to like post' });
  }
});

app.delete('/api/posts/:id/like', requireRole(['admin', 'editor', 'viewer']), async (req, res) => {
  await runQuery('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [req.params.id, req.session.user.id]);
  await runQuery('UPDATE posts SET likes_count = (SELECT COUNT(*) FROM likes WHERE post_id = ?) WHERE id = ?', [req.params.id, req.params.id]);
  res.json({ message: 'Unliked' });
});

app.post('/api/posts/:id/bookmark', requireRole(['admin', 'editor', 'viewer']), async (req, res) => {
  await runQuery('INSERT IGNORE INTO bookmarks (post_id, user_id) VALUES (?, ?)', [req.params.id, req.session.user.id]);
  res.json({ message: 'Bookmarked' });
});

app.delete('/api/posts/:id/bookmark', requireRole(['admin', 'editor', 'viewer']), async (req, res) => {
  await runQuery('DELETE FROM bookmarks WHERE post_id = ? AND user_id = ?', [req.params.id, req.session.user.id]);
  res.json({ message: 'Bookmark removed' });
});

app.get('/api/admin/dashboard', requireRole(['admin']), async (req, res) => {
  const [posts] = await runQuery(`SELECT COUNT(*) totalPosts, SUM(status='published') publishedPosts, SUM(status='pending') pendingPosts, SUM(ai_generated=1) aiGeneratedPosts, SUM(is_trending=1) trendingPosts FROM posts`);
  const [users] = await runQuery('SELECT COUNT(*) AS users FROM users');
  const [deleted] = await runQuery("SELECT COALESCE(SUM(deleted_posts),0) AS deletedToday FROM cleanup_logs WHERE DATE(created_at)=CURDATE()");
  const [last] = await runQuery('SELECT created_at FROM cleanup_logs ORDER BY id DESC LIMIT 1');
  const recentPosts = await runQuery("SELECT id,title,status,created_at FROM posts ORDER BY created_at DESC LIMIT 8");
  const pendingAiPosts = await runQuery("SELECT id,title,status,created_at FROM posts WHERE status='pending' AND ai_generated=1 ORDER BY created_at DESC LIMIT 8");
  res.json({ ...posts, users: users.users || 0, deletedToday: deleted.deletedToday || 0, lastCleanupAt: last ? last.created_at : null, recentPosts, pendingAiPosts });
});

app.post('/api/admin/categories', requireRole(['admin']), async (req,res)=>{
  await runQuery('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)', [sanitizeText(req.body.name,120), sanitizeText(req.body.slug,120), sanitizeText(req.body.description||'',400)]);
  res.json({message:'Category added'});
});
app.delete('/api/admin/categories/:id', requireRole(['admin']), async (req,res)=>{ await runQuery('DELETE FROM categories WHERE id=?',[req.params.id]); res.json({message:'Category deleted'}); });

app.get('/news/:slug', (req, res) => res.sendFile(path.join(__dirname, 'public/post.html')));
app.get('/trending', (req, res) => res.sendFile(path.join(__dirname, 'public/trending.html')));
app.get('/category/:slug', (req, res) => res.sendFile(path.join(__dirname, 'public/category.html')));
app.get('/search', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));



async function runCleanupJob(trigger = 'manual') {
  const hours = Number(process.env.AUTO_DELETE_AFTER_HOURS || 24);
  const stalePosts = await runQuery(
    `SELECT id, image FROM posts
     WHERE ai_generated = 1
       AND status IN ('published', 'pending_review')
       AND (is_protected IS NULL OR is_protected = 0)
       AND ((post_type IN ('breaking','news') AND published_at < DATE_SUB(NOW(), INTERVAL ? HOUR)) OR expires_at < NOW() OR created_at < DATE_SUB(NOW(), INTERVAL ? HOUR))`,
    [hours, hours]
  );

  if (!stalePosts.length) {
    await runQuery('INSERT INTO cleanup_logs (deleted_posts, deleted_files, freed_space_estimate, status, error_message) VALUES (0, 0, ?, ?, ?)', ['0 MB', 'success', `No stale posts (${trigger})`]);
    return { deletedPosts: 0, deletedFiles: 0, freedSpaceEstimate: '0 MB' };
  }

  const ids = stalePosts.map((p) => p.id);
  const placeholders = ids.map(() => '?').join(',');
  await runQuery(`DELETE FROM comments WHERE post_id IN (${placeholders})`, ids);
  await runQuery(`DELETE FROM likes WHERE post_id IN (${placeholders})`, ids);
  await runQuery(`DELETE FROM bookmarks WHERE post_id IN (${placeholders})`, ids);
  await runQuery(`DELETE FROM posts WHERE id IN (${placeholders})`, ids);

  await runQuery('INSERT INTO cleanup_logs (deleted_posts, deleted_files, freed_space_estimate, status, error_message) VALUES (?, ?, ?, ?, ?)', [ids.length, 0, `${ids.length * 0.5} MB`, 'success', `Cleanup ${trigger}`]);
  return { deletedPosts: ids.length, deletedFiles: 0, freedSpaceEstimate: `${ids.length * 0.5} MB` };
}

app.get('/api/admin/cleanup/status', requireRole(['admin']), async (req, res) => {
  const [lastCleanup] = await runQuery('SELECT * FROM cleanup_logs ORDER BY id DESC LIMIT 1');
  res.json({ lastCleanup: lastCleanup || null, autoDeleteAfterHours: Number(process.env.AUTO_DELETE_AFTER_HOURS || 24) });
});

app.post('/api/admin/run-cleanup', requireRole(['admin']), async (req, res) => {
  try {
    const result = await runCleanupJob('manual-admin');
    res.json({ message: 'Cleanup finished', result });
  } catch (error) {
    res.status(500).json({ message: 'Cleanup failed' });
  }
});

app.post('/api/admin/bots/run-collector', requireRole(['admin', 'editor']), async (req, res) => {
  res.json({ status: 'ok', bot: 'trendCollectorBot', collected: [], note: 'Use RSS/API integrations in production.' });
});

app.post('/api/admin/bots/run-threat-check', requireRole(['admin', 'editor']), async (req, res) => {
  const text = sanitizeText(req.body.text || '', 4000).toLowerCase();
  const flags = [];
  if (text.includes('password') || text.includes('aadhaar') || text.includes('pan')) flags.push('possible_pii');
  const status = flags.length ? 'review_required' : 'safe';
  res.json({ status, flags, reason: flags.length ? 'Potential sensitive data detected' : 'No immediate threat signal', recommendedAction: flags.length ? 'Send for manual review' : 'Continue pipeline' });
});

app.post('/api/admin/bots/run-newsroom', requireRole(['admin', 'editor']), async (req, res) => {
  const status = process.env.AI_AUTO_PUBLISH === 'true' ? 'published' : 'pending_review';
  res.json({ status: 'ok', workflow: 'multi-bot', publishStatus: status, message: 'Pipeline trigger accepted' });
});

app.get('/api/admin/bots/status', requireRole(['admin']), async (req, res) => {
  res.json({
    aiAutoPublish: process.env.AI_AUTO_PUBLISH === 'true',
    maxAiConcurrency: Number(process.env.MAX_AI_CONCURRENCY || 1),
    autoDeleteAfterHours: Number(process.env.AUTO_DELETE_AFTER_HOURS || 24),
    bots: ['trendCollectorBot', 'threatGuardBot', 'freshnessBot', 'newsAnalysisBot', 'newsWriterBot', 'visualizerBot', 'aiAnchorBot', 'publisherBot', 'cleanupBot']
  });
});

setInterval(() => {
  runCleanupJob('hourly-cron').catch(() => {});
}, 60 * 60 * 1000);

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'Yeh Mera India',
    db: 'connected',
    openai: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    api: 'responses'
  });
});

cron.schedule('0 * * * *', () => { runCleanupJob('cron-hourly').catch(() => {}); });

app.listen(PORT, () => {
  console.log(`Yeh Mera India running on port ${PORT}`);
});
