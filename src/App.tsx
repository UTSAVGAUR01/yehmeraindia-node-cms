import { FormEvent, ReactElement, useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Bot, BookOpen, Home, LogOut, PenLine, Shield, UserRound } from 'lucide-react';
import { ArticleCard, AskQuestionPanel, BotPanel, PostGrid, QuestionCard } from './components';
import { articles, questions } from './data';
import { apiRequest, clearSession, getStoredUser, saveSession, type SessionUser } from './api';

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  status: 'draft' | 'published';
  author_name: string;
  created_at: string;
};

type AuthResponse = { success: boolean; token: string; user: SessionUser };
type PostsResponse = { success: boolean; posts: BlogPost[] };
type StatsResponse = { success: boolean; stats: { users: number; posts: number; published: number; drafts: number } };

type PostForm = {
  title: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  status: 'draft' | 'published';
  tags: string;
  hashtags: string;
};

type AiSuggestionResponse = {
  success: boolean;
  source: string;
  suggestion: {
    title?: string;
    excerpt?: string;
    category?: string;
    content?: string;
    tags?: string[];
    hashtags?: string[];
  };
};

const emptyPostForm: PostForm = {
  title: '',
  excerpt: '',
  content: '',
  cover_image: '',
  category: 'Culture',
  status: 'published',
  tags: '',
  hashtags: ''
};

function useAuth() {
  const [user, setUser] = useState<SessionUser | null>(() => getStoredUser());

  useEffect(() => {
    const refresh = () => setUser(getStoredUser());
    window.addEventListener('ymi-auth-updated', refresh);
    return () => window.removeEventListener('ymi-auth-updated', refresh);
  }, []);

  return user;
}

function buildContentWithTags(content: string, tags: string, hashtags: string) {
  const tagLine = tags.trim() ? `\n\nTags: ${tags.trim()}` : '';
  const hashLine = hashtags.trim() ? `\nHashtags: ${hashtags.trim()}` : '';
  return `${content}${tagLine}${hashLine}`.trim();
}

function AiWritingAssistant({ form, onApply }: { form: PostForm; onApply: (updates: Partial<PostForm>) => void }) {
  const [tone, setTone] = useState('professional Indian editorial');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function generate() {
    setLoading(true);
    setMessage('');
    try {
      const data = await apiRequest<AiSuggestionResponse>('/ai/post-assist', {
        method: 'POST',
        body: JSON.stringify({ title: form.title, content: form.content || form.excerpt, category: form.category, tone })
      });
      const suggestion = data.suggestion || {};
      onApply({
        title: suggestion.title || form.title,
        excerpt: suggestion.excerpt || form.excerpt,
        content: suggestion.content || form.content,
        category: suggestion.category || form.category,
        tags: Array.isArray(suggestion.tags) ? suggestion.tags.join(', ') : form.tags,
        hashtags: Array.isArray(suggestion.hashtags) ? suggestion.hashtags.join(' ') : form.hashtags
      });
      setMessage(data.source === 'fallback' ? 'AI key is not configured. Local smart suggestion applied.' : 'AI suggestion applied. Review once before publishing.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'AI help failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card p-6">
      <div className="flex items-center gap-3">
        <Bot className="h-6 w-6 text-marigold" />
        <div>
          <h2 className="font-display text-4xl">AI Writing Assistant</h2>
          <p className="text-sm text-parchment/60">Generate post draft, excerpt, category, tags, and hashtags automatically.</p>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        <input className="input" value={tone} onChange={(event) => setTone(event.target.value)} placeholder="Tone, example: simple Hindi-English friendly" />
        <button type="button" className="btn btn-primary w-full" onClick={generate} disabled={loading}>{loading ? 'Generating...' : 'AI Help Me Write'}</button>
        {message ? <p className="text-sm text-marigold">{message}</p> : null}
      </div>
    </section>
  );
}

function Navigation() {
  const user = useAuth();
  const navigate = useNavigate();

  function logout() {
    clearSession();
    navigate('/login');
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-orange-900/35 bg-[#190c07]/90 px-5 py-4 shadow-2xl backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5">
        <Link to="/" className="font-display text-2xl tracking-wider">YE MERA <span className="text-marigold">INDIA</span></Link>
        <div className="hidden items-center gap-5 text-xs font-black uppercase tracking-widest md:flex">
          <Link to="/" className="hover:text-marigold">Home</Link>
          <Link to="/posts" className="hover:text-marigold">Posts</Link>
          <Link to="/discuss" className="hover:text-marigold">Discuss</Link>
          <Link to="/ai-news" className="hover:text-marigold">AI News Bot</Link>
          <Link to="/author" className="hover:text-marigold">Author</Link>
          {!user ? <Link to="/login" className="btn btn-primary py-2">Sign In</Link> : <><Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="hover:text-marigold">Dashboard</Link><button type="button" onClick={logout} className="text-parchment/70 hover:text-marigold"><LogOut className="inline h-4 w-4" /></button></>}
        </div>
      </div>
    </nav>
  );
}

function HomePage() {
  return (
    <main>
      <section className="relative min-h-screen overflow-hidden px-5 pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(251,191,36,0.34),transparent_27%),radial-gradient(circle_at_20%_75%,rgba(159,18,57,0.42),transparent_30%),linear-gradient(135deg,#1E1B4B,#431407_52%,#111827)]" />
        <div className="absolute inset-0 opacity-20 [background-image:repeating-linear-gradient(45deg,transparent_0,transparent_20px,rgba(255,247,237,0.12)_21px,transparent_22px)]" />
        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <span className="badge">Author Blog Platform</span>
            <h1 className="mt-6 font-display text-7xl leading-none md:text-8xl lg:text-9xl">Stories with an <span className="text-marigold">Indian Soul</span></h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-parchment/80">A beautiful author website for articles, opinions, cultural notes, visual posts, and reader interaction with secure admin and user dashboards.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link to="/posts" className="btn btn-primary"><BookOpen className="mr-2 inline h-4 w-4" />Read Blog</Link><Link to="/signup" className="btn"><PenLine className="mr-2 inline h-4 w-4" />Join Readers</Link><Link to="/login" className="btn"><UserRound className="mr-2 inline h-4 w-4" />Sign In</Link></div>
          </div>
          <div className="grid gap-4">{[['Admin Studio', 'Create, publish, draft, and manage author posts from a protected dashboard.'], ['Reader Dashboard', 'Users can sign in and access a personal dashboard after login only.'], ['AI Post Helper', 'Use AI to write better posts and auto-adjust tags and hashtags.']].map(([title, text]) => <div className="card p-6 shadow-festive" key={title}><h2 className="font-display text-3xl text-marigold">{title}</h2><p className="mt-2 text-parchment/70">{text}</p></div>)}</div>
        </div>
      </section>
      <section className="border-y border-orange-900/30 bg-parchment px-5 py-16 text-stone-950"><div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-4">{[['Blog', 'Long-form author posts'], ['Readers', 'Signup and login'], ['Admin', 'Secure publishing'], ['AI', 'Writing assistant']].map(([title, text]) => <div key={title}><h3 className="font-display text-4xl">{title}</h3><p className="mt-2 text-sm font-bold uppercase tracking-widest">{text}</p></div>)}</div></section>
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-20 lg:grid-cols-2"><div><h2 className="font-display text-5xl">Reader Discussions</h2><div className="mt-8 grid gap-4">{questions.slice(0, 2).map((question) => <QuestionCard key={question.id} question={question} />)}</div></div><div><h2 className="font-display text-5xl">Editorial Articles</h2><div className="mt-8 grid gap-4">{articles.slice(0, 2).map((article) => <ArticleCard key={article.id} article={article} />)}</div></div></section>
    </main>
  );
}

function PostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { apiRequest<PostsResponse>('/posts').then((data) => setPosts(data.posts)).catch(() => setPosts([])).finally(() => setLoading(false)); }, []);
  return <main className="mx-auto max-w-7xl px-5 py-32"><span className="badge">Author Posts</span><h1 className="mt-4 font-display text-6xl">Blog & Stories</h1><p className="mt-4 max-w-3xl text-parchment/70">Read published articles from the author desk. New posts created by admin will appear here automatically.</p>{loading ? <p className="mt-8 text-parchment/60">Loading posts...</p> : null}<div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <article className="card overflow-hidden" key={post.id}>{post.cover_image ? <img src={post.cover_image} alt={post.title} className="h-56 w-full object-cover" /> : null}<div className="p-6"><span className="badge">{post.category}</span><h2 className="mt-4 font-display text-3xl">{post.title}</h2><p className="mt-3 text-parchment/70">{post.excerpt}</p><p className="mt-5 text-xs font-black uppercase tracking-widest text-marigold">By {post.author_name || 'Author'}</p></div></article>)}</div>{!loading && posts.length === 0 ? <p className="mt-8 text-parchment/60">No published posts yet.</p> : null}</main>;
}

function DiscussPage() { return <main className="mx-auto max-w-7xl px-5 py-32"><div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"><AskQuestionPanel /><section><span className="badge">Reader discussion</span><h1 className="mt-4 font-display text-6xl">Ask, Answer, Explain</h1><div className="mt-8 grid gap-4">{questions.map((question) => <QuestionCard key={question.id} question={question} />)}</div></section></div></main>; }
function AiNewsPage() { return <main className="mx-auto max-w-5xl px-5 py-32"><span className="badge">AI latest-news assistant</span><h1 className="mt-4 font-display text-6xl">Ask the News Bot</h1><p className="mt-4 text-parchment/70">Use this interface for summaries, timelines, and explainers.</p><div className="mt-8"><BotPanel /></div></main>; }

function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); setLoading(true); try { const payload = mode === 'signup' ? { name, email, password } : { email, password }; const data = await apiRequest<AuthResponse>(`/auth/${mode === 'signup' ? 'signup' : 'signin'}`, { method: 'POST', body: JSON.stringify(payload) }); saveSession(data.token, data.user); navigate(data.user.role === 'admin' ? '/admin' : '/dashboard'); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to continue'); } finally { setLoading(false); } }
  return <main className="flex min-h-screen items-center justify-center px-5 pt-20"><section className="card w-full max-w-md p-8"><span className="badge">{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</span><h1 className="mt-4 font-display text-5xl">YE MERA <span className="text-marigold">INDIA</span></h1><p className="mt-4 text-parchment/70">{mode === 'signup' ? 'Signup to access your reader dashboard.' : 'Signin to open your dashboard.'}</p><form className="mt-6 space-y-4" onSubmit={submit}>{mode === 'signup' ? <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" /> : null}<input className="input" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" /><input className="input" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />{error ? <p className="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-100">{error}</p> : null}<button className="btn btn-primary w-full" disabled={loading}>{loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}</button></form><p className="mt-5 text-sm text-parchment/60">{mode === 'signup' ? 'Already registered?' : 'New reader?'} <Link className="text-marigold" to={mode === 'signup' ? '/login' : '/signup'}>{mode === 'signup' ? 'Sign in' : 'Create account'}</Link></p></section></main>;
}

function ProtectedRoute({ children, adminOnly = false }: { children: ReactElement; adminOnly?: boolean }) { const user = useAuth(); if (!user) return <Navigate to="/login" replace />; if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />; return children; }

function UserDashboard() {
  const user = useAuth();
  const [form, setForm] = useState<PostForm>({ ...emptyPostForm, status: 'draft', category: 'Reader Voice' });
  const [message, setMessage] = useState('');
  async function submitPost(event: FormEvent) { event.preventDefault(); setMessage(''); await apiRequest('/posts', { method: 'POST', body: JSON.stringify({ title: form.title, content: buildContentWithTags(form.content, form.tags, form.hashtags), excerpt: form.excerpt || form.content.slice(0, 140), category: form.category }) }); setForm({ ...emptyPostForm, status: 'draft', category: 'Reader Voice' }); setMessage('Post saved as draft. Admin can review and publish it.'); }
  return <main className="mx-auto max-w-7xl px-5 py-32"><span className="badge">User Dashboard</span><h1 className="mt-4 font-display text-6xl">Namaste, {user?.name}</h1><div className="mt-8 grid gap-6 md:grid-cols-3">{['Saved Reads', 'Draft Posts', 'Reader Points'].map((item, index) => <div className="card p-6" key={item}><div className="font-display text-5xl text-marigold">{index === 0 ? 0 : index === 1 ? 1 : 10}</div><p className="text-xs font-black uppercase tracking-widest text-parchment/60">{item}</p></div>)}</div><div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"><AiWritingAssistant form={form} onApply={(updates) => setForm((current) => ({ ...current, ...updates }))} /><form onSubmit={submitPost} className="card p-6"><h2 className="font-display text-4xl">Submit Your Thought</h2><p className="mt-2 text-parchment/60">Use AI help, then submit as draft for admin review.</p><div className="mt-5 space-y-4"><input className="input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Post title" /><input className="input" value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} placeholder="Short excerpt" /><input className="input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Category" /><textarea className="input min-h-40" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="Write your article idea..." /><input className="input" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="Auto tags, example: india, culture, opinion" /><input className="input" value={form.hashtags} onChange={(event) => setForm({ ...form, hashtags: event.target.value })} placeholder="Auto hashtags, example: #India #Culture" />{message ? <p className="text-sm text-marigold">{message}</p> : null}<button className="btn btn-primary">Save Draft</button></div></form></div></main>;
}

function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, posts: 0, published: 0, drafts: 0 });
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [form, setForm] = useState<PostForm>(emptyPostForm);
  const [message, setMessage] = useState('');
  function loadAdminData() { apiRequest<StatsResponse>('/admin/stats').then((data) => setStats(data.stats)).catch(() => undefined); apiRequest<PostsResponse>('/posts/admin/all').then((data) => setPosts(data.posts)).catch(() => undefined); }
  useEffect(() => loadAdminData(), []);
  async function publish(event: FormEvent) { event.preventDefault(); setMessage(''); await apiRequest('/posts', { method: 'POST', body: JSON.stringify({ ...form, content: buildContentWithTags(form.content, form.tags, form.hashtags) }) }); setForm(emptyPostForm); setMessage('Post saved successfully.'); loadAdminData(); }
  return <main className="mx-auto max-w-7xl px-5 py-32"><span className="badge"><Shield className="mr-2 h-4 w-4" />Admin Console</span><h1 className="mt-4 font-display text-6xl">Admin Dashboard</h1><div className="mt-8 grid gap-4 md:grid-cols-4">{[['Users', stats.users], ['Posts', stats.posts], ['Published', stats.published], ['Drafts', stats.drafts]].map(([label, value]) => <div className="card p-5" key={label}><div className="font-display text-4xl text-marigold">{value}</div><p className="text-xs font-black uppercase tracking-widest text-parchment/60">{label}</p></div>)}</div><div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"><div className="space-y-6"><AiWritingAssistant form={form} onApply={(updates) => setForm((current) => ({ ...current, ...updates }))} /><section className="card p-6"><h2 className="font-display text-4xl">All Posts</h2><div className="mt-5 grid gap-3">{posts.map((post) => <article className="border border-orange-900/30 p-4" key={post.id}><div className="flex items-center justify-between gap-4"><h3 className="font-display text-2xl">{post.title}</h3><span className="badge">{post.status}</span></div><p className="mt-2 text-sm text-parchment/60">{post.category} · {post.author_name || 'Author'}</p></article>)}</div></section></div><form className="card p-6" onSubmit={publish}><h2 className="font-display text-4xl">Create Blog Post</h2><div className="mt-5 space-y-4"><input className="input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Title" /><input className="input" value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} placeholder="Short excerpt" /><input className="input" value={form.cover_image} onChange={(event) => setForm({ ...form, cover_image: event.target.value })} placeholder="Cover image URL" /><input className="input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Category" /><select className="input" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as PostForm['status'] })}><option value="published">Published</option><option value="draft">Draft</option></select><textarea className="input min-h-44" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="Full post content" /><input className="input" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="Auto tags, example: india, culture, author" /><input className="input" value={form.hashtags} onChange={(event) => setForm({ ...form, hashtags: event.target.value })} placeholder="Auto hashtags, example: #India #Blog" />{message ? <p className="text-sm text-marigold">{message}</p> : null}<button className="btn btn-primary">Save Post</button></div></form></div></main>;
}

function AuthorProfile() { return <main className="mx-auto max-w-7xl px-5 py-32"><section className="card p-8"><div className="flex items-center gap-4"><div className="flex h-20 w-20 items-center justify-center rounded-full border border-marigold bg-marigold text-black"><UserRound /></div><div><h1 className="font-display text-5xl">YE MERA INDIA Author</h1><p className="text-parchment/60">Articles, reflections, reader notes, and visual stories in one place.</p></div></div></section><div className="mt-8"><PostGrid /></div></main>; }
function NotFoundPage() { return <main className="flex min-h-screen flex-col items-center justify-center px-5 text-center"><Home className="h-10 w-10 text-marigold" /><h1 className="mt-5 font-display text-7xl">404</h1><p className="mt-3 text-parchment/70">Page not found.</p><Link to="/" className="btn btn-primary mt-8">Back Home</Link></main>; }

export default function App() { return <><Navigation /><Routes><Route path="/" element={<HomePage />} /><Route path="/discuss" element={<DiscussPage />} /><Route path="/posts" element={<PostsPage />} /><Route path="/ai-news" element={<AiNewsPage />} /><Route path="/author" element={<AuthorProfile />} /><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/signup" element={<AuthPage mode="signup" />} /><Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} /><Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} /><Route path="*" element={<NotFoundPage />} /></Routes></>; }
