import { useState, useRef } from 'react'
import { Link } from 'react-router'
import { motion, useInView } from 'framer-motion'
import {
  Users,
  FileText,
  ChevronDown,
  Eye,
  ThumbsUp,
  MessageSquare,
  Share2,
  Clock,
  Edit3,
  Trash2,
  Plus,
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

const STAT_CARDS = [
  { labelEn: 'Total Articles', labelHi: 'कुल लेख', value: '47', change: '+12%', icon: FileText, color: 'text-indigo', bg: 'bg-indigo/10' },
  { labelEn: 'Total Views', labelHi: 'कुल व्यूज', value: '128.5K', change: '+8.4%', icon: Eye, color: 'text-saffron', bg: 'bg-saffron/10' },
  { labelEn: 'Avg. Read Time', labelHi: 'औसत पढ़ने का समय', value: '4.2m', change: '+2.1%', icon: Clock, color: 'text-green', bg: 'bg-green/10' },
  { labelEn: 'Followers', labelHi: 'फॉलोअर्स', value: '2,847', change: '+156', icon: Users, color: 'text-terracotta', bg: 'bg-terracotta/10' },
]

const ARTICLES = [
  {
    id: 1,
    title: 'ISRO\'s Gaganyaan: A New Era in Indian Space Exploration',
    titleHi: 'ISRO का गगनयान: भारतीय अंतरिक्ष अन्वेषण में एक नया युग',
    status: 'published',
    category: 'Science',
    views: '45.2K',
    likes: '3,891',
    comments: '234',
    date: 'Dec 15, 2025',
    readTime: '5 min',
    excerpt: 'India\'s ambitious crewed space mission marks a historic milestone in the nation\'s space journey.',
  },
  {
    id: 2,
    title: 'Digital India 2.0: Transforming Rural Connectivity',
    titleHi: 'डिजिटल इंडिया 2.0: ग्रामीण कनेक्टिविटी को बदलना',
    status: 'published',
    category: 'Technology',
    views: '32.1K',
    likes: '2,456',
    comments: '189',
    date: 'Dec 10, 2025',
    readTime: '4 min',
    excerpt: 'How the next phase of Digital India is bringing high-speed internet to 600,000 villages.',
  },
  {
    id: 3,
    title: 'The Green Revolution 2.0: Sustainable Farming in Punjab',
    titleHi: 'ग्रीन रेवोल्यूशन 2.0: पंजाब में सस्टेनेबल फार्मिंग',
    status: 'draft',
    category: 'Agriculture',
    views: '--',
    likes: '--',
    comments: '--',
    date: 'Dec 18, 2025',
    readTime: '6 min',
    excerpt: 'Young farmers are embracing technology and sustainable practices to transform agriculture.',
  },
  {
    id: 4,
    title: 'Khelo India: Uncovering Sporting Talent in Small Towns',
    titleHi: 'खेलो इंडिया: छोटे शहरों में खेल प्रतिभा की खोज',
    status: 'published',
    category: 'Sports',
    views: '28.7K',
    likes: '1,923',
    comments: '145',
    date: 'Dec 5, 2025',
    readTime: '4 min',
    excerpt: 'How the Khelo India initiative is discovering and nurturing athletic talent nationwide.',
  },
]

const CATEGORIES = ['All', 'Science', 'Technology', 'Agriculture', 'Sports', 'Health', 'Business']

/* ──────────────────────────────────────────────
   Main Page
   ────────────────────────────────────────────── */

export default function Author() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'articles' | 'analytics' | 'settings'>('articles')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const statsRef = useRef<HTMLDivElement>(null)
  const articlesRef = useRef<HTMLDivElement>(null)

  const statsInView = useInView(statsRef, { once: true, margin: '-80px' })

  const filteredArticles = ARTICLES.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false
    if (categoryFilter !== 'All' && a.category !== categoryFilter) return false
    return true
  })

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-[#F7F8FA]">
      {/* ─── Header ─── */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeSmooth }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="text-left">
              <span className="font-mono text-xs text-saffron tracking-[0.15em] uppercase">
                {t('Author Dashboard', 'लेखक डैशबोर्ड')}
              </span>
              <h1 className="font-display font-bold heading-lg text-indigo mt-1 text-left">
                {t('My Stories', 'मेरी कहानियाँ')}
              </h1>
              <p className="text-charcoal-light text-sm font-body mt-1 text-left">
                {t(
                  'Manage your articles, track performance, and connect with readers.',
                  'अपने लेख प्रबंधित करें, प्रदर्शन ट्रैक करें, और पाठकों से जुड़ें।'
                )}
              </p>
            </div>
            <Link
              to="#"
              className="inline-flex items-center justify-center gap-2 bg-saffron text-white font-body font-semibold rounded-full px-6 py-3 transition-all duration-250 hover:bg-saffron-light hover:scale-[1.02] shadow-warm self-start"
            >
              <Plus size={16} />
              {t('New Article', 'नया लेख')}
            </Link>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 -mb-px">
            {(['articles', 'analytics', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium font-body capitalize border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-saffron text-saffron'
                    : 'border-transparent text-charcoal-light hover:text-charcoal'
                }`}
              >
                {t(tab, tab)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section ref={statsRef} className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={statsInView ? 'visible' : 'hidden'}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {STAT_CARDS.map((stat) => {
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
                    <span className="font-mono text-xs text-green font-medium">{stat.change}</span>
                  </div>
                  <p className="font-display font-bold text-2xl text-indigo text-left">{stat.value}</p>
                  <p className="text-charcoal-light text-xs font-body mt-0.5 text-left">{t(stat.labelEn, stat.labelHi)}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── Filters ─── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status filters */}
            <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
              {(['all', 'published', 'draft'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-md text-sm font-body capitalize transition-colors ${
                    statusFilter === status
                      ? 'bg-saffron text-white'
                      : 'text-charcoal-light hover:text-charcoal'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Category filter */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-charcoal font-body outline-none focus:border-saffron"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-charcoal-light pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Articles List ─── */}
      <section ref={articlesRef} className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto space-y-4">
          {filteredArticles.map((article, i) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: easeSmooth }}
              className="bg-white rounded-xl border border-gray-200 p-5 transition-all duration-200 hover:shadow-warm hover:border-saffron/20"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      article.status === 'published'
                        ? 'bg-green/10 text-green'
                        : 'bg-gold/10 text-gold'
                    }`}>
                      {article.status}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo/10 text-indigo text-xs font-medium">
                      {article.category}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-indigo text-base leading-snug mb-1.5 text-left">
                    {t(article.title, article.titleHi)}
                  </h3>
                  <p className="text-charcoal-light text-sm font-body leading-relaxed mb-3 text-left line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-charcoal-light font-mono">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {article.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={12} />
                      {article.readTime}
                    </span>
                    {article.status === 'published' && (
                      <>
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          {article.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp size={12} />
                          {article.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={12} />
                          {article.comments}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-charcoal-light hover:text-saffron hover:border-saffron transition-colors">
                    <Edit3 size={14} />
                  </button>
                  <button className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-charcoal-light hover:text-terracotta hover:border-terracotta transition-colors">
                    <Trash2 size={14} />
                  </button>
                  <button className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-charcoal-light hover:text-indigo hover:border-indigo transition-colors">
                    <Share2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredArticles.length === 0 && (
            <div className="text-center py-16">
              <FileText size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-charcoal-light font-body">{t('No articles found', 'कोई लेख नहीं मिला')}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
