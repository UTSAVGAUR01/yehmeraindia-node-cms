#!/bin/bash

echo "Creating YehMeraIndia CMS..."

mkdir -p public admin uploads

# package.json
cat > package.json << 'EOF'
{
  "name": "yehmeraindia-node-cms",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5",
    "cors": "^2.8.5"
  }
}
EOF

# server.js
cat > server.js << 'EOF'
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
EOF

# index.html
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
<title>Yeh Mera India</title>
</head>
<body>

<h1>Yeh Mera India</h1>
<div id="posts"></div>

<script>
fetch('/api/posts')
.then(res => res.json())
.then(data => {
  let html = '';
  data.forEach(p => {
    html += `
      <h2>${p.title}</h2>
      <img src="/uploads/${p.image}" width="200"/>
      <p>${p.content}</p>
      <a href="https://wa.me/?text=${location.href}">Share</a>
      <hr/>
    `;
  });
  document.getElementById('posts').innerHTML = html;
});
</script>

</body>
</html>
EOF

# admin dashboard
cat > admin/dashboard.html << 'EOF'
<h2>Create Post</h2>

<input id="title" placeholder="Title"/><br/><br/>
<textarea id="content" placeholder="Content"></textarea><br/><br/>
<input type="file" id="image"/><br/><br/>

<button onclick="submitPost()">Publish</button>

<script>
async function submitPost() {
  const fileInput = document.getElementById('image');

  const formData = new FormData();
  formData.append('image', fileInput.files[0]);

  const upload = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  const img = await upload.json();

  await fetch('/api/admin/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: document.getElementById('title').value,
      content: document.getElementById('content').value,
      image: img.file
    })
  });

  alert('Post Created');
}
</script>
EOF

echo "Setup Complete!"