import { useMemo, useState } from 'react';
import { ImagePlus, Plus, Send, Trash2 } from 'lucide-react';
import type { MediaItem, SwipePost } from '../data';

const key = 'ymi_swipe_posts';
const blank = { url: '', type: 'image' as const, alt: '' };

export function loadPosts(): SwipePost[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') as SwipePost[]; } catch { return []; }
}

export function savePost(post: SwipePost) {
  const posts = [post, ...loadPosts()];
  localStorage.setItem(key, JSON.stringify(posts));
  window.dispatchEvent(new Event('ymi-posts-updated'));
}

export function MediaPostComposer({ adminMode = false }: { adminMode?: boolean }) {
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState('india, news');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [media, setMedia] = useState<MediaItem[]>([{ ...blank }]);
  const preview = useMemo(() => media.filter((item) => item.url.trim()), [media]);
  const canSubmit = caption.trim().length >= 3 && preview.length > 0;

  const submit = () => {
    if (!canSubmit) return;
    savePost({ id: crypto.randomUUID(), author: adminMode ? 'Admin Desk' : 'Author Desk', caption, location, status, tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean), media: preview, createdAt: new Date().toISOString() });
    setCaption(''); setLocation(''); setMedia([{ ...blank }]);
  };

  return <section className="card p-5">
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4"><label className="text-xs uppercase tracking-widest text-saffron">Caption</label><textarea className="input min-h-32" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write post caption like Instagram..." />
        <div className="grid gap-4 md:grid-cols-2"><input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location"/><input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags comma separated"/></div>
        <div className="flex flex-wrap gap-3"><select className="input max-w-40" value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}><option value="draft">Draft</option><option value="published">Publish</option></select><button className="btn" onClick={() => setMedia((rows) => [...rows, { ...blank }])}><Plus className="mr-2 inline h-4 w-4"/>Add Swipe Media</button><button className="btn btn-primary" disabled={!canSubmit} onClick={submit}><Send className="mr-2 inline h-4 w-4"/>{status === 'published' ? 'Publish Post' : 'Save Draft'}</button></div>
      </div>
      <div className="border border-[#333] bg-black p-4"><div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-saffron"><ImagePlus className="h-4 w-4"/>Swipe Preview</div><div className="flex snap-x gap-3 overflow-x-auto pb-3">{preview.length ? preview.map((item, index) => <div key={`${item.url}-${index}`} className="min-w-[220px] snap-start overflow-hidden border border-[#333]">{item.type === 'video' ? <video src={item.url} className="h-72 w-full object-cover" controls/> : <img src={item.url} alt={item.alt || `media ${index + 1}`} className="h-72 w-full object-cover grayscale transition hover:grayscale-0"/>}<div className="p-3 text-xs uppercase tracking-widest text-saffron">Slide {index + 1}</div></div>) : <div className="flex h-72 min-w-[220px] items-center justify-center border border-dashed border-[#333] text-center text-sm text-parchment/50">Add image/video URLs</div>}</div></div>
    </div>
    <div className="mt-6 space-y-3">{media.map((item, index) => <div key={index} className="grid gap-3 md:grid-cols-[1fr_130px_1fr_44px]"><input className="input" value={item.url} onChange={(e) => setMedia((rows) => rows.map((row, i) => i === index ? { ...row, url: e.target.value } : row))} placeholder="Media URL"/><select className="input" value={item.type} onChange={(e) => setMedia((rows) => rows.map((row, i) => i === index ? { ...row, type: e.target.value as 'image' | 'video' } : row))}><option value="image">Image</option><option value="video">Video</option></select><input className="input" value={item.alt} onChange={(e) => setMedia((rows) => rows.map((row, i) => i === index ? { ...row, alt: e.target.value } : row))} placeholder="Alt text"/><button className="btn" onClick={() => setMedia((rows) => rows.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4"/></button></div>)}</div>
  </section>;
}
