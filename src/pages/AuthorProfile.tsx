import { PostDirectory } from '../components/PostDirectory';

export function AuthorProfile() {
  return <main className="mx-auto max-w-6xl px-6 py-32"><section className="card p-6"><p className="text-xs uppercase tracking-[0.5em] text-saffron">Author Profile</p><h1 className="mt-3 font-display text-6xl">Post <span className="text-saffron">Directory</span></h1><p className="mt-3 max-w-2xl text-parchment/70">Swipe media posts, visual explainers, field notes, and short newsroom updates appear here in an Instagram-style grid.</p></section><div className="mt-8"><PostDirectory /></div></main>;
}
