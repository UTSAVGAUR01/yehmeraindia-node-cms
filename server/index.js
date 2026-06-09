import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import adminRoutes from './routes/admin.js';
import aiRoutes from './routes/ai.js';
import { query } from './db.js';

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const indexHtml = path.join(distDir, 'index.html');
const port = Number(process.env.PORT || 3000);

console.log('Starting YE MERA INDIA Express app...');
console.log('Node version:', process.version);
console.log('Port:', port);
console.log('Dist directory:', distDir);
console.log('Index exists:', fs.existsSync(indexHtml));

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set. Add it in Hostinger environment variables.');
}

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'YE MERA INDIA API is running' });
});

app.get('/api/health/db', async (req, res) => {
  try {
    const rows = await query('SELECT COUNT(*) AS total_users FROM users');
    res.json({ success: true, database: 'connected', total_users: rows[0].total_users });
  } catch (error) {
    res.status(500).json({ success: false, database: 'failed', message: error.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

if (fs.existsSync(indexHtml)) {
  app.use(express.static(distDir));

  app.get(/.*/, (req, res) => {
    res.sendFile(indexHtml);
  });
} else {
  app.get('/', (req, res) => {
    res.status(200).send('YE MERA INDIA API is running. Frontend build is missing. Run npm run build during deployment.');
  });

  app.get(/.*/, (req, res) => {
    res.status(404).json({ success: false, message: 'Frontend build not found', path: req.path });
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`YE MERA INDIA server running on 0.0.0.0:${port}`);
});
