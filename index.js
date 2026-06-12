import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';

const app = express();
const port = Number(process.env.PORT || 3000);
let pool;
let memoryPosts = [
  { id: 1, title: 'Vivid India, One Canvas', category: 'Vivid India', excerpt: 'A journey through India’s many landscapes, colours, people and one united spirit.', content: 'India is not one colour. It is a living canvas of mountains, deserts, forests, rivers, festivals, languages and stories.', hashtags: '#VividIndia #OneIndia #IndianStories', created_at: new Date().toISOString() }
];

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '8mb' }));

async function db(sql, params = []) {
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) throw new Error('DB env not configured');
  if (!pool) {
    const mysql = await import('mysql2/promise');
    pool = mysql.createPool({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, waitForConnections: true, connectionLimit: 5 });
  }
  const [rows] = await pool.execute(sql, params);
  return rows;
}

function page(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>
  *{box-sizing:border-box}body{margin:0;background:#080302;color:#fff7ed;font-family:Inter,Arial,sans-serif}a{text-decoration:none;color:inherit}.nav{display:flex;justify-content:space-between;align-items:center;padding:20px 7%;background:#170805;border-bottom:1px solid #7c2d12;position:sticky;top:0;z-index:5}.brand{font:900 32px Georgia;letter-spacing:.08em}.gold{color:#fbbf24}.links{display:flex;gap:24px;font-size:12px;font-weight:900;letter-spacing:.15em;text-transform:uppercase}.wrap{max-width:1180px;margin:auto;padding:70px 24px}.hero{min-height:82vh;display:grid;grid-template-columns:1fr 1fr;gap:45px;align-items:center;background:radial-gradient(circle at 82% 20%,#0ea5e955,transparent 30%),radial-gradient(circle at 12% 22%,#ff6a0055,transparent 32%)}h1{font:900 82px/.95 Georgia;margin:18px 0}h2{font:900 46px Georgia;margin:10px 0 24px}h3{font:900 28px Georgia}.lead,p{color:#d8c9bb;line-height:1.75;font-size:18px}.badge{display:inline-block;border:1px solid #fbbf2470;color:#fbbf24;padding:9px 12px;font-size:11px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.btn,button{display:inline-block;border:0;background:linear-gradient(135deg,#ff6a00,#fbbf24);color:#170805;padding:14px 20px;margin:8px 8px 8px 0;font-weight:900;text-transform:uppercase;letter-spacing:.1em;cursor:pointer}.btn2{background:transparent;color:#fff7ed;border:1px solid #fbbf2470}.art{min-height:520px;border:1px solid #fbbf2438;position:relative;background:linear-gradient(145deg,#fff7ed12,#ff6a0010);overflow:hidden}.sun{position:absolute;right:55px;top:45px;width:120px;height:120px;border-radius:50%;background:#fbbf24;box-shadow:0 0 60px #fbbf2490}.circle{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);width:220px;height:220px;border-radius:50%;background:conic-gradient(#ff6a00,#fbbf24,#22c55e,#38bdf8,#fb7185,#ff6a00);display:grid;place-items:center}.circle span{width:185px;height:185px;background:#100503;border-radius:50%;display:grid;place-items:center;text-align:center;font:900 42px Georgia}.chip{position:absolute;background:#090403d9;border:1px solid #ffffff35;padding:14px;width:160px}.c1{left:30px;top:50px}.c2{left:60px;bottom:70px}.c3{right:40px;top:210px}.c4{right:80px;bottom:55px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.two{display:grid;grid-template-columns:1fr 1fr;gap:24px}.card{background:linear-gradient(145deg,#fff7ed12,#ff6a000b);border:1px solid #fbbf2430;padding:25px}.ribbon{padding:20px;background:linear-gradient(90deg,#ff6a00,#fff7ed,#22c55e);color:#140604;font:900 28px Georgia;white-space:nowrap;overflow:hidden}input,textarea,select{width:100%;margin:8px 0;padding:14px;background:#120807;border:1px solid #fbbf2440;color:#fff7ed;font-size:15px}textarea{min-height:150px}.preview{max-width:100%;border:1px solid #fbbf2440;margin-top:12px;filter:brightness(var(--b,1)) contrast(var(--c,1)) saturate(var(--s,1))}.small{font-size:13px;color:#bfae9d}footer{border-top:1px solid #fbbf2430;padding:35px 7%;color:#d8c9bb}@media(max-width:900px){.hero,.grid,.two{grid-template-columns:1fr}h1{font-size:52px}.links{display:none}.chip,.sun,.circle{position:relative;left:auto;right:auto;top:auto;bottom:auto;transform:none;margin:15px}.art{min-height:auto;padding:20px}}
  </style></head><body><nav class="nav"><a class="brand" href="/">YE MERA <span class="gold">INDIA</span></a><div class="links"><a href="/">Home</a><a href="/posts">Posts</a><a href="/studio">Studio</a></div></nav>${body}<footer>YE MERA INDIA — vivid states, many voices, one united story.</footer></body></html>`;
}

app.get('/api/health', (req, res) => res.json({ success: true, message: 'YE MERA INDIA API is running' }));
app.get('/api/health/db', async (req, res) => { try { const rows = await db('SELECT COUNT(*) total FROM users'); res.json({ success: true, database: 'connected', total_users: rows[0].total }); } catch (e) { res.status(200).json({ success: false, database: 'fallback', message: e.message }); } });

app.get('/api/posts', async (req, res) => {
  try {
    const rows = await db('SELECT id,title,category,excerpt,content,created_at FROM posts ORDER BY id DESC LIMIT 50');
    res.json({ success: true, source: 'database', posts: rows });
  } catch {
    res.json({ success: true, source: 'memory', posts: memoryPosts });
  }
});

app.post('/api/posts', async (req, res) => {
  const p = req.body || {};
  const post = { id: Date.now(), title: p.title || 'Untitled Post', category: p.category || 'Vivid India', excerpt: p.excerpt || '', content: p.content || '', hashtags: p.hashtags || '', created_at: new Date().toISOString() };
  try {
    const slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
    await db('INSERT INTO posts (title,slug,excerpt,content,category,status) VALUES (?,?,?,?,?,?)', [post.title, slug, post.excerpt, post.content + '\n\n' + post.hashtags, post.category, 'published']);
    res.json({ success: true, source: 'database', post });
  } catch {
    memoryPosts.unshift(post);
    res.json({ success: true, source: 'memory', post });
  }
});

app.post('/api/ai/post-assist', async (req, res) => {
  const { title = '', content = '', category = 'Vivid India' } = req.body || {};
  const fallback = { title: title || 'Vivid India: Many Colours, One Soul', excerpt: 'A warm visual story about India’s states, landscapes, art and united cultural spirit.', category, content: `${title || 'Vivid India'}\n\nIndia is a living canvas. From Himalayan silence to Rajasthan’s golden desert, from Bengal’s rivers to Kerala’s rain-green backwaters, every state carries a different mood and memory.\n\n${content || 'Write about people, places, colours, festivals and the idea that India is vivid but united.'}\n\nThe story should close with the feeling that every region adds one brushstroke to the same national canvas.`, tags: ['india','vivid india','culture','states','artist','author'], hashtags: ['#VividIndia','#OneIndia','#IndianArt','#IndianStories','#Blog'] };
  if (!process.env.OPENAI_API_KEY) return res.json({ success: true, source: 'fallback', suggestion: fallback });
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages: [{ role: 'system', content: 'Return only valid JSON with title, excerpt, category, content, tags array, hashtags array.' }, { role: 'user', content: `Create an author blog post about vivid India. Title:${title}. Category:${category}. Idea:${content}` }], temperature: .7 }) });
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content || '{}';
    const json = JSON.parse(text.replace(/```json|```/g, '').trim());
    res.json({ success: true, source: 'openai', suggestion: json });
  } catch { res.json({ success: true, source: 'fallback', suggestion: fallback }); }
});

app.get('/', (req, res) => res.type('html').send(page('YE MERA INDIA', `<section class="wrap hero"><div><span class="badge">Author + Artist Website</span><h1>Vivid India, <span class="gold">one canvas.</span></h1><p class="lead">A premium website for an author and artist to publish blogs, visual stories and AI-assisted posts about India, its states, people, colours, festivals and unity.</p><a class="btn" href="/posts">Read Posts</a><a class="btn btn2" href="/studio">Open Studio</a></div><div class="art"><div class="sun"></div><div class="chip c1"><b>Himalaya</b><br>snow and silence</div><div class="chip c2"><b>Rajasthan</b><br>desert and forts</div><div class="chip c3"><b>Bengal</b><br>art and rivers</div><div class="chip c4"><b>Kerala</b><br>rain and green</div><div class="circle"><span>ONE<br>INDIA</span></div></div></section><div class="ribbon">Many states • many colours • one India • author stories • artist vision • vivid culture</div><section class="wrap"><span class="badge">Vivid States</span><h2>Different environments of India</h2><div class="grid"><div class="card"><h3>🏔️ Himalaya</h3><p>Mountains, valleys and spiritual quiet.</p></div><div class="card"><h3>🏜️ Rajasthan</h3><p>Desert, forts, textile art and folk colour.</p></div><div class="card"><h3>🌊 River Plains</h3><p>Ghats, farms, cities and living history.</p></div><div class="card"><h3>🌿 Kerala</h3><p>Backwaters, rain and green landscapes.</p></div><div class="card"><h3>🎨 Bengal</h3><p>Books, art, festivals and river life.</p></div><div class="card"><h3>🌅 Tamil Nadu</h3><p>Temples, coast and classical art.</p></div></div></section>`)));

app.get('/posts', (req, res) => res.type('html').send(page('Posts', `<section class="wrap"><span class="badge">Blog</span><h1>Posts & Stories</h1><div id="posts" class="grid"></div></section><script>fetch('/api/posts').then(r=>r.json()).then(d=>{posts.innerHTML=d.posts.map(p=>'<article class="card"><span class="badge">'+(p.category||'India')+'</span><h3>'+p.title+'</h3><p>'+p.excerpt+'</p><p class="small">'+new Date(p.created_at).toLocaleDateString()+'</p></article>').join('')||'<p>No posts yet.</p>'})</script>`)));

app.get('/studio', (req, res) => res.type('html').send(page('Studio', `<section class="wrap"><span class="badge">Admin Studio</span><h1>Write, edit photo, publish</h1><div class="two"><div class="card"><h2>AI Post Writing</h2><input id="title" placeholder="Post title"><input id="category" value="Vivid India" placeholder="Category"><textarea id="idea" placeholder="Write small idea about India..."></textarea><button onclick="aiWrite()">AI Help Me Write</button><input id="excerpt" placeholder="Excerpt"><textarea id="content" placeholder="Full post content"></textarea><input id="hashtags" placeholder="#VividIndia #OneIndia"><button onclick="savePost()">Publish Post</button><p id="msg" class="small"></p></div><div class="card"><h2>Photo Studio</h2><p class="small">Upload photo, adjust brightness, contrast and colour, then download edited image.</p><input type="file" id="photo" accept="image/*"><label>Brightness</label><input type="range" id="b" min="0.5" max="1.8" step="0.1" value="1"><label>Contrast</label><input type="range" id="c" min="0.5" max="1.8" step="0.1" value="1"><label>Saturation</label><input type="range" id="s" min="0" max="2" step="0.1" value="1"><img id="preview" class="preview"><button onclick="downloadImg()">Download Edited Photo</button></div></div></section><script>
const qs=x=>document.getElementById(x);function apply(){qs('preview').style.setProperty('--b',qs('b').value);qs('preview').style.setProperty('--c',qs('c').value);qs('preview').style.setProperty('--s',qs('s').value)}['b','c','s'].forEach(id=>qs(id).oninput=apply);qs('photo').onchange=e=>{let f=e.target.files[0];if(f){qs('preview').src=URL.createObjectURL(f);apply()}};
async function aiWrite(){msg.textContent='Generating...';let r=await fetch('/api/ai/post-assist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:title.value,category:category.value,content:idea.value})});let d=await r.json();let x=d.suggestion;title.value=x.title||title.value;category.value=x.category||category.value;excerpt.value=x.excerpt||'';content.value=x.content||'';hashtags.value=(x.hashtags||[]).join(' ');msg.textContent='AI suggestion applied.'}
async function savePost(){let r=await fetch('/api/posts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:title.value,category:category.value,excerpt:excerpt.value,content:content.value,hashtags:hashtags.value})});let d=await r.json();msg.textContent='Post saved using '+d.source+'. Open Posts page.'}
function downloadImg(){let img=qs('preview');if(!img.src)return alert('Upload image first');let a=document.createElement('a');a.href=img.src;a.download='yehmeraindia-edited-photo.png';a.click()}
</script>`)));

app.get(/.*/, (req, res) => res.redirect('/'));
app.listen(port, '0.0.0.0', () => console.log('YE MERA INDIA running on 0.0.0.0:' + port));
