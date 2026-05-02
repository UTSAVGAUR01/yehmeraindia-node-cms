const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const slugify = require('slugify');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   BASIC MIDDLEWARE
========================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* =========================
   MYSQL CONNECTION
========================= */

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

/* =========================
   DEFAULT DATA
========================= */

const defaultCategories = [
  {
    id: 1,
    name: 'Government Schemes',
    slug: 'government-schemes',
    description: 'Simple guides for Indian government schemes'
  },
  {
    id: 2,
    name: 'CSR Impact',
    slug: 'csr-impact',
    description: 'Ground stories and social impact reports'
  },
  {
    id: 3,
    name: 'Education',
    slug: 'education',
    description: 'Education, skills and career guidance'
  },
  {
    id: 4,
    name: 'Health Awareness',
    slug: 'health-awareness',
    description: 'Health and public awareness content'
  },
  {
    id: 5,
    name: 'Finance Literacy',
    slug: 'finance-literacy',
    description: 'Banking, saving, UPI and digital safety'
  },
  {
    id: 6,
    name: 'India Stories',
    slug: 'india-stories',
    description: 'Inspiring stories from Bharat'
  },
  {
    id: 7,
    name: 'AI Reporter',
    slug: 'ai-reporter',
    description: 'AI-assisted news and explainers'
  }
];

const defaultAiFeed = [
  {
    id: 'ai-1',
    title: "Top 10 Positive India Updates to Watch",
    slug: "top-10-positive-india-updates",
    excerpt: "A positive roundup covering development, innovation, education, health, infrastructure and citizen-focused progress.",
    content: "This AI Reporter feed highlights positive India-focused updates. Editors can convert this into a verified article by adding current facts, dates and sources.",
    category: "ai-reporter",
    format: "ai_report",
    ai_generated: 1,
    views: 100,
    is_trending: 1,
    is_featured: 1,
    badge: "Positive News",
    created_at: new Date(),
    author_name: "AI Reporter"
  },
  {
    id: 'ai-2',
    title: "Election Result Explainer: What Readers Should Check",
    slug: "election-result-explainer",
    excerpt: "A neutral reader guide explaining how to follow election results, vote share, margins and official updates.",
    content: "Election result updates should always be verified from official election sources. This draft can be used as a structure for a neutral explainer.",
    category: "ai-reporter",
    format: "ai_report",
    ai_generated: 1,
    views: 90,
    is_trending: 1,
    is_featured: 1,
    badge: "Election Update",
    created_at: new Date(),
    author_name: "AI Reporter"
  },
  {
    id: 'ai-3',
    title: "India Stock Market Snapshot for Common Readers",
    slug: "india-stock-market-snapshot",
    excerpt: "A simple explanation of market movement, major sectors, investor mood and what beginners should understand.",
    content: "Stock market updates should include index movement, sector trends and a clear risk disclaimer. This AI draft is educational only.",
    category: "finance-literacy",
    format: "ai_report",
    ai_generated: 1,
    views: 85,
    is_trending: 1,
    is_featured: 0,
    badge: "Market Watch",
    created_at: new Date(),
    author_name: "AI Reporter"
  },
  {
    id: 'ai-4',
    title: "Government Scheme Watch: Benefits, Eligibility and Documents",
    slug: "government-scheme-watch",
    excerpt: "A practical format to explain schemes with eligibility, required documents, process and official links.",
    content: "This draft format helps create scheme articles. Editors should verify official scheme details before publishing.",
    category: "government-schemes",
    format: "ai_report",
    ai_generated: 1,
    views: 80,
    is_trending: 1,
    is_featured: 0,
    badge: "Scheme Watch",
    created_at: new Date(),
    author_name: "AI Reporter"
  },
  {
    id: 'ai-5',
    title: "India Technology and AI Progress: Simple Weekly Explainer",
    slug: "india-technology-ai-progress",
    excerpt: "A simple AI and technology update for students, professionals and curious readers.",
    content: "Technology updates can include AI, digital public infrastructure, startups, education tech and cyber safety.",
    category: "education",
    format: "ai_report",
    ai_generated: 1,
    views: 75,
    is_trending: 1,
    is_featured: 0,
    badge: "Tech Update",
    created_at: new Date(),
    author_name: "AI Reporter"
  },
  {
    id: 'ai-6',
    title: "Sports and Youth Achievement Roundup",
    slug: "sports-and-youth-achievement-roundup",
    excerpt: "A positive format to highlight Indian youth, athletes, competitions, medals and local success stories.",
    content: "Sports updates should include verified event names, dates, players and official results before publishing.",
    category: "india-stories",
    format: "ai_report",
    ai_generated: 1,
    views: 70,
    is_trending: 0,
    is_featured: 0,
    badge: "Youth & Sports",
    created_at: new Date(),
    author_name: "AI Reporter"
  }
];

/* =========================
   AUTO DATABASE SETUP
========================= */

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

    for (const cat of defaultCategories) {
      await runQuery(
        `INSERT IGNORE INTO categories (name, slug, description) VALUES (?, ?, ?)`,
        [cat.name, cat.slug, cat.description]
      );
    }

    const columns = [
      ['category', "ALTER TABLE posts ADD COLUMN category VARCHAR(100) DEFAULT 'india-stories'"],
      ['format', "ALTER TABLE posts ADD COLUMN format VARCHAR(50) DEFAULT 'standard'"],
      ['tags', "ALTER TABLE posts ADD COLUMN tags TEXT NULL"],
      ['views', "ALTER TABLE posts ADD COLUMN views INT DEFAULT 0"],
      ['is_trending', "ALTER TABLE posts ADD COLUMN is_trending TINYINT DEFAULT 0"],
      ['is_featured', "ALTER TABLE posts ADD COLUMN is_featured TINYINT DEFAULT 0"],
      ['ai_generated', "ALTER TABLE posts ADD COLUMN ai_generated TINYINT DEFAULT 0"],
      ['reading_time', "ALTER TABLE posts ADD COLUMN reading_time INT DEFAULT 3"]
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

/* =========================
   UPLOAD SETUP
========================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '-').toLowerCase();
    cb(null, Date.now() + '-' + safeName);
  }
});

const upload = multer({ storage });

/* =========================
   HELPERS
========================= */

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Login required' });
    }

    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    next();
  };
}

function requireAdminPage(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login.html');
  }

  if (!['admin', 'editor'].includes(req.session.user.role)) {
    return res.redirect('/');
  }

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

function buildAiResponse(type, body) {
  const topic = body.topic || 'Top 10 positive India updates';
  const tone = body.tone || 'insightful';
  const format = body.format || 'article';

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
      category: 'ai-reporter'
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
      category: 'ai-reporter'
    };
  }

  return {
    title,
    type: 'draft',
    excerpt: `A simple AI-assisted draft about ${topic}.`,
    content: `${title}

Introduction:
${topic} is an important topic for Indian readers. This draft is created to help editors prepare a clear, useful and verified article.

Key Updates:
1. Explain the most important update in simple language.
2. Add current facts from official or trusted sources.
3. Explain why it matters for citizens, students, families or investors.
4. Add positive developments and practical awareness points.
5. Include important cautions where required.

For election results:
Use only official election data, seat count, vote share, margins and dates.

For stock market:
Add index movement, sector performance and a clear risk disclaimer.

For positive news:
Focus on development, innovation, education, health, infrastructure, sports, science and community impact.

Editorial Note:
This AI draft must be reviewed by admin/editor before publishing. Verify all numbers, dates and claims before making it public.`,
    category: 'ai-reporter',
    format: 'ai_report',
    ai_generated: 1
  };
}

/* =========================
   PAGE ROUTES
========================= */

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.get('/signup.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/signup.html'));
});

app.get('/dashboard.html', requireAdminPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});

app.get('/post/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/post.html'));
});

/* =========================
   AUTH APIs
========================= */

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (name, email, password, role, status)
      VALUES (?, ?, ?, 'pending', 'active')
    `;

    db.query(sql, [name, email, hashedPassword], (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: 'Email already registered' });
        }

        console.error('SIGNUP ERROR:', err.message);
        return res.status(500).json({ message: 'Signup failed' });
      }

      res.json({
        message: 'Signup successful. Admin approval is required before access.'
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Signup failed' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  const sql = `
    SELECT id, name, email, password, role, status
    FROM users
    WHERE email = ?
    LIMIT 1
  `;

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error('LOGIN ERROR:', err.message);
      return res.status(500).json({ message: 'Login failed' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = results[0];

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is blocked' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.role === 'pending') {
      return res.status(403).json({
        message: 'Your account is pending approval by admin'
      });
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.json({
      message: 'Login successful',
      user: req.session.user
    });
  });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/auth/me', (req, res) => {
  res.json({
    user: req.session.user || null
  });
});

/* =========================
   PUBLIC APIs
========================= */

app.get('/api/categories', (req, res) => {
  const sql = `
    SELECT id, name, slug, description
    FROM categories
    ORDER BY id ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('CATEGORIES ERROR:', err.message);
      return res.json(defaultCategories);
    }

    if (!results || results.length === 0) {
      return res.json(defaultCategories);
    }

    res.json(results);
  });
});

app.get('/api/ai-feed', (req, res) => {
  const sql = `
    SELECT ${postColumns()}
    FROM posts
    LEFT JOIN users ON users.id = posts.author_id
    WHERE posts.status = 'published'
      AND (
        posts.ai_generated = 1
        OR posts.format = 'ai_report'
        OR posts.category = 'ai-reporter'
      )
    ORDER BY posts.is_featured DESC, posts.views DESC, posts.id DESC
    LIMIT 10
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('AI FEED ERROR:', err.message);
      return res.json(defaultAiFeed);
    }

    if (!results || results.length === 0) {
      return res.json(defaultAiFeed);
    }

    res.json(results);
  });
});

app.get('/api/trending', (req, res) => {
  const sql = `
    SELECT ${postColumns()}
    FROM posts
    LEFT JOIN users ON users.id = posts.author_id
    WHERE posts.status = 'published'
    ORDER BY posts.is_trending DESC, posts.is_featured DESC, posts.views DESC, posts.id DESC
    LIMIT 10
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('TRENDING ERROR:', err.message);
      return res.json(defaultAiFeed);
    }

    if (!results || results.length === 0) {
      return res.json(defaultAiFeed);
    }

    res.json(results);
  });
});

app.get('/api/posts', (req, res) => {
  const sql = `
    SELECT ${postColumns()}
    FROM posts
    LEFT JOIN users ON users.id = posts.author_id
    WHERE posts.status = 'published'
    ORDER BY posts.id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('FETCH POSTS ERROR:', err.message);
      return res.status(500).json({ message: 'Failed to fetch posts' });
    }

    res.json(results);
  });
});

app.get('/api/posts/:slug', (req, res) => {
  const sql = `
    SELECT ${postColumns()}
    FROM posts
    LEFT JOIN users ON users.id = posts.author_id
    WHERE posts.slug = ? AND posts.status = 'published'
    LIMIT 1
  `;

  db.query(sql, [req.params.slug], (err, results) => {
    if (err) {
      console.error('FETCH POST ERROR:', err.message);
      return res.status(500).json({ message: 'Failed to fetch post' });
    }

    if (results.length === 0) {
      const fallbackPost = defaultAiFeed.find((p) => p.slug === req.params.slug);

      if (fallbackPost) {
        return res.json(fallbackPost);
      }

      return res.status(404).json({ message: 'Post not found' });
    }

    const post = results[0];

    db.query('UPDATE posts SET views = COALESCE(views, 0) + 1 WHERE id = ?', [post.id], () => {});

    res.json(post);
  });
});

app.get('/api/category/:slug', (req, res) => {
  const sql = `
    SELECT ${postColumns()}
    FROM posts
    LEFT JOIN users ON users.id = posts.author_id
    WHERE posts.status = 'published'
      AND posts.category = ?
    ORDER BY posts.id DESC
  `;

  db.query(sql, [req.params.slug], (err, results) => {
    if (err) {
      console.error('CATEGORY POSTS ERROR:', err.message);
      return res.status(500).json({ message: 'Failed to fetch category posts' });
    }

    res.json(results);
  });
});

/* =========================
   UPLOAD API
========================= */

app.post('/api/upload', requireRole(['admin', 'editor']), upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' });
  }

  res.json({
    file: req.file.filename,
    path: `/uploads/${req.file.filename}`
  });
});

/* =========================
   ADMIN POST APIs
========================= */

app.get('/api/admin/posts', requireRole(['admin', 'editor']), (req, res) => {
  const sql = `
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
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('ADMIN POSTS ERROR:', err.message);
      return res.status(500).json({ message: 'Failed to fetch posts' });
    }

    res.json(results);
  });
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

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  const slug = slugify(title, {
    lower: true,
    strict: true
  }) + '-' + Date.now();

  const sql = `
    INSERT INTO posts
      (title, slug, excerpt, content, image, status, author_id, category, format, tags, is_trending, is_featured, ai_generated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
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
      if (err) {
        console.error('CREATE POST ERROR:', err.message);
        return res.status(500).json({ message: 'Failed to create post' });
      }

      res.json({
        message: 'Post created successfully',
        postId: result.insertId
      });
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

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  const sql = `
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
  `;

  db.query(
    sql,
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
      if (err) {
        console.error('UPDATE POST ERROR:', err.message);
        return res.status(500).json({ message: 'Failed to update post' });
      }

      res.json({ message: 'Post updated successfully' });
    }
  );
});

app.delete('/api/admin/posts/:id', requireRole(['admin']), (req, res) => {
  const sql = `DELETE FROM posts WHERE id = ?`;

  db.query(sql, [req.params.id], (err) => {
    if (err) {
      console.error('DELETE POST ERROR:', err.message);
      return res.status(500).json({ message: 'Failed to delete post' });
    }

    res.json({ message: 'Post deleted successfully' });
  });
});

app.put('/api/admin/posts/:id/trending', requireRole(['admin']), (req, res) => {
  const { is_trending } = req.body;

  db.query(
    'UPDATE posts SET is_trending = ? WHERE id = ?',
    [is_trending ? 1 : 0, req.params.id],
    (err) => {
      if (err) {
        console.error('TRENDING UPDATE ERROR:', err.message);
        return res.status(500).json({ message: 'Failed to update trending status' });
      }

      res.json({ message: 'Trending status updated successfully' });
    }
  );
});

app.put('/api/admin/posts/:id/featured', requireRole(['admin']), (req, res) => {
  const { is_featured } = req.body;

  db.query(
    'UPDATE posts SET is_featured = ? WHERE id = ?',
    [is_featured ? 1 : 0, req.params.id],
    (err) => {
      if (err) {
        console.error('FEATURED UPDATE ERROR:', err.message);
        return res.status(500).json({ message: 'Failed to update featured status' });
      }

      res.json({ message: 'Featured status updated successfully' });
    }
  );
});

/* =========================
   AI REPORTER APIs
========================= */

app.post('/api/admin/ai/generate-idea', requireRole(['admin', 'editor']), (req, res) => {
  res.json(buildAiResponse('idea', req.body || {}));
});

app.post('/api/admin/ai/generate-outline', requireRole(['admin', 'editor']), (req, res) => {
  res.json(buildAiResponse('outline', req.body || {}));
});

app.post('/api/admin/ai/generate-draft', requireRole(['admin', 'editor']), (req, res) => {
  res.json(buildAiResponse('draft', req.body || {}));
});

/* =========================
   ADMIN USER APIs
========================= */

app.get('/api/admin/users', requireRole(['admin']), (req, res) => {
  const sql = `
    SELECT id, name, email, role, status, created_at
    FROM users
    ORDER BY id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('USERS ERROR:', err.message);
      return res.status(500).json({ message: 'Failed to fetch users' });
    }

    res.json(results);
  });
});

app.put('/api/admin/users/:id/role', requireRole(['admin']), (req, res) => {
  const { role } = req.body;
  const allowedRoles = ['pending', 'viewer', 'editor', 'admin'];

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const sql = `UPDATE users SET role = ? WHERE id = ?`;

  db.query(sql, [role, req.params.id], (err) => {
    if (err) {
      console.error('ROLE UPDATE ERROR:', err.message);
      return res.status(500).json({ message: 'Failed to update role' });
    }

    res.json({ message: 'User role updated successfully' });
  });
});

app.put('/api/admin/users/:id/status', requireRole(['admin']), (req, res) => {
  const { status } = req.body;
  const allowedStatus = ['active', 'blocked'];

  if (!allowedStatus.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const sql = `UPDATE users SET status = ? WHERE id = ?`;

  db.query(sql, [status, req.params.id], (err) => {
    if (err) {
      console.error('STATUS UPDATE ERROR:', err.message);
      return res.status(500).json({ message: 'Failed to update status' });
    }

    res.json({ message: 'User status updated successfully' });
  });
});

/* =========================
   HEALTH CHECK
========================= */

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'Yeh Mera India',
    db: 'connected'
  });
});

app.listen(PORT, () => {
  console.log(`Yeh Mera India running on port ${PORT}`);
});