const express = require('express');
const path = require('path');
const multer = require('multer');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

let posts = [];

// Home
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Upload
app.post('/api/upload', upload.single('image'), (req, res) => {
  res.json({ file: req.file.filename });
});

// Create post
app.post('/api/admin/posts', (req, res) => {
  const post = {
    id: Date.now(),
    title: req.body.title,
    content: req.body.content,
    image: req.body.image
  };
  posts.push(post);
  res.json(post);
});

// Get posts
app.get('/api/posts', (req, res) => {
  res.json(posts);
});

app.listen(3000, () => {
  console.log('Server running');
});
