import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import crypto from 'crypto';

const app = express();
const port = Number(process.env.PORT || 3000);
const sessionSecret = process.env.JWT_SECRET || 'change-this-secret';
let pool;
let memoryPosts = [
  { id: 1, title: 'Vivid India, One Canvas', category: 'Vivid India', excerpt: 'A journey through India’s landscapes, colours, people and one united spirit.', content: 'India is a living canvas of mountains, deserts, forests, rivers, festivals, languages and stories.', hashtags: '#VividIndia #OneIndia #IndianStories', created_at: new Date().toISOString() }
];

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '12mb' }));

async function db(sql, params = []) {
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) throw new Error('DB env not configured');
  if (!pool) {
    const mysql = await import('mysql2/promise');
    pool = mysql.createPool({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, waitForConnections: true, connectionLimit: 5 });
  }
  const [rows] = await pool.execute(sql, params);
  return rows;
}
function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map((value) => {
    const index = value.indexOf('=');
    return [decodeURIComponent(value.slice(0, index).trim()), decodeURIComponent(value.slice(index + 1).trim())];
  }));
}
function signSession(user) {
  const payload = Buffer.from(JSON.stringify({ email: user.email, role: user.role, exp: Date.now() + 604800000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', sessionSecret).update(payload).digest('base64url');
  return payload + '.' + sig;
}
function verifySession(token) {
  try {
    const [payload, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', sessionSecret).update(payload).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig || ''), Buffer.from(expected))) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return Date.now() < data.exp && data.role === 'admin' ? data : null;
  } catch { return null; }
}
function getAdmin(req) { return verifySession(parseCookies(req).ymi_admin || ''); }
function requireAdminPage(req, res, next) { if (!getAdmin(req)) return res.redirect('/login'); next(); }
function requireAdminApi(req, res, next) { if (!getAdmin(req)) return res.status(401).json({ success: false, message: 'Admin login required' }); next(); }
function slugify(title) { return String(title || 'post').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now(); }
function publicContent(content) { return String(content || '').replace(/\n\n#.*$/s, ''); }

function page(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>
*{box-sizing:border-box}body{margin:0;background:#080302;color:#fff7ed;font-family:Inter,Arial,sans-serif}a{text-decoration:none;color:inherit}.nav{display:flex;justify-content:space-between;align-items:center;padding:20px 7%;background:#170805;border-bottom:1px solid #7c2d12;position:sticky;top:0;z-index:5}.brand{font:900 32px Georgia;letter-spacing:.08em}.gold{color:#fbbf24}.links{display:flex;gap:22px;font-size:12px;font-weight:900;letter-spacing:.15em;text-transform:uppercase}.wrap{max-width:1220px;margin:auto;padding:58px 24px}.hero{min-height:78vh;display:grid;grid-template-columns:1fr 1fr;gap:45px;align-items:center;background:radial-gradient(circle at 82% 20%,#0ea5e955,transparent 30%),radial-gradient(circle at 12% 22%,#ff6a0055,transparent 32%)}h1{font:900 76px/.95 Georgia;margin:18px 0}h2{font:900 38px Georgia;margin:10px 0 22px}h3{font:900 24px Georgia}.lead,p{color:#d8c9bb;line-height:1.75;font-size:17px}.badge{display:inline-block;border:1px solid #fbbf2470;color:#fbbf24;padding:8px 11px;font-size:11px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.btn,button{display:inline-block;border:0;background:linear-gradient(135deg,#ff6a00,#fbbf24);color:#170805;padding:12px 16px;margin:7px 7px 7px 0;font-weight:900;text-transform:uppercase;letter-spacing:.08em;cursor:pointer}.btn2,.ghost{background:transparent;color:#fff7ed;border:1px solid #fbbf2470}.danger{background:linear-gradient(135deg,#991b1b,#ef4444);color:#fff}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.two{display:grid;grid-template-columns:.8fr 1.2fr;gap:24px}.card{background:linear-gradient(145deg,#fff7ed12,#ff6a000b);border:1px solid #fbbf2430;padding:22px}.ribbon{padding:18px;background:linear-gradient(90deg,#ff6a00,#fff7ed,#22c55e);color:#140604;font:900 24px Georgia;white-space:nowrap;overflow:hidden}input,textarea,select{width:100%;margin:7px 0;padding:13px;background:#120807;border:1px solid #fbbf2440;color:#fff7ed;font-size:15px}textarea{min-height:130px}.small{font-size:13px;color:#bfae9d}.error{color:#fecaca;background:#450a0a;border:1px solid #ef4444;padding:12px}.success{color:#bbf7d0;background:#052e16;border:1px solid #22c55e;padding:12px}.postitem{border:1px solid #fbbf2430;padding:14px;margin:10px 0;background:#120807}.postitem h4{margin:0 0 6px;font:900 20px Georgia}.manager{max-height:760px;overflow:auto}.preview{max-width:100%;border:1px solid #fbbf2440;margin-top:12px;filter:brightness(var(--b,1)) contrast(var(--c,1)) saturate(var(--s,1)) sepia(var(--sep,0)) hue-rotate(var(--hue,0deg));background:#120807}.workflow{display:grid;grid-template-columns:1fr 1fr;gap:16px}.step{border:1px solid #fbbf2430;padding:14px;background:#100503}.step b{color:#fbbf24}.art{min-height:490px;border:1px solid #fbbf2438;position:relative;background:linear-gradient(145deg,#fff7ed12,#ff6a0010);display:grid;place-items:center}.circle{width:230px;height:230px;border-radius:50%;background:conic-gradient(#ff6a00,#fbbf24,#22c55e,#38bdf8,#fb7185,#ff6a00);display:grid;place-items:center}.circle span{width:185px;height:185px;background:#100503;border-radius:50%;display:grid;place-items:center;text-align:center;font:900 42px Georgia}footer{border-top:1px solid #fbbf2430;padding:35px 7%;color:#d8c9bb}@media(max-width:900px){.hero,.grid,.two,.workflow{grid-template-columns:1fr}h1{font-size:50px}.links{display:none}}
</style></head><body><nav class="nav"><a class="brand" href="/">YE MERA <span class="gold">INDIA</span></a><div class="links"><a href="/">Home</a><a href="/posts">Posts</a><a href="/studio">Dashboard</a><a href="/logout">Logout</a></div></nav>${body}<footer>YE MERA INDIA — vivid states, many voices, one united story.</footer></body></html>`;
}

async function validateAdmin(email, password) {
  try {
    const rows = await db('SELECT email,password,role,status FROM users WHERE email=? LIMIT 1', [email]);
    const user = rows[0];
    if (user && user.role === 'admin' && user.status === 'active') {
      const bcrypt = await import('bcryptjs');
      if (await bcrypt.default.compare(password, user.password)) return { email: user.email, role: 'admin' };
    }
  } catch {}
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) return { email, role: 'admin' };
  return null;
}

app.get('/api/health', (req, res) => res.json({ success: true, message: 'YE MERA INDIA API is running' }));
app.get('/api/health/db', async (req, res) => { try { const rows = await db('SELECT COUNT(*) total FROM users'); res.json({ success: true, database: 'connected', total_users: rows[0].total }); } catch (error) { res.status(200).json({ success: false, database: 'fallback', message: error.message }); } });
app.post('/api/auth/login', async (req, res) => {
  const user = await validateAdmin(req.body.email || '', req.body.password || '');
  if (!user) return res.status(401).json({ success: false, message: 'Invalid admin email or password' });
  const secure = (req.headers['x-forwarded-proto'] || '').includes('https') ? '; Secure' : '';
  res.setHeader('Set-Cookie', 'ymi_admin=' + encodeURIComponent(signSession(user)) + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800' + secure);
  res.json({ success: true, user: { email: user.email, role: user.role } });
});
app.get('/logout', (req, res) => { res.setHeader('Set-Cookie', 'ymi_admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'); res.redirect('/login'); });
app.get('/api/posts', async (req, res) => { try { const rows = await db('SELECT id,title,category,excerpt,content,created_at FROM posts ORDER BY id DESC LIMIT 100'); res.json({ success: true, source: 'database', posts: rows.map((post) => ({ ...post, content: publicContent(post.content) })) }); } catch { res.json({ success: true, source: 'memory', posts: memoryPosts }); } });
app.get('/api/admin/posts', requireAdminApi, async (req, res) => { try { const rows = await db('SELECT id,title,category,excerpt,content,created_at FROM posts ORDER BY id DESC LIMIT 100'); res.json({ success: true, source: 'database', posts: rows }); } catch { res.json({ success: true, source: 'memory', posts: memoryPosts }); } });
app.post('/api/posts', requireAdminApi, async (req, res) => {
  const post = { id: Date.now(), title: req.body.title || 'Untitled Post', category: req.body.category || 'Vivid India', excerpt: req.body.excerpt || '', content: req.body.content || '', hashtags: req.body.hashtags || '', created_at: new Date().toISOString() };
  try { await db('INSERT INTO posts (title,slug,excerpt,content,category,status) VALUES (?,?,?,?,?,?)', [post.title, slugify(post.title), post.excerpt, post.content + '\n\n' + post.hashtags, post.category, 'published']); res.json({ success: true, source: 'database', post }); } catch { memoryPosts.unshift(post); res.json({ success: true, source: 'memory', post }); }
});
app.put('/api/posts/:id', requireAdminApi, async (req, res) => {
  const id = Number(req.params.id);
  try { await db('UPDATE posts SET title=?, excerpt=?, content=?, category=? WHERE id=?', [req.body.title || 'Untitled Post', req.body.excerpt || '', (req.body.content || '') + '\n\n' + (req.body.hashtags || ''), req.body.category || 'Vivid India', id]); res.json({ success: true, source: 'database' }); } catch { memoryPosts = memoryPosts.map((post) => post.id === id ? { ...post, ...req.body } : post); res.json({ success: true, source: 'memory' }); }
});
app.delete('/api/posts/:id', requireAdminApi, async (req, res) => { const id = Number(req.params.id); try { await db('DELETE FROM posts WHERE id=?', [id]); res.json({ success: true, source: 'database' }); } catch { memoryPosts = memoryPosts.filter((post) => post.id !== id); res.json({ success: true, source: 'memory' }); } });
app.post('/api/ai/post-assist', requireAdminApi, async (req, res) => {
  const { title = '', content = '', category = 'Vivid India', mode = 'create' } = req.body || {};
  const task = mode === 'modify' ? 'Improve and rewrite this existing author post while preserving the core idea' : 'Create a new author blog post';
  const fallback = { title: title || 'Vivid India: Many Colours, One Soul', excerpt: 'A warm visual story about India’s states, landscapes, art and united cultural spirit.', category, content: `${title || 'Vivid India'}\n\nIndia is a living canvas. From Himalayan silence to Rajasthan’s golden desert, from Bengal’s rivers to Kerala’s rain-green backwaters, every state carries a different mood and memory.\n\n${content || 'Write about people, places, colours, festivals and the idea that India is vivid but united.'}\n\nEvery region adds one brushstroke to the same national canvas.`, tags: ['india','vivid india','culture','states','artist','author'], hashtags: ['#VividIndia','#OneIndia','#IndianArt','#IndianStories','#Blog'] };
  if (!process.env.OPENAI_API_KEY) return res.json({ success: true, source: 'fallback', suggestion: fallback });
  try { const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages: [{ role: 'system', content: 'Return only valid JSON with title, excerpt, category, content, tags array, hashtags array.' }, { role: 'user', content: `${task} for YE MERA INDIA. Title:${title}. Category:${category}. Content:${content}` }], temperature: .7 }) }); const data = await response.json(); const text = data?.choices?.[0]?.message?.content || '{}'; res.json({ success: true, source: 'openai', suggestion: JSON.parse(text.replace(/```json|```/g, '').trim()) }); } catch { res.json({ success: true, source: 'fallback', suggestion: fallback }); }
});

app.get('/', (req, res) => res.type('html').send(page('YE MERA INDIA', `<section class="wrap hero"><div><span class="badge">Author + Artist Website</span><h1>Vivid India, <span class="gold">one canvas.</span></h1><p class="lead">A premium website for an author and artist to publish blogs, visual stories and AI-assisted posts about India, its states, people, colours, festivals and unity.</p><a class="btn" href="/posts">Read Posts</a><a class="btn btn2" href="/studio">Open Dashboard</a></div><div class="art"><div class="circle"><span>ONE<br>INDIA</span></div></div></section><div class="ribbon">Many states • many colours • one India • author stories • artist vision • vivid culture</div><section class="wrap"><span class="badge">Vivid States</span><h2>Different environments of India</h2><div class="grid"><div class="card"><h3>🏔️ Himalaya</h3><p>Mountains, valleys and spiritual quiet.</p></div><div class="card"><h3>🏜️ Rajasthan</h3><p>Desert, forts, textile art and folk colour.</p></div><div class="card"><h3>🌊 River Plains</h3><p>Ghats, farms, cities and living history.</p></div><div class="card"><h3>🌿 Kerala</h3><p>Backwaters, rain and green landscapes.</p></div><div class="card"><h3>🎨 Bengal</h3><p>Books, art, festivals and river life.</p></div><div class="card"><h3>🌅 Tamil Nadu</h3><p>Temples, coast and classical art.</p></div></div></section>`)));
app.get('/login', (req, res) => res.type('html').send(page('Admin Login', `<section class="wrap"><div class="card" style="max-width:520px;margin:auto"><span class="badge">Admin Login</span><h1>Dashboard Access</h1><p>Login to create and modify posts using Post AI for content and Studio AI for related media.</p><input id="email" type="email" placeholder="Admin email"><input id="password" type="password" placeholder="Password"><button onclick="login()">Sign In</button><p id="msg" class="small"></p></div></section><script>async function login(){msg.textContent='Checking...';let r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email.value,password:password.value})});let d=await r.json();if(d.success){location.href='/studio'}else{msg.className='error';msg.textContent=d.message||'Login failed'}}</script>`)));
app.get('/posts', (req, res) => res.type('html').send(page('Posts', `<section class="wrap"><span class="badge">Blog</span><h1>Posts & Stories</h1><div id="posts" class="grid"></div></section><script>fetch('/api/posts').then(function(r){return r.json()}).then(function(d){posts.innerHTML=(d.posts||[]).map(function(p){return '<article class="card"><span class="badge">'+(p.category||'India')+'</span><h3>'+p.title+'</h3><p>'+p.excerpt+'</p><p class="small">'+new Date(p.created_at).toLocaleDateString()+'</p></article>'}).join('')||'<p>No posts yet.</p>'})</script>`)));
app.get('/studio', requireAdminPage, (req, res) => res.type('html').send(page('Dashboard', `<section class="wrap"><span class="badge">Protected Author Dashboard</span><h1>Post Creation & Modification Studio</h1><p class="lead">This is one merged post workflow. <b>Post AI</b> creates or improves the post content. <b>Studio AI</b> edits the related media/photo for that same post.</p><div class="workflow"><div class="step"><b>Step 1: Select or create post</b><br><span class="small">Choose existing post or start new.</span></div><div class="step"><b>Step 2: Post AI + Studio AI</b><br><span class="small">Generate text and prepare media before saving.</span></div></div><div class="two" style="margin-top:24px"><div class="card manager"><h2>Post Manager</h2><button onclick="newPost()">New Post</button><button class="ghost" onclick="loadPosts()">Refresh</button><div id="postList"></div></div><div><div class="card"><h2>Create / Modify Current Post</h2><input id="postId" type="hidden"><input id="title" placeholder="Post title"><input id="category" value="Vivid India" placeholder="Category"><textarea id="idea" placeholder="Instruction for Post AI, example: write about Rajasthan colours and Indian unity"></textarea><button onclick="postAi('create')">Post AI Create Content</button><button class="ghost" onclick="postAi('modify')">Post AI Modify Content</button><input id="excerpt" placeholder="Excerpt"><textarea id="content" placeholder="Full post content"></textarea><input id="hashtags" placeholder="#VividIndia #OneIndia"><div class="card" style="margin-top:16px"><h3>Studio AI: Related Post Media</h3><p class="small">Edit the photo/media for this same post before publishing or updating.</p><input type="file" id="photo" accept="image/*"><button onclick="mediaPreset('vivid')">AI Vivid India</button><button onclick="mediaPreset('heritage')">AI Heritage Warm</button><button onclick="mediaPreset('monsoon')">AI Monsoon Green</button><button onclick="mediaPreset('desert')">AI Desert Gold</button><button class="ghost" onclick="mediaPreset('reset')">Reset Media</button><label>Brightness</label><input type="range" id="b" min="0.4" max="2" step="0.1" value="1"><label>Contrast</label><input type="range" id="c" min="0.4" max="2" step="0.1" value="1"><label>Saturation</label><input type="range" id="s" min="0" max="2.5" step="0.1" value="1"><label>Warmth / Sepia</label><input type="range" id="sep" min="0" max="0.8" step="0.1" value="0"><label>Hue</label><input type="range" id="hue" min="-40" max="40" step="5" value="0"><img id="preview" class="preview"><button onclick="downloadImg()">Download Edited Post Media</button></div><button onclick="savePost()">Save / Update Post</button><button class="danger" onclick="deleteCurrent()">Delete Current</button><p id="msg" class="small"></p></div></div></div></section><script>
const qs=function(x){return document.getElementById(x)};let allPosts=[];function safe(v){return String(v||'').replace(/[&<>]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[m]})}
async function loadPosts(){postList.innerHTML='<p class="small">Loading...</p>';let r=await fetch('/api/admin/posts');let d=await r.json();allPosts=d.posts||[];postList.innerHTML=allPosts.map(function(p){return '<div class="postitem"><h4>'+safe(p.title)+'</h4><p class="small">'+safe(p.category)+' · '+new Date(p.created_at).toLocaleDateString()+'</p><button onclick="editPost('+p.id+')">Use for Modification</button><button class="ghost" onclick="quickModify('+p.id+')">Post AI Modify</button><button class="danger" onclick="deletePost('+p.id+')">Delete</button></div>'}).join('')||'<p>No posts yet.</p>'}
function newPost(){postId.value='';title.value='';category.value='Vivid India';idea.value='';excerpt.value='';content.value='';hashtags.value='';msg.textContent='New post selected. Use Post AI for content and Studio AI for media.'}
function editPost(id){let p=allPosts.find(function(x){return Number(x.id)===Number(id)});if(!p)return;postId.value=p.id;title.value=p.title||'';category.value=p.category||'Vivid India';excerpt.value=p.excerpt||'';content.value=(p.content||'').replace(/\n\n#.*$/s,'');hashtags.value=((p.content||'').match(/#\w+/g)||[]).join(' ');idea.value='';msg.textContent='Existing post loaded. Modify content with Post AI and media with Studio AI.';window.scrollTo({top:0,behavior:'smooth'})}
async function quickModify(id){editPost(id);await postAi('modify')}
async function postAi(mode){msg.className='small';msg.textContent=mode==='modify'?'Post AI is modifying current post content...':'Post AI is creating post content...';let r=await fetch('/api/ai/post-assist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:mode,title:title.value,category:category.value,content:(content.value||idea.value)})});let d=await r.json();if(!d.success){msg.className='error';msg.textContent=d.message;return}let x=d.suggestion||{};title.value=x.title||title.value;category.value=x.category||category.value;excerpt.value=x.excerpt||'';content.value=x.content||'';hashtags.value=(x.hashtags||[]).join(' ');msg.className='success';msg.textContent=(mode==='modify'?'Post content modified.':'Post content created.')+' Now use Studio AI for related media and save.'}
async function savePost(){let id=postId.value;let body={title:title.value,category:category.value,excerpt:excerpt.value,content:content.value,hashtags:hashtags.value};let r=await fetch(id?'/api/posts/'+id:'/api/posts',{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});let d=await r.json();if(!d.success){msg.className='error';msg.textContent=d.message;return}msg.className='success';msg.textContent=(id?'Post updated using ':'Post saved using ')+d.source;await loadPosts();if(!id)newPost()}
async function deleteCurrent(){if(!postId.value)return alert('Select a post first');await deletePost(postId.value);newPost()}
async function deletePost(id){if(!confirm('Delete this post?'))return;let r=await fetch('/api/posts/'+id,{method:'DELETE'});let d=await r.json();msg.className=d.success?'success':'error';msg.textContent=d.success?'Post deleted.':(d.message||'Delete failed');await loadPosts()}
function applyMedia(){preview.style.setProperty('--b',b.value);preview.style.setProperty('--c',c.value);preview.style.setProperty('--s',s.value);preview.style.setProperty('--sep',sep.value);preview.style.setProperty('--hue',hue.value+'deg')}
['b','c','s','sep','hue'].forEach(function(id){qs(id).oninput=applyMedia});photo.onchange=function(e){let f=e.target.files[0];if(f){preview.src=URL.createObjectURL(f);applyMedia()}};
function mediaPreset(name){let values={reset:[1,1,1,0,0],vivid:[1.15,1.25,1.6,0.1,0],heritage:[1.08,1.15,1.2,0.45,8],monsoon:[1.05,1.2,1.55,0,-12],desert:[1.18,1.25,1.35,0.35,12]}[name];b.value=values[0];c.value=values[1];s.value=values[2];sep.value=values[3];hue.value=values[4];applyMedia();msg.className='success';msg.textContent='Studio AI media preset applied for current post.'}
function downloadImg(){if(!preview.src)return alert('Upload image first');let a=document.createElement('a');a.href=preview.src;a.download='yehmeraindia-current-post-media.png';a.click()}loadPosts();
</script>`)));
app.get(/.*/, (req, res) => res.redirect('/'));
app.listen(port, '0.0.0.0', () => console.log('YE MERA INDIA running on 0.0.0.0:' + port));
