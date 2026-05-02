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

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
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

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('DB ERROR:', err.message);
  } else {
    console.log('DB Connected Successfully');
  }
});

// Upload setup
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

// Auth helpers
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Login required' });
  }
  next();
}

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

function requirePageLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login.html');
  }
  next();
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

// Pages
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

// Auth APIs
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

// Upload API
app.post('/api/upload', requireRole(['admin', 'editor']), upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' });
  }

  res.json({
    file: req.file.filename,
    path: `/uploads/${req.file.filename}`
  });
});

// Public posts
app.get('/api/posts', (req, res) => {
  const sql = `
    SELECT 
      posts.id,
      posts.title,
      posts.slug,
      posts.excerpt,
      posts.content,
      posts.image,
      posts.status,
      posts.created_at,
      users.name AS author_name
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
    SELECT 
      posts.id,
      posts.title,
      posts.slug,
      posts.excerpt,
      posts.content,
      posts.image,
      posts.status,
      posts.created_at,
      users.name AS author_name
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
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(results[0]);
  });
});

// Admin post APIs
app.get('/api/admin/posts', requireRole(['admin', 'editor']), (req, res) => {
  const sql = `
    SELECT id, title, slug, excerpt, content, image, status, created_at
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
  const { title, excerpt, content, image, status } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  const slug = slugify(title, {
    lower: true,
    strict: true
  }) + '-' + Date.now();

  const sql = `
    INSERT INTO posts (title, slug, excerpt, content, image, status, author_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
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
      req.session.user.id
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
  const { title, excerpt, content, image, status } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  const sql = `
    UPDATE posts
    SET title = ?, excerpt = ?, content = ?, image = ?, status = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [title, excerpt || '', content, image || null, status || 'published', req.params.id],
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

// Admin user APIs
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

// Health check
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
