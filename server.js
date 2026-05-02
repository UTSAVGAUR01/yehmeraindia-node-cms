const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
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

// Upload Configuration
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

// Home Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Admin Dashboard Page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/dashboard.html'));
});

// Upload Image API
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' });
  }

  res.json({
    file: req.file.filename,
    path: `/uploads/${req.file.filename}`
  });
});

// Create Post API
app.post('/api/admin/posts', (req, res) => {
  const { title, slug, content, image } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  const finalSlug = slug || title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const sql = `
    INSERT INTO posts (title, slug, content, image)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [title, finalSlug, content, image || null], (err, result) => {
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

// Get All Posts API
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

// Get Single Post API
app.get('/api/posts/:slug', (req, res) => {
  const { slug } = req.params;

  const sql = `
    SELECT id, title, slug, content, image, created_at
    FROM posts
    WHERE slug = ?
    LIMIT 1
  `;

  db.query(sql, [slug], (err, results) => {
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

// Start Server
app.listen(PORT, () => {
  console.log(`Yeh Mera India running on port ${PORT}`);
});
