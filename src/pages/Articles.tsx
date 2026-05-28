import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { fallbackArticles } from '../data';

export function Articles() {
  return <main className="mx-auto max-w-7xl px-6 py-32"><h1 className="font-display text-6xl">All <span className="text-saffron">Stories</span></h1><div className="mt-8 grid gap-6 md:grid-cols-3">{fallbackArticles.map((article) => <Link to={`/article/${article.slug}`} key={article.slug} className="card p-5"><p className="text-xs uppercase tracking-widest text-saffron">{article.category}</p><h2 className="mt-3 font-display text-3xl">{article.title}</h2><p className="mt-3 text-parchment/70">{article.excerpt}</p><p className="mt-5 flex items-center gap-2 text-xs uppercase tracking-widest text-parchment/50"><Eye className="h-4 w-4"/>{article.views} views</p></Link>)}</div></main>;
}
