import { useEffect, useMemo, useState } from 'react';
import { Bot, Eye, ImagePlus, MessageCircle, Plus, Send, Trash2, TrendingUp, Upload, Vote } from 'lucide-react';
import { articles, sampleSwipePosts } from './data';
import { loadSwipePosts, saveSwipePost } from './storage';
import type { Article, BotMessage, MediaItem, Question, SwipePost } from './types';

export function QuestionCard({ question }: { question: Question }) {
  return (
    <article className="card p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="badge">{question.topic}</span>
        <span className="text-xs uppercase tracking-widest text-parchment/45">{question.createdAt}</span>
      </div>
      <h2 className="mt-4 font-display text-3xl">{question.title}</h2>
      <p className="mt-3 text-parchment/70">{question.summary}</p>
      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-black uppercase tracking-widest text-parchment/50">
        <span>By {question.author}</span>
        <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" />{question.answers} answers</span>
        <span className="flex items-center gap-1"><Vote className="h-4 w-4" />{question.upvotes} upvotes</span>
      </div>
    </article>
  );
}

export function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="card p-5">
      <span className="badge">{article.category}</span>
      <h2 className="mt-4 font-display text-3xl">{article.title}</h2>
      <p className="mt-3 text-parchment/70">{article.excerpt}</p>
      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-black uppercase tracking-widest text-parchment/50">
        <span>{article.author}</span>
        <span>{article.readTime}</span>
        <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{article.views}</span>
      </div>
    </article>
  );
}

export function AskQuestionPanel() {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('Democracy');
  return (
    <section className="card h-fit p-5">
      <h2 className="font-display text-4xl">Ask Public Question</h2>
      <p className="mt-2 text-sm text-parchment/60">Quora-style discussion entry for users.</p>
      <div className="mt-5 space-y-4">
        <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What should India discuss today?" />
        <input className="input" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Topic" />
        <textarea className="input min-h-32" placeholder="Add context, facts, or why this matters..." />
        <button className="btn btn-primary w-full"><Send className="mr-2 inline h-4 w-4" />Post Question</button>
      </div>
    </section>
  );
}

const blankMedia: MediaItem = { url: '', type: 'image', alt: '' };

export function ComposerPanel({ author, handle, adminMode = false }: { author: string; handle: string; adminMode?: boolean }) {
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('India');
  const [tags, setTags] = useState('india, news');
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [media, setMedia] = useState<MediaItem[]>([{ ...blankMedia }]);
  const readyMedia = useMemo(() => media.filter((item) => item.url.trim().length > 0), [media]);
  const canSave = caption.trim().length > 2 && readyMedia.length > 0;

  function updateMedia(index: number, value: Partial<MediaItem>): void {
    setMedia((rows) => rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...value } : row)));
  }

  function publish(): void {
    if (!canSave) return;
    const post: SwipePost = {
      id: crypto.randomUUID(),
      author,
      handle,
      caption,
      location,
      status,
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      media: readyMedia,
      createdAt: new Date().toLocaleDateString('en-IN')
    };
    saveSwipePost(post);
    setCaption('');
    setMedia([{ ...blankMedia }]);
  }

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl">Create Swipe Post</h2>
          <p className="text-sm text-parchment/60">{adminMode ? 'Admin can publish platform posts.' : 'Author can create visual explainers.'}</p>
        </div>
        <Upload className="h-7 w-7 text-saffron" />
      </div>
      <div className="mt-5 space-y-4">
        <textarea className="input min-h-28" value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Write Instagram-style caption..." />
        <div className="grid gap-4 md:grid-cols-2">
          <input className="input" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Location" />
          <input className="input" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Tags comma separated" />
        </div>
        <select className="input" value={status} onChange={(event) => setStatus(event.target.value as 'draft' | 'published')}>
          <option value="published">Publish</option>
          <option value="draft">Draft</option>
        </select>
        <div className="space-y-3">
          {media.map((item, index) => (
            <div className="grid gap-3 md:grid-cols-[1fr_120px_1fr_44px]" key={`${index}-${item.type}`}>
              <input className="input" value={item.url} onChange={(event) => updateMedia(index, { url: event.target.value })} placeholder="Image or video URL" />
              <select className="input" value={item.type} onChange={(event) => updateMedia(index, { type: event.target.value as 'image' | 'video' })}>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
              <input className="input" value={item.alt} onChange={(event) => updateMedia(index, { alt: event.target.value })} placeholder="Alt text" />
              <button className="btn" type="button" onClick={() => setMedia((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn" type="button" onClick={() => setMedia((rows) => [...rows, { ...blankMedia }])}><Plus className="mr-2 inline h-4 w-4" />Add Slide</button>
          <button className="btn btn-primary" type="button" disabled={!canSave} onClick={publish}><Send className="mr-2 inline h-4 w-4" />Save Post</button>
        </div>
      </div>
      <div className="mt-6 border border-borderline p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-saffron"><ImagePlus className="h-4 w-4" />Swipe Preview</div>
        <div className="flex snap-x gap-3 overflow-x-auto pb-3">
          {readyMedia.length > 0 ? readyMedia.map((item, index) => (
            <div className="min-w-[220px] snap-start overflow-hidden border border-borderline" key={`${item.url}-${index}`}>
              {item.type === 'video' ? <video src={item.url} className="h-72 w-full object-cover" controls /> : <img src={item.url} alt={item.alt || `Slide ${index + 1}`} className="h-72 w-full object-cover grayscale transition hover:grayscale-0" />}
              <p className="p-3 text-xs font-black uppercase tracking-widest text-saffron">Slide {index + 1}</p>
            </div>
          )) : <div className="flex h-72 min-w-[220px] items-center justify-center border border-dashed border-borderline text-center text-sm text-parchment/50">Add media URL to preview</div>}
        </div>
      </div>
    </section>
  );
}

export function PostGrid({ adminMode = false }: { adminMode?: boolean }) {
  const [savedPosts, setSavedPosts] = useState<SwipePost[]>([]);
  useEffect(() => {
    const refresh = () => setSavedPosts(loadSwipePosts());
    refresh();
    window.addEventListener('ymi-posts-updated', refresh);
    return () => window.removeEventListener('ymi-posts-updated', refresh);
  }, []);
  const posts = [...savedPosts, ...sampleSwipePosts].filter((post) => adminMode || post.status === 'published');
  return (
    <section className="card p-5">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl">Posts Directory</h2>
          <p className="text-sm text-parchment/60">Instagram-style grid with swipe media posts.</p>
        </div>
        <Images className="h-7 w-7 text-saffron" />
      </div>
      <div className="grid grid-cols-2 gap-1 md:grid-cols-3 lg:grid-cols-4">
        {posts.map((post) => {
          const firstMedia = post.media[0];
          return (
            <article className="group relative aspect-square overflow-hidden border border-black bg-surface" key={post.id}>
              {firstMedia.type === 'video' ? <video src={firstMedia.url} className="h-full w-full object-cover grayscale transition group-hover:grayscale-0" muted /> : <img src={firstMedia.url} alt={firstMedia.alt} className="h-full w-full object-cover grayscale transition group-hover:grayscale-0" />}
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black via-black/25 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                <div>
                  <p className="line-clamp-2 text-sm">{post.caption}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-saffron">{post.media.length} slide · {post.handle}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function BotPanel() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<BotMessage[]>([
    {
      id: 'm1',
      role: 'bot',
      text: 'Ask me for latest-news summaries, timelines, neutral explainers, or what users are discussing on YE MERA INDIA.'
    }
  ]);

  function reply(): void {
    const text = input.trim();
    if (!text) return;
    const userMessage: BotMessage = { id: crypto.randomUUID(), role: 'user', text };
    const botMessage: BotMessage = {
      id: crypto.randomUUID(),
      role: 'bot',
      text: `Here is a structured news-assistant response for: "${text}". For production, connect this bot to live RSS/news API, then return: summary, key facts, timeline, source links, and related YE MERA INDIA questions.`
    };
    setMessages((current) => [...current, userMessage, botMessage]);
    setInput('');
  }

  return (
    <section className="card p-5">
      <div className="flex items-center gap-3">
        <Bot className="h-7 w-7 text-saffron" />
        <div>
          <h2 className="font-display text-4xl">AI News Bot</h2>
          <p className="text-sm text-parchment/60">Latest-news interface with production-ready direction.</p>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {messages.map((message) => (
          <div className={`max-w-[85%] border p-4 ${message.role === 'bot' ? 'border-borderline bg-black' : 'ml-auto border-saffron bg-saffron text-black'}`} key={message.id}>
            <p className="text-sm leading-6">{message.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_160px]">
        <input className="input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask: summarize latest India tech news..." />
        <button className="btn btn-primary" type="button" onClick={reply}><TrendingUp className="mr-2 inline h-4 w-4" />Ask Bot</button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {articles.map((article) => <ArticleCard key={article.id} article={article} />)}
      </div>
    </section>
  );
}
