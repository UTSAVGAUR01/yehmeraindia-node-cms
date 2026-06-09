import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function buildFallback({ title = '', content = '', category = '' }) {
  const baseTitle = title?.trim() || 'A Fresh Perspective on India Today';
  const plainContent = content?.trim() || 'Write a thoughtful post with a clear introduction, practical examples, and a strong closing note for Indian readers.';
  const safeCategory = category?.trim() || 'Culture';

  const tags = Array.from(new Set([
    safeCategory.toLowerCase(),
    'india',
    'author',
    'blog',
    ...baseTitle.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 4).slice(0, 4)
  ])).slice(0, 8);

  const hashtags = tags.map((tag) => `#${tag.replace(/[^a-z0-9]/g, '')}`).filter((tag) => tag.length > 1).slice(0, 8);

  return {
    title: baseTitle,
    excerpt: plainContent.slice(0, 150),
    category: safeCategory,
    content: `${baseTitle}\n\n${plainContent}\n\nSuggested direction: keep the tone warm, practical, and reader-friendly. Add examples, cultural context, and a clear conclusion.`,
    tags,
    hashtags
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

router.post('/post-assist', requireAuth, async (req, res) => {
  try {
    const { title = '', content = '', category = '', tone = 'professional Indian editorial' } = req.body || {};
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.json({
        success: true,
        source: 'fallback',
        message: 'OPENAI_API_KEY is not configured. Returned local suggestions.',
        suggestion: buildFallback({ title, content, category })
      });
    }

    const prompt = `You are helping an Indian author write a blog post for YE MERA INDIA.\n\nReturn ONLY valid JSON with these keys: title, excerpt, category, content, tags, hashtags.\n\nRules:\n- title: attractive but not clickbait\n- excerpt: 120 to 160 characters\n- category: one simple category\n- content: 500 to 800 words, clear paragraphs\n- tags: 6 to 10 lowercase tags without #\n- hashtags: 6 to 10 hashtags with #\n- tone: ${tone}\n\nUser draft title: ${title}\nCategory: ${category}\nDraft/content idea: ${content}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful blog writing assistant. Return strict JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: data?.error?.message || 'AI provider request failed'
      });
    }

    const text = data?.choices?.[0]?.message?.content || '';
    const suggestion = extractJson(text) || buildFallback({ title, content, category });

    return res.json({ success: true, source: 'openai', suggestion });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'AI post assistant failed' });
  }
});

export default router;
