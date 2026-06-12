import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const port = Number(process.env.PORT || 3000);

process.on('uncaughtException', (error) => console.error('Uncaught exception:', error));
process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason));

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
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
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'change_me',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ success: false, message: 'Login required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'change_me');
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
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `post-${Date.now()}`;
}

function buildFallback({ title = '', content = '', category = '' }) {
  const baseTitle = title.trim() || 'A Fresh Perspective on India Today';
  const plainContent = content.trim() || 'Write a thoughtful post with Indian examples, clear paragraphs, and a strong conclusion.';
  const safeCategory = category.trim() || 'Culture';
  const tags = Array.from(new Set([
    safeCategory.toLowerCase(),
    'india',
    'author',
    'blog',
    ...baseTitle.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 4).slice(0, 4)
  ])).slice(0, 8);
  return {
    title: baseTitle,
    excerpt: plainContent.slice(0, 150),
    category: safeCategory,
    content: baseTitle + '\n\n' + plainContent + '\n\nSuggested direction: keep the tone warm, vivid, practical, and reader-friendly. Add Indian places, people, culture, and one clear closing thought.',
    tags,
    hashtags: tags.map((tag) => '#' + tag.replace(/[^a-z0-9]/g, ''))
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
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>YE MERA INDIA | Vivid States, One India</title>
<style>
:root{--bg:#080302;--deep:#170805;--card:#201009;--line:#7c2d12;--saffron:#ff6a00;--gold:#fbbf24;--cream:#fff7ed;--green:#22c55e;--blue:#38bdf8;--pink:#fb7185;--violet:#a78bfa}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--cream);font-family:Inter,Arial,sans-serif;overflow-x:hidden}a{color:inherit;text-decoration:none}.nav{position:sticky;top:0;z-index:20;background:rgba(22,8,4,.94);backdrop-filter:blur(14px);border-bottom:1px solid rgba(251,191,36,.2);padding:17px 7%;display:flex;justify-content:space-between;align-items:center}.brand{font-family:Georgia,serif;font-size:28px;font-weight:900;letter-spacing:.06em}.gold{color:var(--gold)}.links{display:flex;gap:20px;align-items:center}.links a{font-size:12px;text-transform:uppercase;letter-spacing:.14em;font-weight:900;opacity:.9}.links a:hover{color:var(--gold)}.hide{display:none!important}.btn,button{display:inline-flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--saffron),var(--gold));color:#170805;border:0;padding:14px 20px;font-weight:950;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;box-shadow:0 12px 35px rgba(255,106,0,.22)}.btn2{background:transparent;color:var(--cream);border:1px solid rgba(251,191,36,.46);box-shadow:none}.wrap{max-width:1220px;margin:auto;padding:72px 24px}.hero{position:relative;min-height:84vh;display:grid;grid-template-columns:1.03fr .97fr;gap:42px;align-items:center}.hero:before{content:'';position:absolute;inset:-130px -18vw;background:radial-gradient(circle at 15% 16%,rgba(255,106,0,.3),transparent 28%),radial-gradient(circle at 88% 18%,rgba(56,189,248,.22),transparent 24%),radial-gradient(circle at 62% 80%,rgba(34,197,94,.18),transparent 30%);z-index:-1}.badge{display:inline-flex;border:1px solid rgba(251,191,36,.45);padding:9px 12px;color:var(--gold);font-size:11px;font-weight:950;letter-spacing:.18em;text-transform:uppercase;background:rgba(251,191,36,.06)}h1{font-family:Georgia,serif;font-size:84px;line-height:.94;margin:18px 0 0}h2{font-family:Georgia,serif;font-size:44px;margin:0 0 14px}.lead{font-size:20px;line-height:1.8;color:rgba(255,247,237,.78);max-width:690px}.hero-actions{display:flex;gap:14px;flex-wrap:wrap;margin-top:30px}.india-map{position:relative;min-height:570px;border:1px solid rgba(251,191,36,.24);background:linear-gradient(155deg,rgba(255,247,237,.07),rgba(255,106,0,.08));overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.35)}.india-map:before{content:'भारत';position:absolute;right:-34px;bottom:0;font-family:Georgia,serif;font-size:128px;font-weight:900;color:rgba(255,247,237,.05)}.state-chip{position:absolute;min-width:145px;padding:14px;border:1px solid rgba(255,247,237,.18);background:rgba(8,3,2,.75);box-shadow:0 18px 45px rgba(0,0,0,.32)}.state-chip b{display:block;font-family:Georgia,serif;font-size:20px}.state-chip span{font-size:12px;color:rgba(255,247,237,.68)}.c1{left:32px;top:42px;border-color:rgba(56,189,248,.45)}.c2{right:42px;top:72px;border-color:rgba(251,191,36,.5)}.c3{left:92px;top:198px;border-color:rgba(251,113,133,.5)}.c4{right:68px;top:230px;border-color:rgba(34,197,94,.5)}.c5{left:46px;bottom:92px;border-color:rgba(167,139,250,.5)}.c6{right:118px;bottom:54px;border-color:rgba(255,106,0,.55)}.center-unity{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:230px;height:230px;border-radius:50%;display:flex;align-items:center;justify-content:center;text-align:center;background:conic-gradient(from 40deg,var(--saffron),var(--gold),var(--green),var(--blue),var(--pink),var(--saffron));padding:8px}.center-unity div{height:100%;width:100%;border-radius:50%;background:#110603;display:flex;align-items:center;justify-content:center;flex-direction:column}.center-unity strong{font-family:Georgia,serif;font-size:54px}.center-unity small{font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:var(--gold)}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.two{grid-template-columns:1fr 1fr}.card{position:relative;background:linear-gradient(145deg,rgba(255,247,237,.07),rgba(255,106,0,.05));border:1px solid rgba(251,191,36,.18);padding:26px;overflow:hidden}.state-card{min-height:235px}.state-card .emoji{font-size:40px}.state-card p,.muted,.post{color:rgba(255,247,237,.72);line-height:1.7}.river{background:linear-gradient(135deg,rgba(56,189,248,.16),rgba(255,255,255,.03))}.desert{background:linear-gradient(135deg,rgba(251,191,36,.16),rgba(255,255,255,.03))}.forest{background:linear-gradient(135deg,rgba(34,197,94,.14),rgba(255,255,255,.03))}.festival{background:linear-gradient(135deg,rgba(251,113,133,.14),rgba(255,255,255,.03))}.mountain{background:linear-gradient(135deg,rgba(167,139,250,.16),rgba(255,255,255,.03))}.coast{background:linear-gradient(135deg,rgba(14,165,233,.16),rgba(255,255,255,.03))}.ribbon{border-block:1px solid rgba(251,191,36,.18);background:linear-gradient(90deg,#ff6a00,#fff7ed,#22c55e);color:#160804;padding:20px 0;white-space:nowrap;overflow:hidden}.ribbon div{font-family:Georgia,serif;font-size:31px;font-weight:900;animation:marquee 28s linear infinite}@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}.input,textarea,select{width:100%;padding:15px;margin:8px 0;background:#080403;color:var(--cream);border:1px solid rgba(251,191,36,.26)}textarea{min-height:170px}.msg{color:var(--gold);margin:8px 0}.post{white-space:pre-wrap}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}.stat b{display:block;font-family:Georgia,serif;font-size:44px;color:var(--gold)}footer{border-top:1px solid rgba(251,191,36,.18);padding:35px 7%;color:rgba(255,247,237,.68)}@media(max-width:900px){.hero,.grid,.two,.stats{grid-template-columns:1fr}h1{font-size:52px}.links{display:none}.india-map{min-height:auto;padding:20px}.state-chip{position:relative;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;margin:12px}.center-unity{position:relative;left:auto;top:auto;transform:none;margin:24px auto}}
</style>
</head>
<body>
<nav class="nav"><a href="#home" class="brand">YE MERA <span class="gold">INDIA</span></a><div class="links"><a href="#home">Home</a><a href="#states">States</a><a href="#posts">Posts</a><a href="#login" id="loginNav">Sign In</a><a href="#dashboard" id="dashNav" class="hide">Dashboard</a><a href="#logout" id="logoutNav" class="hide">Logout</a></div></nav>
<main id="app"></main>
<footer>YE MERA INDIA — vivid states, many voices, one united story.</footer>
<script>
var app = document.getElementById('app');
var loginNav = document.getElementById('loginNav');
var dashNav = document.getElementById('dashNav');
var logoutNav = document.getElementById('logoutNav');
function getUser(){ try { return JSON.parse(localStorage.getItem('ymi_user') || 'null'); } catch(e) { return null; } }
function getToken(){ return localStorage.getItem('ymi_token') || ''; }
async function api(path, options){
  options = options || {};
  var headers = {'Content-Type':'application/json'};
  if (getToken()) headers.Authorization = 'Bearer ' + getToken();
  var response = await fetch('/api' + path, Object.assign({}, options, {headers: headers}));
  var data = await response.json().catch(function(){ return {}; });
  if (!response.ok) throw new Error(data.message || data.error || 'Request failed');
  return data;
}
function nav(){
  var user = getUser();
  loginNav.classList.toggle('hide', !!user);
  dashNav.classList.toggle('hide', !user);
  logoutNav.classList.toggle('hide', !user);
  dashNav.href = user && user.role === 'admin' ? '#admin' : '#dashboard';
}
logoutNav.onclick = function(){ localStorage.clear(); location.hash = '#login'; nav(); };
function render(content){ app.innerHTML = content; nav(); window.scrollTo(0,0); }
function home(){
  render('<section class="wrap hero"><div><span class="badge">Vivid states - One India</span><h1>Different lands, <span class="gold">one heartbeat.</span></h1><p class="lead">From Himalayan silence to coastal rhythm, from desert courage to river wisdom - YE MERA INDIA brings every state environment, language, food, festival and thought into one united author platform.</p><div class="hero-actions"><a class="btn" href="#states">Explore States</a><a class="btn btn2" href="#posts">Read Stories</a><a class="btn btn2" href="#signup">Join Readers</a></div></div><div class="india-map"><div class="state-chip c1"><b>Himalaya</b><span>Snow, prayer flags, quiet courage</span></div><div class="state-chip c2"><b>Rajasthan</b><span>Desert forts, folk songs, golden dunes</span></div><div class="state-chip c3"><b>Punjab</b><span>Fields, food, festivals, fearless joy</span></div><div class="state-chip c4"><b>Bengal</b><span>Rivers, poetry, art and debate</span></div><div class="state-chip c5"><b>Kerala</b><span>Backwaters, monsoon, green calm</span></div><div class="state-chip c6"><b>Tamil Nadu</b><span>Temples, coast, classical strength</span></div><div class="center-unity"><div><strong>1</strong><small>India</small></div></div></div></section><div class="ribbon"><div>Unity in Diversity - Anekta Mein Ekta - Vivid States, One Nation - Unity in Diversity - Anekta Mein Ekta - Vivid States, One Nation -</div></div><section class="wrap" id="states"><span class="badge">Homepage environment</span><h2>India changes every few miles, but the feeling remains one.</h2><div class="grid"><div class="card state-card mountain"><div class="emoji">&#127956;</div><h2>Mountains</h2><p>Himachal, Uttarakhand, Ladakh and the North-East carry stories of discipline, spirituality and nature.</p></div><div class="card state-card desert"><div class="emoji">&#127964;</div><h2>Desert</h2><p>Rajasthan shows how color, music and pride can bloom in the toughest climate.</p></div><div class="card state-card river"><div class="emoji">&#127754;</div><h2>Rivers</h2><p>Ganga, Brahmaputra, Narmada and Godavari connect farms, faith, cities and civilizations.</p></div><div class="card state-card forest"><div class="emoji">&#127793;</div><h2>Forests</h2><p>Central India and the North-East remind us about tribal wisdom, biodiversity and balance.</p></div><div class="card state-card coast"><div class="emoji">&#128026;</div><h2>Coasts</h2><p>Gujarat, Maharashtra, Goa, Kerala, Odisha and Tamil Nadu open India to trade, travel and taste.</p></div><div class="card state-card festival"><div class="emoji">&#128367;</div><h2>Festivals</h2><p>Diwali, Eid, Christmas, Pongal, Bihu, Onam, Navratri and Holi turn diversity into celebration.</p></div></div></section><section class="wrap two grid"><div class="card"><span class="badge">Author vision</span><h2>Write India as it is lived.</h2><p class="muted">This platform is for articles, reflections, travel notes, cultural essays, reader thoughts and AI-assisted post creation with tags and hashtags.</p></div><div class="card"><span class="badge">One united voice</span><h2>Many states. Many languages. One story.</h2><p class="muted">Every dashboard post becomes a draft or published story, helping readers see India as colorful, practical, emotional and united.</p></div></section>');
}
async function posts(){
  var data = await api('/posts').catch(function(){ return {posts:[]}; });
  var html = '<section class="wrap"><span class="badge">Author Posts</span><h2>Blog & Stories</h2>';
  if (data.posts.length) {
    html += data.posts.map(function(p){ return '<div class="card"><h2>'+escapeHtml(p.title)+'</h2><p class="gold">'+escapeHtml(p.category || '')+'</p><p>'+escapeHtml(p.excerpt || '')+'</p><div class="post">'+escapeHtml((p.content || '').slice(0,1200))+'</div></div>'; }).join('');
  } else {
    html += '<div class="card">No published posts yet.</div>';
  }
  html += '</section>';
  render(html);
}
function escapeHtml(value){ return String(value || '').replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]; }); }
function auth(mode){
  render('<section class="wrap" style="max-width:540px"><div class="card"><span class="badge">'+(mode==='signup'?'Create Account':'Welcome Back')+'</span><h2>'+(mode==='signup'?'Join YE MERA INDIA':'Sign In')+'</h2><form id="authForm">'+(mode==='signup'?'<input class="input" name="name" placeholder="Name" required>':'')+'<input class="input" name="email" type="email" placeholder="Email" required><input class="input" name="password" type="password" placeholder="Password" required><div id="formMsg" class="msg"></div><button>'+(mode==='signup'?'Signup':'Signin')+'</button></form></div></section>');
  document.getElementById('authForm').onsubmit = async function(event){
    event.preventDefault();
    try {
      var body = JSON.stringify(Object.fromEntries(new FormData(event.target)));
      var data = await api('/auth/' + (mode === 'signup' ? 'signup' : 'signin'), {method:'POST', body: body});
      localStorage.setItem('ymi_token', data.token);
      localStorage.setItem('ymi_user', JSON.stringify(data.user));
      location.hash = data.user.role === 'admin' ? '#admin' : '#dashboard';
    } catch(error) {
      document.getElementById('formMsg').innerHTML = escapeHtml(error.message);
    }
  };
}
function postForm(isAdmin){
  return '<div class="grid two"><div class="card"><span class="badge">AI assistant</span><h2>Help me write</h2><input id="tone" class="input" value="professional Indian editorial"><button id="aiBtn">AI Help Me Write</button><div id="aiMsg" class="msg"></div></div><form id="postForm" class="card"><h2>'+(isAdmin?'Create Blog Post':'Submit Thought')+'</h2><input id="title" class="input" placeholder="Title" required><input id="excerpt" class="input" placeholder="Excerpt"><input id="category" class="input" value="'+(isAdmin?'Culture':'Reader Voice')+'"><textarea id="content" placeholder="Content" required></textarea><input id="tags" class="input" placeholder="Tags"><input id="hashtags" class="input" placeholder="Hashtags">'+(isAdmin?'<select id="status" class="input"><option value="published">Published</option><option value="draft">Draft</option></select>':'')+'<div id="postMsg" class="msg"></div><button>Save</button></form></div>';
}
function bindPostForm(isAdmin){
  document.getElementById('aiBtn').onclick = async function(){
    document.getElementById('aiMsg').innerHTML = 'Generating...';
    try {
      var data = await api('/ai/post-assist', {method:'POST', body: JSON.stringify({title:title.value, content:content.value, category:category.value, tone:tone.value})});
      var s = data.suggestion || {};
      title.value = s.title || title.value;
      excerpt.value = s.excerpt || excerpt.value;
      category.value = s.category || category.value;
      content.value = s.content || content.value;
      tags.value = Array.isArray(s.tags) ? s.tags.join(', ') : tags.value;
      hashtags.value = Array.isArray(s.hashtags) ? s.hashtags.join(' ') : hashtags.value;
      document.getElementById('aiMsg').innerHTML = 'AI suggestion applied. Review before saving.';
    } catch(error) {
      document.getElementById('aiMsg').innerHTML = escapeHtml(error.message);
    }
  };
  document.getElementById('postForm').onsubmit = async function(event){
    event.preventDefault();
    try {
      var finalContent = content.value + '\n\nTags: ' + tags.value + '\nHashtags: ' + hashtags.value;
      await api('/posts', {method:'POST', body: JSON.stringify({title:title.value, excerpt:excerpt.value, category:category.value, content:finalContent, status:isAdmin ? status.value : 'draft'})});
      document.getElementById('postMsg').innerHTML = 'Saved successfully.';
      event.target.reset();
    } catch(error) {
      document.getElementById('postMsg').innerHTML = escapeHtml(error.message);
    }
  };
}
function dashboard(){
  var user = getUser();
  if (!user) { location.hash = '#login'; return; }
  render('<section class="wrap"><span class="badge">Reader Dashboard</span><h2>Namaste, '+escapeHtml(user.name)+'</h2>'+postForm(false)+'</section>');
  bindPostForm(false);
}
async function admin(){
  var user = getUser();
  if (!user) { location.hash = '#login'; return; }
  if (user.role !== 'admin') { location.hash = '#dashboard'; return; }
  var stats = await api('/admin/stats').catch(function(){ return {stats:{users:0,posts:0,published:0,drafts:0}}; });
  render('<section class="wrap"><span class="badge">Admin Console</span><h2>Admin Dashboard</h2><div class="stats"><div class="card stat"><b>'+stats.stats.users+'</b>Users</div><div class="card stat"><b>'+stats.stats.posts+'</b>Posts</div><div class="card stat"><b>'+stats.stats.published+'</b>Published</div><div class="card stat"><b>'+stats.stats.drafts+'</b>Drafts</div></div>'+postForm(true)+'</section>');
  bindPostForm(true);
}
function route(){
  var page = (location.hash || '#home').slice(1);
  if (page === 'states') home();
  else if (page === 'posts') posts();
  else if (page === 'login') auth('login');
  else if (page === 'signup') auth('signup');
  else if (page === 'dashboard') dashboard();
  else if (page === 'admin') admin();
  else home();
}
window.onhashchange = route;
route();
</script>
</body>
</html>`;
}

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
  try {
    const users = await query('SELECT id, name, email, role, status FROM users WHERE id = ? LIMIT 1', [req.user.id]);
    if (!users.length) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: users[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load user', error: error.message });
  }
});

app.get('/api/posts', async (req, res) => {
  try {
    const posts = await query("SELECT p.id, p.title, p.slug, p.excerpt, p.content, p.cover_image, p.category, p.status, p.created_at, p.updated_at, u.name AS author_name FROM posts p LEFT JOIN users u ON u.id = p.author_id WHERE p.status = 'published' ORDER BY p.created_at DESC");
    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load posts', error: error.message });
  }
});

app.get('/api/posts/admin/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const posts = await query('SELECT p.id, p.title, p.slug, p.excerpt, p.content, p.cover_image, p.category, p.status, p.created_at, p.updated_at, u.name AS author_name FROM posts p LEFT JOIN users u ON u.id = p.author_id ORDER BY p.created_at DESC');
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
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful Indian blog writing assistant. Return strict JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ success: false, message: data?.error?.message || 'AI provider request failed' });
    const text = data?.choices?.[0]?.message?.content || '';
    res.json({ success: true, source: 'openai', suggestion: extractJson(text) || buildFallback({ title, content, category }) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI post assistant failed', error: error.message });
  }
});

app.get(/.*/, (req, res) => {
  res.type('html').send(websiteHtml());
});

app.listen(port, '0.0.0.0', () => {
  console.log(`YE MERA INDIA server running on 0.0.0.0:${port}`);
});
