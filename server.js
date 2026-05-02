const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folders
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
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
    const safeName = file.originalname.replace(/\s+/g, '-');
    cb(null, Date.now() + '-' + safeName);
  }
});

const upload = multer({ storage });

// Pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/dashboard.html'));
});

// Upload image
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' });
  }

  res.json({
    file: req.file.filename,
    path: `/uploads/${req.file.filename}`
  });
});

// Create post
app.post('/api/admin/posts', (req, res) => {
  const { title, content, image } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const sql = `
    INSERT INTO posts (title, slug, content, image)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [title, slug, content, image || null], (err, result) => {
    if (err) {
      console.error('POST SAVE ERROR:', err.message);
      return res.status(500).json({ message: 'Failed to save post' });
    }

    res.json({
      message: 'Post created successfully',
      postId: result.insertId
    });
  });
});

// Get all posts
app.get('/api/posts', (req, res) => {
  const sql = `
    SELECT id, title, slug, content, image, created_at
    FROM posts
    ORDER BY id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('FETCH POSTS ERROR:', err.message);
      return res.status(500).json({ message: 'Failed to fetch posts' });
    }

    res.json(results);
  });
});

// Get single post
app.get('/api/posts/:slug', (req, res) => {
  const sql = `
    SELECT id, title, slug, content, image, created_at
    FROM posts
    WHERE slug = ?
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

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'Yeh Mera India',
    db: 'connected'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Yeh Mera India running on port ${PORT}`);
});
