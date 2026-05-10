import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  FileText,
  TrendingUp,
  Settings,
  Search,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  BarChart3,
  Clock,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

/* ──────────────────────────────────────────────
   Animation helpers
   ────────────────────────────────────────────── */

const easeSmooth = [0.4, 0, 0.2, 1] as [number, number, number, number]

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeSmooth } },
}

/* ──────────────────────────────────────────────
   Mock Data
   ────────────────────────────────────────────── */

const ADMIN_STATS = [
  { labelEn: 'Total Users', labelHi: 'कुल उपयोगकर्ता', value: '48,592', change: '+12.5%', up: true, icon: Users, color: 'text-indigo', bg: 'bg-indigo/10' },
  { labelEn: 'Total Articles', labelHi: 'कुल लेख', value: '15,847', change: '+8.2%', up: true, icon: FileText, color: 'text-saffron', bg: 'bg-saffron/10' },
  { labelEn: 'Page Views', labelHi: 'पेज व्यूज', value: '2.4M', change: '+23.1%', up: true, icon: TrendingUp, color: 'text-green', bg: 'bg-green/10' },
  { labelEn: 'Avg. Session', labelHi: 'औसत सेशन', value: '6m 42s', change: '-1.3%', up: false, icon: Clock, color: 'text-terracotta', bg: 'bg-terracotta/10' },
]

const RECENT_ARTICLES = [
  { id: 1, title: 'ISRO Successfully Tests Gaganyaan Crew Module', author: 'Rahul Sharma', category: 'Science', status: 'published', views: '52.1K', likes: '4,231', date: 'Dec 20, 2025' },
  { id: 2, title: 'Digital India 2.0: Rural Connectivity Milestone', author: 'Priya Patel', category: 'Technology', status: 'published', views: '38.7K', likes: '2,891', date: 'Dec 19, 2025' },
  { id: 3, title: 'IPL 2025: Playoff Predictions & Analysis', author: 'Amit Kumar', category: 'Sports', status: 'pending', views: '--', likes: '--', date: 'Dec 18, 2025' },
  { id: 4, title: 'Green Revolution 2.0 in Punjab', author: 'Simran Kaur', category: 'Agriculture', status: 'published', views: '29.3K', likes: '1,876', date: 'Dec 17, 2025' },
  { id: 5, title: 'India-UK FTA: What It Means for Business', author: 'Vikram Mehta', category: 'Business', status: 'published', views: '41.2K', likes: '3,102', date: 'Dec 16, 2025' },
]

const TOP_AUTHORS = [
  { name: 'Rahul Sharma', articles: 142, views: '1.2M', followers: '8.5K', trend: '+15%' },
  { name: 'Priya Patel', articles: 98, views: '892K', followers: '6.2K', trend: '+22%' },
  { name: 'Amit Kumar', articles: 87, views: '756K', followers: '5.1K', trend: '+18%' },
  { name: 'Simran Kaur', articles: 64, views: '534K', followers: '3.8K', trend: '+31%' },
  { name: 'Vikram Mehta', articles: 51, views: '421K', followers: '2.9K', trend: '+12%' },
]

const CATEGORY_PERFORMANCE = [
  { name: 'Technology', articles: 4523, views: '856K', engagement: '92%', trend: '+18%' },
  { name: 'Sports', articles: 3891, views: '723K', engagement: '88%', trend: '+25%' },
  { name: 'Politics', articles: 3247, views: '612K', engagement: '85%', trend: '+8%' },
  { name: 'Science', articles: 2104, views: '498K', engagement: '91%', trend: '+14%' },
  { name: 'Business', articles: 2867, views: '534K', engagement: '79%', trend: '+11%' },
]

const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'articles', label: 'Articles', icon: FileText },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
]

/* ──────────────────────────────────────────────
   Main Page
   ────────────────────────────────────────────── */

export default function Admin() {
  const { t } = useLanguage()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'pending' | 'draft'>('all')
  const statsRef = useRef<HTMLDivElement>(null)
  const statsInView = useInView(statsRef, { once: true, margin: '-80px' })

  const filteredArticles = RECENT_ARTICLES.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-[#F1F5F9]">
      <div className="flex">
        {/* ─── Sidebar ─── */}
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-[calc(100dvh-64px)] sticky top-16">
          <div className="p-4">
            <nav className="space-y-1">
              {SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors text-left ${
                      activeSection === item.id
                        ? 'bg-saffron/10 text-saffron'
                        : 'text-charcoal-light hover:bg-gray-50 hover:text-charcoal'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* ─── Main Content ─── */}
        <main className="flex-1 min-w-0">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-left">
                <h1 className="font-display font-bold heading-md text-indigo text-left">
                  {t('Admin Dashboard', 'एडमिन डैशबोर्ड')}
                </h1>
                <p className="text-charcoal-light text-sm font-body mt-0.5 text-left">
                  {t('Overview of your platform performance', 'आपके प्लेटफॉर्म प्रदर्शन का अवलोकन')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-light" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('Search...', 'खोजें...')}
                    className="w-48 bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm text-charcoal placeholder:text-charcoal-light outline-none focus:border-saffron font-body"
                  />
                </div>
                <button className="relative w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-charcoal-light hover:text-saffron hover:border-saffron transition-colors">
                  <Bell size={16} />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-terracotta rounded-full text-white text-[10px] font-medium flex items-center justify-center">3</span>
                </button>
              </div>
            </div>
          </div>

          {/* ─── Stats Cards ─── */}
          <section ref={statsRef} className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate={statsInView ? 'visible' : 'hidden'}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {ADMIN_STATS.map((stat) => {
                  const Icon = stat.icon
                  return (
                    <motion.div
                      key={stat.labelEn}
                      variants={staggerItem}
                      className="bg-white rounded-xl border border-gray-200 p-5 transition-all duration-200 hover:shadow-warm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                          <Icon size={18} className={stat.color} />
                        </div>
                        <span className={`font-mono text-xs font-medium flex items-center gap-0.5 ${stat.up ? 'text-green' : 'text-terracotta'}`}>
                          {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {stat.change}
                        </span>
                      </div>
                      <p className="font-display font-bold text-2xl text-indigo text-left">{stat.value}</p>
                      <p className="text-charcoal-light text-xs font-body mt-0.5 text-left">{t(stat.labelEn, stat.labelHi)}</p>
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>
          </section>

          {/* ─── Articles Table ─── */}
          <section className="px-4 sm:px-6 lg:px-8 pb-4">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Table header */}
                <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h2 className="font-display font-semibold text-indigo text-base text-left">
                    {t('Recent Articles', 'हाल के लेख')}
                  </h2>
                  <div className="flex items-center gap-2">
                    {(['all', 'published', 'pending'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-md text-xs font-body capitalize transition-colors ${
                          statusFilter === status
                            ? 'bg-saffron text-white'
                            : 'text-charcoal-light hover:text-charcoal bg-gray-50'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-5 py-3 text-xs font-medium text-charcoal-light uppercase tracking-wider font-body">
                          {t('Article', 'लेख')}
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-charcoal-light uppercase tracking-wider font-body hidden sm:table-cell">
                          {t('Author', 'लेखक')}
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-charcoal-light uppercase tracking-wider font-body hidden md:table-cell">
                          {t('Category', 'श्रेणी')}
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-charcoal-light uppercase tracking-wider font-body">
                          {t('Status', 'स्थिति')}
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-charcoal-light uppercase tracking-wider font-body hidden lg:table-cell">
                          {t('Views', 'व्यूज')}
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-charcoal-light uppercase tracking-wider font-body hidden lg:table-cell">
                          {t('Date', 'तारीख')}
                        </th>
                        <th className="px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredArticles.map((article) => (
                        <tr
                          key={article.id}
                          className="border-b border-gray-50 last:border-0 hover:bg-cream/50 transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <p className="font-display font-medium text-indigo text-sm text-left line-clamp-1">{article.title}</p>
                          </td>
                          <td className="px-5 py-3.5 hidden sm:table-cell">
                            <span className="text-sm text-charcoal font-body">{article.author}</span>
                          </td>
                          <td className="px-5 py-3.5 hidden md:table-cell">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo/10 text-indigo text-xs font-medium">
                              {article.category}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              article.status === 'published'
                                ? 'bg-green/10 text-green'
                                : article.status === 'pending'
                                ? 'bg-gold/10 text-gold'
                                : 'bg-gray-100 text-charcoal-light'
                            }`}>
                              {article.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 hidden lg:table-cell">
                            <span className="font-mono text-xs text-charcoal-light">{article.views}</span>
                          </td>
                          <td className="px-5 py-3.5 hidden lg:table-cell">
                            <span className="font-mono text-xs text-charcoal-light">{article.date}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <button className="text-charcoal-light hover:text-charcoal transition-colors">
                              <MoreHorizontal size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* ─── Bottom Grid: Top Authors + Category Performance ─── */}
          <section className="px-4 sm:px-6 lg:px-8 pb-8">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6">
              {/* Top Authors */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-display font-semibold text-indigo text-base mb-4 text-left">
                  {t('Top Authors', 'शीर्ष लेखक')}
                </h3>
                <div className="space-y-3">
                  {TOP_AUTHORS.map((author, i) => (
                    <div key={author.name} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <span className="font-mono text-xs text-charcoal-light w-5 text-center">{i + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center font-display font-semibold text-xs text-indigo">
                        {author.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-medium text-sm text-indigo text-left truncate">{author.name}</p>
                        <p className="text-xs text-charcoal-light font-body text-left">{author.articles} {t('articles', 'लेख')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xs text-charcoal">{author.views}</p>
                        <p className="font-mono text-xs text-green">{author.trend}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Performance */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-display font-semibold text-indigo text-base mb-4 text-left">
                  {t('Category Performance', 'श्रेणी प्रदर्शन')}
                </h3>
                <div className="space-y-3">
                  {CATEGORY_PERFORMANCE.map((cat) => (
                    <div key={cat.name} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo/10 text-indigo text-xs font-medium w-24 justify-center shrink-0">
                        {cat.name}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-charcoal-light font-body">{cat.articles} {t('articles', 'लेख')}</span>
                          <span className="font-mono text-xs text-charcoal">{cat.views}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-saffron rounded-full"
                            style={{ width: cat.engagement }}
                          />
                        </div>
                      </div>
                      <span className="font-mono text-xs text-green shrink-0">{cat.trend}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
