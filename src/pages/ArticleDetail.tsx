import { useParams } from 'react-router-dom';
import { fallbackArticles } from '../data';

export function ArticleDetail() {
  const { slug } = useParams();
  const article = fallbackArticles.find((item) => item.slug === slug) || fallbackArticles[0];
  return <main className="mx-auto max-w-4xl px-6 py-32"><p className="text-xs uppercase tracking-widest text-saffron">{article.category}</p><h1 className="mt-4 font-display text-6xl">{article.title}</h1><p className="mt-4 text-parchment/60">By {article.author} · {article.views} views</p><article className="mt-10 space-y-6 text-lg leading-8 text-parchment/80"><p>{article.excerpt}</p><h2 className="font-display text-4xl text-parchment">Executive Summary</h2><p>This page is ready for article content rendering, comments, bookmark controls, and share actions.</p></article></main>;
}
