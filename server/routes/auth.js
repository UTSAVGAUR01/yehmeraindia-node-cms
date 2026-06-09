import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existing = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'user', 'active']
    );

    const user = { id: result.insertId, name, email, role: 'user', status: 'active' };
    return res.status(201).json({ success: true, token: signToken(user), user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Signup failed', error: error.message });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const users = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    const user = users[0];

    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Invalid login details' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid login details' });
    }

    return res.json({ success: true, token: signToken(user), user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Signin failed', error: error.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const users = await query('SELECT id, name, email, role, status FROM users WHERE id = ? LIMIT 1', [req.user.id]);
  if (!users.length) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  return res.json({ success: true, user: users[0] });
});

export default router;
