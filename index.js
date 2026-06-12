import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';

const app = express();
const port = Number(process.env.PORT || 3000);

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'YE MERA INDIA API is running' });
});

app.get('/', (req, res) => {
  res.type('html').send(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>YE MERA INDIA</title>
<style>
body{margin:0;background:#080302;color:#fff7ed;font-family:Arial,sans-serif}a{text-decoration:none;color:inherit}.nav{display:flex;justify-content:space-between;align-items:center;padding:20px 7%;background:#170805;border-bottom:1px solid #7c2d12}.brand{font:900 32px Georgia;letter-spacing:.08em}.gold{color:#fbbf24}.links{display:flex;gap:24px;font-size:12px;font-weight:900;letter-spacing:.15em;text-transform:uppercase}.wrap{max-width:1180px;margin:auto;padding:75px 24px}.hero{min-height:82vh;display:grid;grid-template-columns:1fr 1fr;gap:45px;align-items:center;background:radial-gradient(circle at 82% 20%,#0ea5e955,transparent 30%),radial-gradient(circle at 12% 22%,#ff6a0055,transparent 32%)}h1{font:900 82px/.95 Georgia;margin:18px 0}h2{font:900 46px Georgia}h3{font:900 28px Georgia}.lead,p{color:#d8c9bb;line-height:1.75;font-size:18px}.badge{display:inline-block;border:1px solid #fbbf2470;color:#fbbf24;padding:9px 12px;font-size:11px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.btn{display:inline-block;background:linear-gradient(135deg,#ff6a00,#fbbf24);color:#170805;padding:14px 20px;margin:8px 8px 8px 0;font-weight:900;text-transform:uppercase;letter-spacing:.1em}.btn2{background:transparent;color:#fff7ed;border:1px solid #fbbf2470}.art{min-height:520px;border:1px solid #fbbf2438;position:relative;background:linear-gradient(145deg,#fff7ed12,#ff6a0010);overflow:hidden}.sun{position:absolute;right:55px;top:45px;width:120px;height:120px;border-radius:50%;background:#fbbf24;box-shadow:0 0 60px #fbbf2490}.circle{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);width:220px;height:220px;border-radius:50%;background:conic-gradient(#ff6a00,#fbbf24,#22c55e,#38bdf8,#fb7185,#ff6a00);display:grid;place-items:center}.circle span{width:185px;height:185px;background:#100503;border-radius:50%;display:grid;place-items:center;text-align:center;font:900 42px Georgia}.chip{position:absolute;background:#090403d9;border:1px solid #ffffff35;padding:14px;width:160px}.c1{left:30px;top:50px}.c2{left:60px;bottom:70px}.c3{right:40px;top:210px}.c4{right:80px;bottom:55px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.card{background:linear-gradient(145deg,#fff7ed12,#ff6a000b);border:1px solid #fbbf2430;padding:25px}.ribbon{padding:20px;background:linear-gradient(90deg,#ff6a00,#fff7ed,#22c55e);color:#140604;font:900 28px Georgia;white-space:nowrap;overflow:hidden}footer{border-top:1px solid #fbbf2430;padding:35px 7%;color:#d8c9bb}@media(max-width:900px){.hero,.grid{grid-template-columns:1fr}h1{font-size:52px}.links{display:none}.chip,.sun,.circle{position:relative;left:auto;right:auto;top:auto;bottom:auto;transform:none;margin:15px}.art{min-height:auto;padding:20px}}
</style>
</head>
<body>
<nav class="nav"><a class="brand" href="/">YE MERA <span class="gold">INDIA</span></a><div class="links"><a href="#states">States</a><a href="#features">Features</a><a href="#studio">Studio</a></div></nav>
<section class="wrap hero"><div><span class="badge">Author + Artist Website</span><h1>Vivid India, <span class="gold">one canvas.</span></h1><p class="lead">A simple premium website for an author and artist to publish blogs, visual stories and AI-assisted posts about India, its states, people, colours, festivals and unity.</p><a class="btn" href="#states">Explore States</a><a class="btn btn2" href="#studio">Open Studio</a></div><div class="art"><div class="sun"></div><div class="chip c1"><b>Himalaya</b><br>snow and silence</div><div class="chip c2"><b>Rajasthan</b><br>desert and forts</div><div class="chip c3"><b>Bengal</b><br>art and rivers</div><div class="chip c4"><b>Kerala</b><br>rain and green</div><div class="circle"><span>ONE<br>INDIA</span></div></div></section>
<div class="ribbon">Many states • many colours • one India • author stories • artist vision • vivid culture</div>
<section id="states" class="wrap"><span class="badge">Vivid States</span><h2>Different environments of India</h2><div class="grid"><div class="card"><h3>🏔️ Himalaya</h3><p>Mountains, valleys and spiritual quiet.</p></div><div class="card"><h3>🏜️ Rajasthan</h3><p>Desert, forts, textile art and folk colour.</p></div><div class="card"><h3>🌊 River Plains</h3><p>Ghats, farms, cities and living history.</p></div><div class="card"><h3>🌿 Kerala</h3><p>Backwaters, rain and green landscapes.</p></div><div class="card"><h3>🎨 Bengal</h3><p>Books, art, festivals and river life.</p></div><div class="card"><h3>🌅 Tamil Nadu</h3><p>Temples, coast and classical art.</p></div></div></section>
<section id="features" class="wrap"><span class="badge">Features</span><h2>For author and artist</h2><div class="grid"><div class="card"><h3>Blog Publishing</h3><p>Create posts and stories about vivid India.</p></div><div class="card"><h3>AI Writing Assistant</h3><p>Generate post ideas, titles, tags and hashtags.</p></div><div class="card"><h3>Photo Studio</h3><p>Edit images before adding them to blog posts.</p></div></div></section>
<section id="studio" class="wrap"><span class="badge">Studio</span><h2>Admin studio coming next</h2><p class="lead">The stable homepage is live. Next small commit will add secure post dashboard, AI writing form and browser photo editor without breaking Hostinger runtime.</p></section>
<footer>YE MERA INDIA — vivid states, many voices, one united story.</footer>
</body>
</html>`);
});

app.get(/.*/, (req, res) => res.redirect('/'));

app.listen(port, '0.0.0.0', () => {
  console.log('YE MERA INDIA stable homepage running on 0.0.0.0:' + port);
});
