import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight, BookOpen, Bot, CalendarDays, ChevronRight, FilePenLine,
  ImagePlus, LayoutDashboard, LogOut, Menu, PenLine, Plus, Save,
  Sparkles, Theater, Trash2, Upload, X
} from 'lucide-react';
import './styles.css';

const API = import.meta.env.VITE_API_URL || '';
const emptyPost = {
  title: '', slug: '', excerpt: '', content: '', category: 'Journal', status: 'draft',
  coverImage: '', imageAlt: '', featured: false, generateImage: true
};

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, options);
  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || 'Request failed.');
  return data;
}

function go(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function Logo() {
  return <button className="logo" onClick={() => go('/')} aria-label="Yeh Mera India home">Yeh Mera India</button>;
}

function Header({ dark = true }) {
  const [open, setOpen] = useState(false);
  const link = (label, path) => <button onClick={() => { go(path); setOpen(false); }}>{label}</button>;
  return (
    <header className={`header ${dark ? 'header-dark' : ''}`}>
      <Logo />
      <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation"><Menu /></button>
      <nav className={open ? 'nav-open' : ''} aria-label="Main navigation">
        {link('Home', '/')}{link('About', '/#about')}{link('Books & Plays', '/#work')}
        {link('AI Lab', '/#ai')}{link('Journal', '/journal')}{link('Contact', '/#contact')}
      </nav>
    </header>
  );
}

function Cover({ post, className = '' }) {
  return post.coverImage ? (
    <img className={className} src={`${API}${post.coverImage}`} alt={post.imageAlt || post.title} />
  ) : (
    <div className={`cover-fallback ${className}`} aria-label={post.imageAlt || post.title}>
      <span>{post.category}</span><PenLine /><strong>{post.title}</strong>
    </div>
  );
}

function Home() {
  const [posts, setPosts] = useState([]);
  useEffect(() => { request('/api/posts').then(setPosts).catch(() => setPosts([])); }, []);
  const featured = posts.find((post) => post.featured) || posts[0];

  return (
    <main>
      <div className="hero-shell">
        <Header />
        <section className="hero">
          <div className="hero-art" />
          <div className="hero-scrim" />
          <div className="hero-copy reveal">
            <p className="eyebrow">Author <i /> Playwright <i /> AI Explorer</p>
            <h1>Stories rooted in India.<br />Ideas shaped for tomorrow.</h1>
            <p>A home for stories, stagecraft, and experiments at the meeting point of culture and artificial intelligence.</p>
            <div className="hero-actions">
              <button className="button primary" onClick={() => go('/journal')}>Explore the work <ArrowRight size={18} /></button>
              <a className="button secondary" href="#about">Meet the author</a>
            </div>
          </div>
        </section>
        <div className="hero-rail"><span>Books</span><i /><span>Stage</span><i /><span>AI Experiments</span><b>01</b></div>
      </div>

      <section id="about" className="section author-section">
        <div className="section-kicker"><span>01</span> The voice behind the work</div>
        <div className="author-grid">
          <div><p className="eyebrow">Writer · dramatist · curious technologist</p><h2>One creative life, many forms of expression.</h2></div>
          <div><p>This platform presents an Indian author and playwright whose work moves between the written page, the living stage and emerging technology. Yeh Mera India is both a personal archive and an open invitation to think, feel and imagine.</p><a href="#work" className="text-link">Discover the journey <ChevronRight size={18} /></a></div>
        </div>
      </section>

      <section id="work" className="section work-section">
        <div className="section-heading"><div><p className="eyebrow">Selected work</p><h2>Words made to be read, heard and performed.</h2></div><button className="text-link" onClick={() => go('/journal')}>View journal <ArrowRight size={18} /></button></div>
        <div className="work-grid">
          <article className="work-card"><BookOpen /><span>Books & essays</span><h3>Literary work shaped by memory, place and the many voices of India.</h3></article>
          <article className="work-card accent"><Theater /><span>Drama & plays</span><h3>Scripts that come alive through character, conflict and the energy of performance.</h3></article>
          <article className="work-card"><Sparkles /><span>AI experiments</span><h3>Exploring how responsible AI can expand storytelling without replacing its human soul.</h3></article>
        </div>
      </section>

      <section id="ai" className="section ai-section">
        <div><p className="eyebrow">The AI Lab</p><h2>New tools.<br />Human imagination.</h2><p>Experiments with generative art, multilingual storytelling and research tools, always guided by authorship, attribution and respect for culture.</p></div>
        <div className="ai-orbit"><Bot /><span className="orbit one" /><span className="orbit two" /><b>Responsible<br />AI</b></div>
      </section>

      <section className="section journal-preview">
        <div className="section-heading"><div><p className="eyebrow">From the journal</p><h2>Notes from the page, stage and lab.</h2></div><button className="button secondary light" onClick={() => go('/journal')}>All posts</button></div>
        {posts.length ? <div className="post-grid">{posts.slice(0, 3).map((post) => <PostCard post={post} key={post.id} />)}</div> : <div className="empty-public"><PenLine /><h3>The first story is being prepared.</h3><p>Published posts from the admin panel will appear here automatically.</p></div>}
      </section>

      {featured && <section className="featured-story" onClick={() => go(`/journal/${featured.slug}`)}><Cover post={featured} className="featured-cover" /><div><p className="eyebrow">Featured story</p><h2>{featured.title}</h2><p>{featured.excerpt}</p><span>Read story <ArrowRight size={18} /></span></div></section>}

      <footer id="contact"><Logo /><p>Stories, stagecraft and ideas for tomorrow.</p><div><button onClick={() => go('/journal')}>Journal</button><a href="mailto:hello@yehmeraindia.com">hello@yehmeraindia.com</a><button onClick={() => go('/admin')}>Admin</button></div><small>© {new Date().getFullYear()} Yeh Mera India</small></footer>
    </main>
  );
}

function PostCard({ post }) {
  return <article className="post-card" onClick={() => go(`/journal/${post.slug}`)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && go(`/journal/${post.slug}`)}><Cover post={post} /><div><span>{post.category}</span><h3>{post.title}</h3><p>{post.excerpt}</p><small>{new Date(post.publishedAt || post.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</small></div></article>;
}

function Journal() {
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState('All');
  useEffect(() => { request('/api/posts').then(setPosts).catch(() => setPosts([])); }, []);
  const categories = useMemo(() => ['All', ...new Set(posts.map((post) => post.category))], [posts]);
  const visible = category === 'All' ? posts : posts.filter((post) => post.category === category);
  return <main className="paper-page"><Header dark={false} /><section className="journal-head"><p className="eyebrow">Yeh Mera India Journal</p><h1>Ideas from the page, the stage and the future.</h1><div className="filters">{categories.map((item) => <button className={category === item ? 'active' : ''} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div></section><section className="journal-grid">{visible.map((post) => <PostCard post={post} key={post.id} />)}</section><footer><Logo /><p>Stories, stagecraft and ideas for tomorrow.</p><small>© {new Date().getFullYear()} Yeh Mera India</small></footer></main>;
}

function Article({ slug }) {
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { request(`/api/posts/${slug}`).then(setPost).catch((e) => setError(e.message)); }, [slug]);
  if (error) return <main className="paper-page"><Header dark={false} /><div className="not-found"><h1>Story not found</h1><button className="button primary" onClick={() => go('/journal')}>Back to journal</button></div></main>;
  if (!post) return <div className="loading">Opening the manuscript…</div>;
  return <main className="paper-page"><Header dark={false} /><article className="article"><div className="article-head"><p className="eyebrow">{post.category}</p><h1>{post.title}</h1><p>{post.excerpt}</p><span><CalendarDays size={16} /> {new Date(post.publishedAt || post.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div><Cover post={post} className="article-cover" /><div className="article-body">{post.content.split(/\n\n+/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></article><footer><Logo /><button onClick={() => go('/journal')}>Back to Journal</button><small>© {new Date().getFullYear()} Yeh Mera India</small></footer></main>;
}

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event) { event.preventDefault(); setBusy(true); setError(''); try { const data = await request('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }); localStorage.setItem('ymi_admin_token', data.token); onLogin(data.token); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  return <main className="admin-login"><button className="back-home" onClick={() => go('/')}><X /> Close</button><form onSubmit={submit}><Logo /><p className="eyebrow">Private administration</p><h1>Welcome backstage.</h1><label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@yehmeraindia.com" /></label><label>Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>{error && <div className="form-error">{error}</div>}<button className="button primary" disabled={busy}>{busy ? 'Signing in…' : 'Enter admin panel'}</button></form></main>;
}

function Admin() {
  const [token, setToken] = useState(localStorage.getItem('ymi_admin_token'));
  const [posts, setPosts] = useState([]); const [editing, setEditing] = useState(null); const [notice, setNotice] = useState(''); const [error, setError] = useState('');
  const auth = { Authorization: `Bearer ${token}` };
  function load() { if (!token) return; request('/api/admin/posts', { headers: auth }).then(setPosts).catch(() => { localStorage.removeItem('ymi_admin_token'); setToken(null); }); }
  useEffect(load, [token]);
  if (!token) return <AdminLogin onLogin={setToken} />;
  async function remove(post) { if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return; try { await request(`/api/admin/posts/${post.id}`, { method: 'DELETE', headers: auth }); setNotice('Post deleted.'); load(); } catch (e) { setError(e.message); } }
  function logout() { localStorage.removeItem('ymi_admin_token'); setToken(null); }
  return <main className="admin-page"><aside><Logo /><div className="admin-nav active"><LayoutDashboard /> Posts</div><button onClick={() => setEditing({ ...emptyPost })}><Plus /> New post</button><button onClick={() => go('/')}><BookOpen /> View website</button><button className="logout" onClick={logout}><LogOut /> Sign out</button></aside><section className="admin-content"><header><div><p className="eyebrow">Content studio</p><h1>Posts</h1><p>Create, update and publish stories across Yeh Mera India.</p></div><button className="button primary" onClick={() => setEditing({ ...emptyPost })}><Plus /> Create post</button></header>{notice && <div className="notice">{notice}<button onClick={() => setNotice('')}><X /></button></div>}{error && <div className="form-error">{error}</div>}<div className="stats"><div><b>{posts.length}</b><span>Total posts</span></div><div><b>{posts.filter((p) => p.status === 'published').length}</b><span>Published</span></div><div><b>{posts.filter((p) => p.status === 'draft').length}</b><span>Drafts</span></div><div><b>{posts.filter((p) => p.coverImage).length}</b><span>With media</span></div></div><div className="admin-table"><div className="table-head"><span>Story</span><span>Status</span><span>Updated</span><span>Actions</span></div>{posts.map((post) => <div className="table-row" key={post.id}><div><Cover post={post} /><span><b>{post.title}</b><small>{post.category} · /{post.slug}</small></span></div><span className={`status ${post.status}`}>{post.status}</span><span>{new Date(post.updatedAt).toLocaleDateString('en-IN')}</span><div><button title="Edit" onClick={() => setEditing({ ...post, generateImage: false })}><FilePenLine /></button><button title="Delete" onClick={() => remove(post)}><Trash2 /></button></div></div>)}</div></section>{editing && <PostEditor post={editing} token={token} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setNotice('Post saved successfully.'); load(); }} />}</main>;
}

function PostEditor({ post, token, onClose, onSaved }) {
  const [form, setForm] = useState(post); const [busy, setBusy] = useState(false); const [uploading, setUploading] = useState(false); const [error, setError] = useState('');
  const auth = { Authorization: `Bearer ${token}` };
  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  async function uploadImage(file) { if (!file) return; setUploading(true); setError(''); try { const body = new FormData(); body.append('image', file); const data = await request('/api/admin/upload', { method: 'POST', headers: auth, body }); update('coverImage', data.url); } catch (e) { setError(e.message); } finally { setUploading(false); } }
  async function save(event) { event.preventDefault(); setBusy(true); setError(''); try { const isExisting = Boolean(form.id); await request(isExisting ? `/api/admin/posts/${form.id}` : '/api/admin/posts', { method: isExisting ? 'PUT' : 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); onSaved(); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  async function regenerate() { if (!form.id) { update('generateImage', true); return; } setBusy(true); setError(''); try { const updated = await request(`/api/admin/posts/${form.id}/generate-image`, { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: form.excerpt }) }); setForm({ ...updated, generateImage: false }); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  return <div className="editor-overlay"><form className="editor" onSubmit={save}><header><div><p className="eyebrow">{form.id ? 'Modify post' : 'Create post'}</p><h2>{form.id ? form.title || 'Untitled post' : 'New story'}</h2></div><button type="button" onClick={onClose}><X /></button></header><div className="editor-grid"><div className="editor-main"><label>Post title<input required value={form.title} onChange={(e) => update('title', e.target.value)} onBlur={() => !form.slug && update('slug', form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))} /></label><label>URL slug<div className="slug-field"><span>/journal/</span><input required value={form.slug} onChange={(e) => update('slug', e.target.value)} /></div></label><label>Short introduction<textarea rows="3" value={form.excerpt} onChange={(e) => update('excerpt', e.target.value)} /></label><label>Article content<textarea className="content-editor" required rows="14" value={form.content} onChange={(e) => update('content', e.target.value)} placeholder="Write the story here. Use a blank line between paragraphs." /></label></div><aside className="editor-side"><div className="media-box">{form.coverImage ? <><img src={`${API}${form.coverImage}`} alt="Current cover" /><button type="button" className="remove-media" onClick={() => update('coverImage', '')}><X /> Remove</button></> : <div><ImagePlus /><b>No cover image</b><span>Upload one or let AI create it.</span></div>}</div><label className="upload-button"><Upload /> {uploading ? 'Uploading…' : 'Upload image'}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => uploadImage(e.target.files?.[0])} /></label><button type="button" className="ai-button" onClick={regenerate} disabled={busy}><Sparkles /> {form.id ? 'Generate AI cover' : 'Generate AI cover on save'}</button>{!form.coverImage && <label className="checkbox"><input type="checkbox" checked={form.generateImage} onChange={(e) => update('generateImage', e.target.checked)} />Automatically generate if no image</label>}<label>Image description<input value={form.imageAlt} onChange={(e) => update('imageAlt', e.target.value)} placeholder="Describe the image" /></label><label>Category<select value={form.category} onChange={(e) => update('category', e.target.value)}><option>Journal</option><option>Books</option><option>Theatre</option><option>Culture</option><option>AI Lab</option><option>Events</option></select></label><label>Status<select value={form.status} onChange={(e) => update('status', e.target.value)}><option value="draft">Draft</option><option value="published">Published</option></select></label><label className="checkbox"><input type="checkbox" checked={form.featured} onChange={(e) => update('featured', e.target.checked)} />Feature on homepage</label></aside></div>{error && <div className="form-error">{error}</div>}<footer><button type="button" className="button secondary light" onClick={onClose}>Cancel</button><button className="button primary" disabled={busy || uploading}><Save /> {busy ? 'Saving…' : 'Save post'}</button></footer></form></div>;
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => { const handler = () => setPath(window.location.pathname); window.addEventListener('popstate', handler); return () => window.removeEventListener('popstate', handler); }, []);
  if (path === '/admin') return <Admin />;
  if (path.startsWith('/journal/')) return <Article slug={decodeURIComponent(path.split('/')[2])} />;
  if (path === '/journal') return <Journal />;
  return <Home />;
}

createRoot(document.getElementById('root')).render(<App />);

