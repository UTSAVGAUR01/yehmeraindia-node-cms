import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
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
  return jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, process.env.JWT_SECRET || 'change_me', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ success: false, message: 'Login required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'change_me');
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
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
    hashtags: tags.map((tag) => `#${tag.replace(/[^a-z0-9]/g, '')}`)
  };
}

function extractJson(text) {
  try {
    const cleaned = String(text || '').replace(/```json|```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

function websiteHtml() {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>YE MERA INDIA</title><style>body{margin:0;background:#060302;color:#fff7ed;font-family:Arial,sans-serif}.nav{background:#190c07;border-bottom:1px solid #5c240c;padding:18px 8%;display:flex;justify-content:space-between;align-items:center}.brand{font-family:Georgia,serif;font-size:28px;font-weight:900}.gold{color:#fbbf24}.links a{margin-left:20px;color:#fff7ed;text-decoration:none;font-weight:800}.btn,button{background:#ff6a00;color:#180704;border:0;padding:13px 18px;font-weight:900;cursor:pointer}.btn2{background:transparent;color:#fff7ed;border:1px solid #ff6a00}.wrap{max-width:1180px;margin:auto;padding:60px 24px}.hero{display:grid;grid-template-columns:1.1fr .9fr;gap:30px;align-items:center;min-height:70vh}h1{font-family:Georgia,serif;font-size:80px;line-height:.95;margin:0}h2{font-family:Georgia,serif;font-size:44px}.card{background:#120b08;border:1px solid #6b2c10;padding:24px;margin:16px 0}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.two{grid-template-columns:1fr 1fr}.input,textarea,select{width:100%;padding:14px;margin:8px 0;background:#080403;color:#fff7ed;border:1px solid #5c240c}textarea{min-height:160px}.msg{color:#fbbf24;margin:8px 0}.post{white-space:pre-wrap;color:#d7c4b5}.hide{display:none}@media(max-width:800px){.hero,.grid,.two{grid-template-columns:1fr}h1{font-size:48px}.links{display:none}}</style></head><body><div class="nav"><div class="brand">YE MERA <span class="gold">INDIA</span></div><div class="links"><a href="#home">Home</a><a href="#posts">Posts</a><a href="#login" id="loginNav">Sign In</a><a href="#dashboard" id="dashNav" class="hide">Dashboard</a><a href="#logout" id="logoutNav" class="hide">Logout</a></div></div><main id="app"></main><script>let U=()=>JSON.parse(localStorage.getItem('ymi_user')||'null'),T=()=>localStorage.getItem('ymi_token')||'';async function api(p,o={}){let h={'Content-Type':'application/json'};if(T())h.Authorization='Bearer '+T();let r=await fetch('/api'+p,{...o,headers:h});let d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||d.error||'Request failed');return d}function nav(){let u=U();loginNav.classList.toggle('hide',!!u);dashNav.classList.toggle('hide',!u);logoutNav.classList.toggle('hide',!u);dashNav.href=u&&u.role==='admin'?'#admin':'#dashboard'}logoutNav.onclick=()=>{localStorage.clear();location.hash='#login';nav()};function html(x){app.innerHTML=x;nav();scrollTo(0,0)}function home(){html('<section class="wrap hero"><div><h1>Stories with an <span class="gold">Indian Soul</span></h1><p>Author blog, reader dashboard, admin publishing and AI post writing assistant.</p><p><a class="btn" href="#posts">Read Blog</a> <a class="btn btn2" href="#signup">Join Readers</a></p></div><div><div class="card"><h2>Admin Studio</h2><p>Create and publish posts.</p></div><div class="card"><h2>AI Helper</h2><p>Generate content, tags and hashtags.</p></div></div></section><section class="wrap grid"><div class="card"><h2>Write</h2><p>Create articles.</p></div><div class="card"><h2>Review</h2><p>Approve drafts.</p></div><div class="card"><h2>Publish</h2><p>Grow readers.</p></div></section>')}async function posts(){let d=await api('/posts').catch(()=>({posts:[]}));html('<section class="wrap"><h2>Blog & Stories</h2>'+(d.posts.length?d.posts.map(p=>'<div class="card"><h2>'+p.title+'</h2><p class="gold">'+p.category+'</p><p>'+p.excerpt+'</p><div class="post">'+(p.content||'').slice(0,1000)+'</div></div>').join(''):'<div class="card">No published posts yet.</div>')+'</section>')}function auth(m){html('<section class="wrap" style="max-width:520px"><div class="card"><h2>'+(m==='signup'?'Create Account':'Sign In')+'</h2><form id="f">'+(m==='signup'?'<input class="input" name="name" placeholder="Name" required>':'')+'<input class="input" name="email" type="email" placeholder="Email" required><input class="input" name="password" type="password" placeholder="Password" required><div id="msg"></div><button>'+(m==='signup'?'Signup':'Signin')+'</button></form></div></section>');f.onsubmit=async e=>{e.preventDefault();let body=JSON.stringify(Object.fromEntries(new FormData(f)));try{let d=await api('/auth/'+(m==='signup'?'signup':'signin'),{method:'POST',body});localStorage.setItem('ymi_token',d.token);localStorage.setItem('ymi_user',JSON.stringify(d.user));location.hash=d.user.role==='admin'?'#admin':'#dashboard'}catch(x){msg.innerHTML='<p class="msg">'+x.message+'</p>'}}}function form(admin){return '<div class="grid two"><div class="card"><h2>AI Writing Assistant</h2><input id="tone" class="input" value="professional Indian editorial"><button id="ai">AI Help Me Write</button><div id="aimsg" class="msg"></div></div><form id="pf" class="card"><h2>'+(admin?'Create Blog Post':'Submit Thought')+'</h2><input id="title" class="input" placeholder="Title" required><input id="excerpt" class="input" placeholder="Excerpt"><input id="category" class="input" value="'+(admin?'Culture':'Reader Voice')+'"><textarea id="content" placeholder="Content" required></textarea><input id="tags" class="input" placeholder="Tags"><input id="hashtags" class="input" placeholder="Hashtags">'+(admin?'<select id="status" class="input"><option value="published">Published</option><option value="draft">Draft</option></select>':'')+'<div id="pmsg" class="msg"></div><button>Save</button></form></div>'}function bind(admin){ai.onclick=async()=>{aimsg.innerHTML='Generating...';try{let d=await api('/ai/post-assist',{method:'POST',body:JSON.stringify({title:title.value,content:content.value,category:category.value,tone:tone.value})});let s=d.suggestion;title.value=s.title||title.value;excerpt.value=s.excerpt||excerpt.value;category.value=s.category||category.value;content.value=s.content||content.value;tags.value=(s.tags||[]).join(', ');hashtags.value=(s.hashtags||[]).join(' ');aimsg.innerHTML='AI suggestion applied.'}catch(e){aimsg.innerHTML=e.message}};pf.onsubmit=async e=>{e.preventDefault();try{let c=content.value+'\\n\\nTags: '+tags.value+'\\nHashtags: '+hashtags.value;await api('/posts',{method:'POST',body:JSON.stringify({title:title.value,excerpt:excerpt.value,category:category.value,content:c,status:admin?(status.value):'draft'})});pmsg.innerHTML='Saved successfully.';pf.reset()}catch(x){pmsg.innerHTML=x.message}}}function dashboard(){if(!U())return location.hash='#login';html('<section class="wrap"><h2>Reader Dashboard</h2>'+form(false)+'</section>');bind(false)}async function admin(){let u=U();if(!u)return location.hash='#login';if(u.role!=='admin')return location.hash='#dashboard';let s=await api('/admin/stats').catch(()=>({stats:{users:0,posts:0,published:0,drafts:0}}));html('<section class="wrap"><h2>Admin Dashboard</h2><div class="grid"><div class="card">Users: '+s.stats.users+'</div><div class="card">Posts: '+s.stats.posts+'</div><div class="card">Published: '+s.stats.published+'</div></div>'+form(true)+'</section>');bind(true)}function route(){let r=(location.hash||'#home').slice(1);if(r==='posts')posts();else if(r==='login')auth('login');else if(r==='signup')auth('signup');else if(r==='dashboard')dashboard();else if(r==='admin')admin();else home()}onhashchange=route;route();</script></body></html>`;
}

process.on('uncaughtException', (error) => console.error('Uncaught exception:', error));
process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason));

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'YE MERA INDIA API is running' }));
app.get('/api/health/db', async (req, res) => { try { const rows = await query('SELECT COUNT(*) AS total_users FROM users'); res.json({ success: true, database: 'connected', total_users: rows[0].total_users }); } catch (error) { res.status(500).json({ success: false, database: 'failed', message: error.message }); } });

app.post('/api/auth/signup', async (req, res) => { try { const { name, email, password } = req.body; if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' }); const existing = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]); if (existing.length) return res.status(409).json({ success: false, message: 'Email already registered' }); const hashedPassword = await bcrypt.hash(password, 10); const result = await query('INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)', [name, email, hashedPassword, 'user', 'active']); const user = { id: result.insertId, name, email, role: 'user', status: 'active' }; res.status(201).json({ success: true, token: signToken(user), user: publicUser(user) }); } catch (error) { res.status(500).json({ success: false, message: 'Signup failed', error: error.message }); } });
app.post('/api/auth/signin', async (req, res) => { try { const { email, password } = req.body; if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' }); const users = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]); const user = users[0]; if (!user || user.status !== 'active') return res.status(401).json({ success: false, message: 'Invalid login details' }); const valid = await bcrypt.compare(password, user.password); if (!valid) return res.status(401).json({ success: false, message: 'Invalid login details' }); res.json({ success: true, token: signToken(user), user: publicUser(user) }); } catch (error) { res.status(500).json({ success: false, message: 'Signin failed', error: error.message }); } });
app.get('/api/auth/me', requireAuth, async (req, res) => { const users = await query('SELECT id, name, email, role, status FROM users WHERE id = ? LIMIT 1', [req.user.id]); if (!users.length) return res.status(404).json({ success: false, message: 'User not found' }); res.json({ success: true, user: users[0] }); });
app.get('/api/posts', async (req, res) => { try { const posts = await query(`SELECT p.id, p.title, p.slug, p.excerpt, p.content, p.cover_image, p.category, p.status, p.created_at, p.updated_at, u.name AS author_name FROM posts p LEFT JOIN users u ON u.id = p.author_id WHERE p.status = 'published' ORDER BY p.created_at DESC`); res.json({ success: true, posts }); } catch (error) { res.status(500).json({ success: false, message: 'Unable to load posts', error: error.message }); } });
app.get('/api/posts/admin/all', requireAuth, requireAdmin, async (req, res) => { try { const posts = await query(`SELECT p.id, p.title, p.slug, p.excerpt, p.content, p.cover_image, p.category, p.status, p.created_at, p.updated_at, u.name AS author_name FROM posts p LEFT JOIN users u ON u.id = p.author_id ORDER BY p.created_at DESC`); res.json({ success: true, posts }); } catch (error) { res.status(500).json({ success: false, message: 'Unable to load admin posts', error: error.message }); } });
app.post('/api/posts', requireAuth, async (req, res) => { try { const { title, excerpt, content, cover_image, category, status } = req.body; if (!title || !content) return res.status(400).json({ success: false, message: 'Title and content are required' }); const finalStatus = req.user.role === 'admin' ? (status || 'published') : 'draft'; const slug = `${slugify(title)}-${Date.now()}`; const result = await query('INSERT INTO posts (author_id, title, slug, excerpt, content, cover_image, category, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [req.user.id, title.trim(), slug, excerpt || '', content, cover_image || '', category || 'General', finalStatus]); res.status(201).json({ success: true, postId: result.insertId, slug, status: finalStatus }); } catch (error) { res.status(500).json({ success: false, message: 'Unable to save post', error: error.message }); } });
app.get('/api/admin/stats', requireAuth, requireAdmin, async (req, res) => { try { const userRows = await query('SELECT COUNT(*) AS total FROM users'); const postRows = await query('SELECT COUNT(*) AS total FROM posts'); const publishedRows = await query("SELECT COUNT(*) AS total FROM posts WHERE status = 'published'"); const draftRows = await query("SELECT COUNT(*) AS total FROM posts WHERE status = 'draft'"); res.json({ success: true, stats: { users: userRows[0].total, posts: postRows[0].total, published: publishedRows[0].total, drafts: draftRows[0].total } }); } catch (error) { res.status(500).json({ success: false, message: 'Unable to load stats', error: error.message }); } });
app.post('/api/ai/post-assist', requireAuth, async (req, res) => { try { const { title = '', content = '', category = '', tone = 'professional Indian editorial' } = req.body || {}; const apiKey = process.env.OPENAI_API_KEY; if (!apiKey) return res.json({ success: true, source: 'fallback', suggestion: buildFallback({ title, content, category }) }); const prompt = `Return ONLY valid JSON with keys title, excerpt, category, content, tags, hashtags. Tone: ${tone}. Draft title: ${title}. Category: ${category}. Draft idea: ${content}`; const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages: [{ role: 'system', content: 'You are a blog writing assistant. Return strict JSON only.' }, { role: 'user', content: prompt }], temperature: 0.7 }) }); const data = await response.json(); if (!response.ok) return res.status(response.status).json({ success: false, message: data?.error?.message || 'AI provider request failed' }); const suggestion = extractJson(data?.choices?.[0]?.message?.content || '') || buildFallback({ title, content, category }); res.json({ success: true, source: 'openai', suggestion }); } catch (error) { res.status(500).json({ success: false, message: error.message || 'AI post assistant failed' }); } });

app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'API route not found' }));
app.use((req, res) => res.type('html').send(websiteHtml()));
app.listen(port, '0.0.0.0', () => console.log(`YE MERA INDIA server running on 0.0.0.0:${port}`));
