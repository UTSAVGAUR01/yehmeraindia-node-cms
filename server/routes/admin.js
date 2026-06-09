import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/stats', async (req, res) => {
  try {
    const userRows = await query('SELECT COUNT(*) AS total FROM users');
    const postRows = await query('SELECT COUNT(*) AS total FROM posts');
    const publishedRows = await query("SELECT COUNT(*) AS total FROM posts WHERE status = 'published'");
    const draftRows = await query("SELECT COUNT(*) AS total FROM posts WHERE status = 'draft'");

    return res.json({
      success: true,
      stats: {
        users: userRows[0].total,
        posts: postRows[0].total,
        published: publishedRows[0].total,
        drafts: draftRows[0].total
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load stats', error: error.message });
  }
});

router.get('/members', async (req, res) => {
  try {
    const members = await query('SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC');
    return res.json({ success: true, members });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load members', error: error.message });
  }
});

export default router;
