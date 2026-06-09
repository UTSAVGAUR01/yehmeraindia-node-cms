import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const status = req.query.status || 'published';
    const posts = await query(
      `SELECT p.id, p.title, p.slug, p.excerpt, p.content, p.cover_image, p.category, p.status,
              p.created_at, p.updated_at, u.name AS author_name
       FROM posts p
       LEFT JOIN users u ON u.id = p.author_id
       WHERE p.status = ?
       ORDER BY p.created_at DESC`,
      [status]
    );
    return res.json({ success: true, posts });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load posts', error: error.message });
  }
});

router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const posts = await query(
      `SELECT p.id, p.title, p.slug, p.excerpt, p.content, p.cover_image, p.category, p.status,
              p.created_at, p.updated_at, u.name AS author_name
       FROM posts p
       LEFT JOIN users u ON u.id = p.author_id
       ORDER BY p.created_at DESC`
    );
    return res.json({ success: true, posts });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load admin posts', error: error.message });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const rows = await query(
      `SELECT p.id, p.title, p.slug, p.excerpt, p.content, p.cover_image, p.category, p.status,
              p.created_at, p.updated_at, u.name AS author_name
       FROM posts p
       LEFT JOIN users u ON u.id = p.author_id
       WHERE p.slug = ? AND p.status = 'published'
       LIMIT 1`,
      [req.params.slug]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    return res.json({ success: true, post: rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load post', error: error.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, excerpt, content, cover_image, category, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const cleanTitle = title.trim();
    const slugBase = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = `${slugBase}-${Date.now()}`;
    const finalStatus = req.user.role === 'admin' ? (status || 'published') : 'draft';

    const result = await query(
      `INSERT INTO posts (author_id, title, slug, excerpt, content, cover_image, category, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, cleanTitle, slug, excerpt || '', content, cover_image || '', category || 'General', finalStatus]
    );

    return res.status(201).json({ success: true, postId: result.insertId, slug, status: finalStatus });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to save post', error: error.message });
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, excerpt, content, cover_image, category, status } = req.body;
    await query(
      `UPDATE posts
       SET title = ?, excerpt = ?, content = ?, cover_image = ?, category = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [title, excerpt || '', content, cover_image || '', category || 'General', status || 'draft', req.params.id]
    );
    return res.json({ success: true, message: 'Post updated' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to update post', error: error.message });
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to delete post', error: error.message });
  }
});

export default router;
