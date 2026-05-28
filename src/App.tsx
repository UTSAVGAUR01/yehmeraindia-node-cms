import { Link, Route, Routes } from 'react-router-dom';
import { AdminDashboard } from './pages/AdminDashboard';
import { ArticleDetail } from './pages/ArticleDetail';
import { Articles } from './pages/Articles';
import { AuthorDashboard } from './pages/AuthorDashboard';
import { AuthorProfile } from './pages/AuthorProfile';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';
import { UserDashboard } from './pages/UserDashboard';

function Navigation() {
  return <nav className="fixed inset-x-0 top-0 z-50 border-b border-[#333] bg-black/95 px-6 py-4 backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center justify-between">
      <Link to="/" className="font-display text-2xl tracking-wider">YE HMAARI <span className="text-saffron">INDIA</span></Link>
      <div className="flex gap-4 text-xs font-bold uppercase tracking-widest"><Link to="/articles">Articles</Link><Link to="/author">Author</Link><Link to="/admin">Admin</Link><Link to="/dashboard">Dashboard</Link></div>
    </div>
  </nav>;
}

export default function App() {
  return <><Navigation /><Routes><Route path="/" element={<Home />} /><Route path="/articles" element={<Articles />} /><Route path="/article/:slug" element={<ArticleDetail />} /><Route path="/login" element={<Login />} /><Route path="/dashboard" element={<UserDashboard />} /><Route path="/author" element={<AuthorDashboard />} /><Route path="/author/:id" element={<AuthorProfile />} /><Route path="/admin" element={<AdminDashboard />} /><Route path="*" element={<NotFound />} /></Routes></>;
}
