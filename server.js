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

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

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
      ['tags', 'ALTER TABLE posts ADD COLUMN tags TEXT NULL'],
      ['views', 'ALTER TABLE posts ADD COLUMN views INT DEFAULT 0'],
      ['is_trending', 'ALTER TABLE posts ADD COLUMN is_trending TINYINT DEFAULT 0'],
      ['is_featured', 'ALTER TABLE posts ADD COLUMN is_featured TINYINT DEFAULT 0'],
      ['ai_generated', 'ALTER TABLE posts ADD COLUMN ai_generated TINYINT DEFAULT 0'],
      ['reading_time', 'ALTER TABLE posts ADD COLUMN reading_time INT DEFAULT 3']
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
app.get('/dashboard.html', requireAdminPage, (req, res) => res.sendFile(path.join(__dirname, 'public/dashboard.html')));
app.get('/post/:slug', (req, res) => res.sendFile(path.join(__dirname, 'public/post.html')));

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

app.listen(PORT, () => {
  console.log(`Yeh Mera India running on port ${PORT}`);
});