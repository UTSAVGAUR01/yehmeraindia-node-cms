import { Link, Route, Routes } from 'react-router-dom';
import { Bot, Home, Images, Newspaper, PenLine, Shield, UserRound } from 'lucide-react';
import { ArticleCard, AskQuestionPanel, BotPanel, ComposerPanel, PostGrid, QuestionCard } from './components';
import { articles, questions } from './data';

function Navigation() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-borderline bg-black/95 px-5 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5">
        <Link to="/" className="font-display text-2xl tracking-wider">
          YE MERA <span className="text-saffron">INDIA</span>
        </Link>
        <div className="hidden items-center gap-5 text-xs font-black uppercase tracking-widest md:flex">
          <Link to="/" className="hover:text-saffron">Home</Link>
          <Link to="/discuss" className="hover:text-saffron">Discuss</Link>
          <Link to="/posts" className="hover:text-saffron">Posts</Link>
          <Link to="/ai-news" className="hover:text-saffron">AI News Bot</Link>
          <Link to="/author" className="hover:text-saffron">Author</Link>
          <Link to="/admin" className="hover:text-saffron">Admin</Link>
        </div>
      </div>
    </nav>
  );
}

function HomePage() {
  return (
    <main>
      <section className="relative min-h-screen overflow-hidden px-5 pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,#FF660066,transparent_32%),linear-gradient(135deg,#121212,#000000_60%)]" />
        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <span className="badge">Social News Platform</span>
            <h1 className="mt-6 font-display text-7xl leading-none md:text-8xl lg:text-9xl">
              YE MERA <span className="text-saffron">INDIA</span>
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-parchment/75">
              A mixed website for India-focused user interaction: Quora-style questions and articles, Instagram-style swipe posts, and an AI bot for latest-news summaries.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/discuss" className="btn btn-primary"><PenLine className="mr-2 inline h-4 w-4" />Ask & Answer</Link>
              <Link to="/posts" className="btn"><Images className="mr-2 inline h-4 w-4" />Explore Posts</Link>
              <Link to="/ai-news" className="btn"><Bot className="mr-2 inline h-4 w-4" />Open AI Bot</Link>
            </div>
          </div>
          <div className="grid gap-4">
            {[
              ['Quora Article Layer', 'Ask public questions, write answer-style explainers, upvote and discuss.'],
              ['Instagram Post Layer', 'Create swipe cards with images/videos for visual news and explainers.'],
              ['AI Latest News Bot', 'Ask for trending topics, summaries, timelines, and explainers.']
            ].map(([title, text]) => (
              <div className="card p-6" key={title}>
                <h2 className="font-display text-3xl text-saffron">{title}</h2>
                <p className="mt-2 text-parchment/70">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="border-y border-borderline bg-parchment px-5 py-16 text-black">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-4">
          {[
            ['Questions', 'Public debate and answers'],
            ['Articles', 'Long-form analysis'],
            ['Swipe Posts', 'Visual explainers'],
            ['AI Bot', 'Latest-news assistant']
          ].map(([title, text]) => (
            <div key={title}>
              <h3 className="font-display text-4xl">{title}</h3>
              <p className="mt-2 text-sm font-bold uppercase tracking-widest">{text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-20 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-5xl">Trending Discussions</h2>
          <div className="mt-8 grid gap-4">{questions.slice(0, 2).map((question) => <QuestionCard key={question.id} question={question} />)}</div>
        </div>
        <div>
          <h2 className="font-display text-5xl">Editorial Articles</h2>
          <div className="mt-8 grid gap-4">{articles.slice(0, 2).map((article) => <ArticleCard key={article.id} article={article} />)}</div>
        </div>
      </section>
    </main>
  );
}

function DiscussPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-32">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <AskQuestionPanel />
        <section>
          <span className="badge">Quora-style discussion</span>
          <h1 className="mt-4 font-display text-6xl">Ask, Answer, Explain</h1>
          <div className="mt-8 grid gap-4">{questions.map((question) => <QuestionCard key={question.id} question={question} />)}</div>
        </section>
      </div>
    </main>
  );
}

function PostsPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-32">
      <span className="badge">Instagram-style feed</span>
      <h1 className="mt-4 font-display text-6xl">Swipe Posts & Visual News</h1>
      <p className="mt-4 max-w-3xl text-parchment/70">Short visual cards for news explainers, culture, technology, policy, and public-interest summaries.</p>
      <div className="mt-10"><PostGrid /></div>
    </main>
  );
}

function AiNewsPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-32">
      <span className="badge">AI latest-news assistant</span>
      <h1 className="mt-4 font-display text-6xl">Ask the News Bot</h1>
      <p className="mt-4 text-parchment/70">Use this interface for trending topics, neutral summaries, timelines, and explainers. Backend can connect to RSS or a news API for real-time results.</p>
      <div className="mt-8"><BotPanel /></div>
    </main>
  );
}

function AuthorDashboard() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-32">
      <span className="badge">Creator Studio</span>
      <h1 className="mt-4 font-display text-6xl">Author Dashboard</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {['Articles', 'Answers', 'Swipe Posts', 'Followers'].map((item) => <div className="card p-5" key={item}><div className="font-display text-4xl">0</div><p className="text-xs font-black uppercase tracking-widest text-saffron">{item}</p></div>)}
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <ComposerPanel author="Author Desk" handle="@author" />
        <PostGrid />
      </div>
    </main>
  );
}

function AdminDashboard() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-32">
      <span className="badge"><Shield className="mr-2 h-4 w-4" />Admin Console</span>
      <h1 className="mt-4 font-display text-6xl">Admin Dashboard</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-5">
        {['Users', 'Questions', 'Articles', 'Posts', 'Reports'].map((item) => <div className="card p-5" key={item}><div className="font-display text-4xl">0</div><p className="text-xs font-black uppercase tracking-widest text-saffron">{item}</p></div>)}
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <ComposerPanel author="YE MERA INDIA Admin" handle="@yemeraindia" adminMode />
        <PostGrid adminMode />
      </div>
    </main>
  );
}

function AuthorProfile() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-32">
      <section className="card p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center border border-saffron bg-saffron text-black"><UserRound /></div>
          <div>
            <h1 className="font-display text-5xl">YE MERA INDIA Creator</h1>
            <p className="text-parchment/60">Articles, answers, and swipe posts in one public profile.</p>
          </div>
        </div>
      </section>
      <div className="mt-8"><PostGrid /></div>
    </main>
  );
}

function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 pt-20">
      <section className="card max-w-md p-8 text-center">
        <h1 className="font-display text-5xl">YE MERA <span className="text-saffron">INDIA</span></h1>
        <p className="mt-4 text-parchment/70">Sign in to ask questions, write answers, publish swipe posts, and use the AI news bot.</p>
        <button className="btn btn-primary mt-8 w-full">Continue</button>
      </section>
    </main>
  );
}

function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <Home className="h-10 w-10 text-saffron" />
      <h1 className="mt-5 font-display text-7xl">404</h1>
      <p className="mt-3 text-parchment/70">Page not found.</p>
      <Link to="/" className="btn btn-primary mt-8">Back Home</Link>
    </main>
  );
}

export default function App() {
  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/discuss" element={<DiscussPage />} />
        <Route path="/posts" element={<PostsPage />} />
        <Route path="/ai-news" element={<AiNewsPage />} />
        <Route path="/author" element={<AuthorDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/author/:id" element={<AuthorProfile />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
