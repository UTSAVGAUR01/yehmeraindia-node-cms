import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dataFile = path.join(__dirname, 'data', 'posts.json');
const uploadDir = path.join(__dirname, 'uploads');
const distDir = path.join(rootDir, 'dist');
const port = Number(process.env.PORT || 8080);
const adminEmail = process.env.ADMIN_EMAIL || 'admin@yehmeraindia.com';
const adminPassword = process.env.ADMIN_PASSWORD || '';
const sessionSecret = process.env.SESSION_SECRET || '';

await fs.mkdir(uploadDir, { recursive: true });

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.PUBLIC_SITE_URL || true }));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(uploadDir, { maxAge: '7d', immutable: false }));

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.webp';
      cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype))
});

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function signToken(payload) {
  const body = base64url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', sessionSecret).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function verifyToken(token) {
  if (!token || !sessionSecret) return false;
  const [body, signature] = token.split('.');
  if (!body || !signature) return false;
  const expected = crypto.createHmac('sha256', sessionSecret).update(body).digest('base64url');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  return payload.email === adminEmail && payload.exp > Date.now();
}

function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!verifyToken(token)) return res.status(401).json({ message: 'Admin login required.' });
  next();
}

async function readPosts() {
  try {
    return JSON.parse(await fs.readFile(dataFile, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function writePosts(posts) {
  const temporary = `${dataFile}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(posts, null, 2));
  await fs.rename(temporary, dataFile);
}

function cleanSlug(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);
}

function normalizePost(body, existing = {}) {
  const title = String(body.title || existing.title || '').trim();
  const status = body.status === 'published' ? 'published' : 'draft';
  return {
    ...existing,
    title,
    slug: cleanSlug(body.slug || title || existing.slug),
    excerpt: String(body.excerpt || '').trim(),
    content: String(body.content || '').trim(),
    category: String(body.category || 'Journal').trim(),
    status,
    coverImage: String(body.coverImage || existing.coverImage || ''),
    imageAlt: String(body.imageAlt || title).trim(),
    featured: Boolean(body.featured),
    updatedAt: new Date().toISOString(),
    publishedAt: status === 'published' ? (existing.publishedAt || new Date().toISOString()) : null
  };
}

async function createAiCover(post) {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured on the server.');

  const prompt = [
    'Create a wide editorial cover illustration for Yeh Mera India.',
    `Article: ${post.title}.`,
    post.excerpt ? `Context: ${post.excerpt}.` : '',
    `Theme: ${post.category}.`,
    'Visual style: cinematic Indian theatre heritage, deep indigo, warm saffron, ivory manuscript texture, culturally respectful, premium literary magazine, atmospheric stage lighting, no text, no logos, no watermark.'
  ].filter(Boolean).join(' ');

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2',
      prompt,
      size: '1536x1024',
      quality: 'medium',
      output_format: 'webp'
    })
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || 'AI image generation failed.');
  const encoded = result.data?.[0]?.b64_json;
  if (!encoded) throw new Error('AI image generation returned no image.');

  const filename = `ai-${Date.now()}-${crypto.randomUUID()}.webp`;
  await fs.writeFile(path.join(uploadDir, filename), Buffer.from(encoded, 'base64'));
  return `/uploads/${filename}`;
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'Yeh Mera India CMS' }));

app.get('/api/posts', async (req, res, next) => {
  try {
    const posts = await readPosts();
    const publicPosts = posts
      .filter((post) => post.status === 'published')
      .filter((post) => !req.query.category || post.category === req.query.category)
      .sort((a, b) => new Date(b.publishedAt || b.updatedAt) - new Date(a.publishedAt || a.updatedAt));
    res.json(publicPosts);
  } catch (error) { next(error); }
});

app.get('/api/posts/:slug', async (req, res, next) => {
  try {
    const post = (await readPosts()).find((item) => item.slug === req.params.slug && item.status === 'published');
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    res.json(post);
  } catch (error) { next(error); }
});

app.post('/api/admin/login', (req, res) => {
  if (!adminPassword || !sessionSecret) return res.status(503).json({ message: 'Admin credentials are not configured.' });
  const email = String(req.body?.email || '').toLowerCase();
  const password = String(req.body?.password || '');
  const validEmail = email === adminEmail.toLowerCase();
  const a = Buffer.from(password);
  const b = Buffer.from(adminPassword);
  const validPassword = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!validEmail || !validPassword) return res.status(401).json({ message: 'Incorrect email or password.' });
  res.json({ token: signToken({ email: adminEmail, exp: Date.now() + 8 * 60 * 60 * 1000 }) });
});

app.get('/api/admin/posts', requireAdmin, async (_req, res, next) => {
  try { res.json((await readPosts()).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))); }
  catch (error) { next(error); }
});

app.post('/api/admin/upload', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Choose a JPG, PNG, WebP or GIF image up to 5 MB.' });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

app.post('/api/admin/posts', requireAdmin, async (req, res, next) => {
  try {
    const posts = await readPosts();
    const post = normalizePost(req.body);
    if (!post.title || !post.slug || !post.content) return res.status(400).json({ message: 'Title, slug and content are required.' });
    if (posts.some((item) => item.slug === post.slug)) return res.status(409).json({ message: 'That post URL is already in use.' });
    post.id = crypto.randomUUID();
    post.createdAt = new Date().toISOString();
    if (!post.coverImage && req.body.generateImage) post.coverImage = await createAiCover(post);
    posts.push(post);
    await writePosts(posts);
    res.status(201).json(post);
  } catch (error) { next(error); }
});

app.put('/api/admin/posts/:id', requireAdmin, async (req, res, next) => {
  try {
    const posts = await readPosts();
    const index = posts.findIndex((post) => post.id === req.params.id);
    if (index < 0) return res.status(404).json({ message: 'Post not found.' });
    const updated = normalizePost(req.body, posts[index]);
    if (!updated.title || !updated.slug || !updated.content) return res.status(400).json({ message: 'Title, slug and content are required.' });
    if (posts.some((item, itemIndex) => itemIndex !== index && item.slug === updated.slug)) return res.status(409).json({ message: 'That post URL is already in use.' });
    if (!updated.coverImage && req.body.generateImage) updated.coverImage = await createAiCover(updated);
    posts[index] = updated;
    await writePosts(posts);
    res.json(updated);
  } catch (error) { next(error); }
});

app.post('/api/admin/posts/:id/generate-image', requireAdmin, async (req, res, next) => {
  try {
    const posts = await readPosts();
    const index = posts.findIndex((post) => post.id === req.params.id);
    if (index < 0) return res.status(404).json({ message: 'Post not found.' });
    posts[index].coverImage = await createAiCover({ ...posts[index], excerpt: req.body?.prompt || posts[index].excerpt });
    posts[index].updatedAt = new Date().toISOString();
    await writePosts(posts);
    res.json(posts[index]);
  } catch (error) { next(error); }
});

app.delete('/api/admin/posts/:id', requireAdmin, async (req, res, next) => {
  try {
    const posts = await readPosts();
    const remaining = posts.filter((post) => post.id !== req.params.id);
    if (remaining.length === posts.length) return res.status(404).json({ message: 'Post not found.' });
    await writePosts(remaining);
    res.status(204).end();
  } catch (error) { next(error); }
});

app.use('/api', (_req, res) => res.status(404).json({ message: 'API route not found.' }));
app.use(express.static(distDir));
app.use((_req, res, next) => res.sendFile(path.join(distDir, 'index.html'), (error) => error && next(error)));

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error instanceof multer.MulterError) return res.status(400).json({ message: error.message });
  res.status(500).json({ message: error.message || 'Something went wrong.' });
});

app.listen(port, () => console.log(`Yeh Mera India running on port ${port}`));
