import { Link } from 'react-router-dom';
export function NotFound() { return <main className="flex min-h-screen flex-col items-center justify-center"><h1 className="font-display text-8xl text-saffron">404</h1><p className="mt-4">Page not found.</p><Link className="btn btn-primary mt-8" to="/">Back Home</Link></main>; }
