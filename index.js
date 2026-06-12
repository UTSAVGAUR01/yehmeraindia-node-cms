import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const indexHtml = path.join(distDir, 'index.html');
const port = Number(process.env.PORT || 3000);

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 5),
  queueLimit: 0
});

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status };
}

function signToken(user) {
  return jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, process.env.JWT_SECRET || 'local_secret_change_me', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ success: false, message: 'Login required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'local_secret_change_me');
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  return next();
}

function slugify(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `post-${Date.now()}`;
}

function buildFallback({ title = '', content = '', category = '' }) {
  const baseTitle = title.trim() || 'A Fresh Perspective on India Today';
  const plainContent = content.trim() || 'Write a thoughtful post with a clear introduction, practical examples, and a strong closing note for Indian readers.';
  const safeCategory = category.trim() || 'Culture';
  const tags = Array.from(new Set([safeCategory.toLowerCase(), 'india', 'author', 'blog', ...baseTitle.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 4).slice(0, 4)])).slice(0, 8);
  return {
    title: baseTitle,
    excerpt: plainContent.slice(0, 150),
    category: safeCategory,
    content: `${baseTitle}\n\n${plainContent}\n\nSuggested direction: keep the tone warm, practical, and reader-friendly. Add examples, cultural context, and a clear conclusion.`,
    tags,
    hashtags: tags.map((tag) => `#${tag.replace(/[^a-z0-9]/g, '')}`).filter((tag) => tag.length > 1)
  };
}

function extractJson(text) {
  if (!text) return null;
  const cleaned = text.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  return JSON.parse(cleaned.slice(start, end + 1));
}

process.on('uncaughtException', (error) => console.error('Uncaught exception:', error));
process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason));

console.log('Starting YE MERA INDIA app');
console.log('Node:', process.version);
console.log('Port:', port);
console.log('Dist index exists:', fs.existsSync(indexHtml));

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'YE MERA INDIA API is running' }));

app.get('/api/health/db', async (req, res) => {
  try {
    const rows = await query('SELECT COUNT(*) AS total_users FROM users');
    res.json({ success: true, database: 'connected', total_users: rows[0].total_users });
  } catch (error) {
    res.status(500).json({ success: false, database: 'failed', message: error.message });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    const existing = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existing.length) return res.status(409).json({ success: false, message: 'Email already registered' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query('INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)', [name, email, hashedPassword, 'user', 'active']);
    const user = { id: result.insertId, name, email, role: 'user', status: 'active' };
    res.status(201).json({ success: true, token: signToken(user), user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Signup failed', error: error.message });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });
    const users = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    const user = users[0];
    if (!user || user.status !== 'active') return res.status(401).json({ success: false, message: 'Invalid login details' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid login details' });
    res.json({ success: true, token: signToken(user), user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Signin failed', error: error.message });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const users = await query('SELECT id, name, email, role, status FROM users WHERE id = ? LIMIT 1', [req.user.id]);
  if (!users.length) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user: users[0] });
});

app.get('/api/posts', async (req, res) => {
  try {
    const posts = await query(`SELECT p.id, p.title, p.slug, p.excerpt, p.content, p.cover_image, p.category, p.status, p.created_at, p.updated_at, u.name AS author_name FROM posts p LEFT JOIN users u ON u.id = p.author_id WHERE p.status = 'published' ORDER BY p.created_at DESC`);
    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load posts', error: error.message });
  }
});

app.get('/api/posts/admin/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const posts = await query(`SELECT p.id, p.title, p.slug, p.excerpt, p.content, p.cover_image, p.category, p.status, p.created_at, p.updated_at, u.name AS author_name FROM posts p LEFT JOIN users u ON u.id = p.author_id ORDER BY p.created_at DESC`);
    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load admin posts', error: error.message });
  }
});

app.post('/api/posts', requireAuth, async (req, res) => {
  try {
    const { title, excerpt, content, cover_image, category, status } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: 'Title and content are required' });
    const finalStatus = req.user.role === 'admin' ? (status || 'published') : 'draft';
    const slug = `${slugify(title)}-${Date.now()}`;
    const result = await query('INSERT INTO posts (author_id, title, slug, excerpt, content, cover_image, category, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [req.user.id, title.trim(), slug, excerpt || '', content, cover_image || '', category || 'General', finalStatus]);
    res.status(201).json({ success: true, postId: result.insertId, slug, status: finalStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to save post', error: error.message });
  }
});

app.get('/api/admin/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userRows = await query('SELECT COUNT(*) AS total FROM users');
    const postRows = await query('SELECT COUNT(*) AS total FROM posts');
    const publishedRows = await query("SELECT COUNT(*) AS total FROM posts WHERE status = 'published'");
    const draftRows = await query("SELECT COUNT(*) AS total FROM posts WHERE status = 'draft'");
    res.json({ success: true, stats: { users: userRows[0].total, posts: postRows[0].total, published: publishedRows[0].total, drafts: draftRows[0].total } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load stats', error: error.message });
  }
});

app.post('/api/ai/post-assist', requireAuth, async (req, res) => {
  try {
    const { title = '', content = '', category = '', tone = 'professional Indian editorial' } = req.body || {};
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.json({ success: true, source: 'fallback', suggestion: buildFallback({ title, content, category }) });
    const prompt = `Return ONLY valid JSON with keys title, excerpt, category, content, tags, hashtags. Tone: ${tone}. Draft title: ${title}. Category: ${category}. Draft idea: ${content}`;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages: [{ role: 'system', content: 'You are a blog writing assistant. Return strict JSON only.' }, { role: 'user', content: prompt }], temperature: 0.7 })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ success: false, message: data?.error?.message || 'AI provider request failed' });
    const suggestion = extractJson(data?.choices?.[0]?.message?.content || '') || buildFallback({ title, content, category });
    res.json({ success: true, source: 'openai', suggestion });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'AI post assistant failed' });
  }
});

if (fs.existsSync(indexHtml)) {
  app.use(express.static(distDir));
  app.use((req, res) => res.sendFile(indexHtml));
} else {
  app.get('/', (req, res) => res.status(200).send('YE MERA INDIA backend is running. Frontend build not found.'));
  app.use((req, res) => res.status(404).json({ success: false, message: 'Not found', path: req.path }));
}

app.listen(port, '0.0.0.0', () => console.log(`YE MERA INDIA server running on 0.0.0.0:${port}`));
