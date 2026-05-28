import { useEffect, useState } from 'react';
import { Grid3X3, Images } from 'lucide-react';
import { loadPosts } from './MediaPostComposer';
import { samplePosts, type SwipePost } from '../data';

export function PostDirectory({ adminMode = false }: { adminMode?: boolean }) {
  const [posts, setPosts] = useState<SwipePost[]>([]);
  useEffect(() => { const refresh = () => setPosts([...loadPosts(), ...samplePosts]); refresh(); window.addEventListener('ymi-posts-updated', refresh); return () => window.removeEventListener('ymi-posts-updated', refresh); }, []);
  const visible = adminMode ? posts : posts.filter((post) => post.status === 'published' || post.author === 'Author Desk');
  return <section className="card p-5"><div className="mb-6 flex items-center justify-between"><div><h2 className="font-display text-4xl">Posts Directory</h2><p className="text-sm text-parchment/60">Instagram-style grid for swipe media posts.</p></div><Grid3X3 className="h-6 w-6 text-saffron"/></div>{visible.length ? <div className="grid grid-cols-2 gap-1 md:grid-cols-3 lg:grid-cols-4">{visible.map((post) => { const media = post.media[0]; return <article key={post.id} className="group relative aspect-square overflow-hidden border border-[#111] bg-[#111]">{media?.type === 'video' ? <video src={media.url} className="h-full w-full object-cover grayscale transition group-hover:grayscale-0" muted/> : media?.url ? <img src={media.url} alt={media.alt || post.caption} className="h-full w-full object-cover grayscale transition group-hover:grayscale-0"/> : <div className="flex h-full items-center justify-center"><Images className="h-8 w-8 text-parchment/30"/></div>}<div className="absolute inset-0 flex items-end bg-gradient-to-t from-black via-black/20 to-transparent p-3 opacity-0 transition group-hover:opacity-100"><div><p className="line-clamp-2 text-sm">{post.caption}</p><p className="mt-1 text-[10px] uppercase tracking-widest text-saffron">{post.status} · {post.media.length} slide</p></div></div></article>; })}</div> : <div className="border border-dashed border-[#333] p-10 text-center text-parchment/60">No posts found. Create your first swipe post.</div>}</section>;
}
