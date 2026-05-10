import { useParams, Link, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import {
  ChevronRight,
  Twitter,
  Facebook,
  Link2,
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Share2,
  MessageCircle,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { demoNews, categoryColors } from '@/data/demoNews'
import type { NewsItem } from '@/data/demoNews'
import { toast } from 'sonner'

/* ─── Generate full article content from excerpt ─── */
function generateArticleContent(item: NewsItem): string {
  const paragraphs = item.excerpt.split('. ').filter(Boolean)
  const intro = paragraphs.slice(0, 2).join('. ') + (paragraphs.length > 2 ? '.' : '')
  const body = paragraphs.slice(2, 5).join('. ') + (paragraphs.length > 5 ? '.' : '')
  const conclusion = paragraphs.slice(5).join('. ') + (paragraphs.length > 8 ? '.' : '')

  const additionalContext = [
    `This development has been closely watched by experts and citizens alike, as it could have far-reaching implications for India's trajectory in the ${item.category.toLowerCase()} sector. Analysts suggest that this move demonstrates India's growing confidence on the global stage.`,
    `The ${item.source} report highlights that this is one of the most significant announcements in recent months, drawing comparisons with similar initiatives in other leading nations. Experts have praised the systematic approach and the comprehensive framework put in place.`,
    `Government officials have indicated that more follow-up measures are expected in the coming weeks, with detailed guidelines to be released shortly. Stakeholders from across the spectrum have welcomed this development, calling it a step in the right direction for the nation.`,
    `Citizens have taken to social media to express their views, with the hashtag related to this news trending across platforms. The overwhelming response suggests a deep public interest in matters of national progress and development.`,
  ]

  return `${intro}

${body || additionalContext[0]}

${additionalContext[1]}

${conclusion || additionalContext[2]}

${additionalContext[3]}`
}

/* ─── Share handler ─── */
function useShare(item: NewsItem | null) {
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/article/${item?.id || ''}` : ''
  const shareText = item ? `${item.title} via Yeh Mera India` : 'Check out this article on Yeh Mera India'

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank')
  }

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')
  }

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank')
  }

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('Link copied to clipboard!')
    }).catch(() => {
      toast.error('Failed to copy link')
    })
  }

  return { shareToTwitter, shareToFacebook, shareToWhatsApp, copyLink }
}

/* ─── Hero image generator based on category ─── */
function getHeroImage(item: NewsItem): string {
  const categoryImageMap: Record<string, string> = {
    Science: '/category-science.jpg',
    Business: '/category-business.jpg',
    Sports: '/category-sports.jpg',
    Technology: '/category-tech.jpg',
    Entertainment: '/category-entertainment.jpg',
    Politics: '/category-politics.jpg',
    Health: '/category-health.jpg',
    World: '/category-world.jpg',
  }
  return categoryImageMap[item.category] || '/category-science.jpg'
}

/* ─── Author generator ─── */
function getAuthor(item: NewsItem): string {
  const authorMap: Record<string, string> = {
    Science: 'Dr. Arvind Sharma',
    Business: 'Priya Narang',
    Sports: 'Rahul Mehta',
    Technology: 'Ananya Gupta',
    Entertainment: 'Kavita Reddy',
    Politics: 'Sanjay Mishra',
    Health: 'Dr. Neha Kapoor',
    World: 'Vikram Joshi',
  }
  return authorMap[item.category] || 'YMI Editorial Team'
}

/* ─── Related articles ─── */
function getRelatedArticles(currentId: string, category: string): NewsItem[] {
  return demoNews
    .filter((n) => n.id !== currentId && n.category === category)
    .slice(0, 3)
}

/* ─── Animation helpers ─── */
const easeSmooth = [0.4, 0, 0.2, 1] as [number, number, number, number]

/* ─── Main Article Page ─── */
export default function Article() {
  const { id } = useParams<{ id: string }>()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const article = demoNews.find((n) => n.id === id) || demoNews[0]
  const fullContent = generateArticleContent(article)
  const authorName = getAuthor(article)
  const heroImage = getHeroImage(article)
  const catColor = categoryColors[article.category as keyof typeof categoryColors] || '#FF9933'
  const related = getRelatedArticles(article.id, article.category)

  const { shareToTwitter, shareToFacebook, shareToWhatsApp, copyLink } = useShare(article)

  return (
    <div className="min-h-[100dvh] bg-cream">
      {/* ── Breadcrumb ── */}
      <div className="bg-cream-dark border-b border-gold/20">
        <div className="max-w-container mx-auto px-6 lg:px-12 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link
              to="/"
              className="font-body text-charcoal-light hover:text-saffron transition-colors duration-200"
            >
              {t('Home', 'होम')}
            </Link>
            <ChevronRight size={14} className="text-charcoal-light/50" />
            <Link
              to="/categories"
              className="font-body text-charcoal-light hover:text-saffron transition-colors duration-200"
            >
              {t(article.category, article.category)}
            </Link>
            <ChevronRight size={14} className="text-charcoal-light/50" />
            <span className="font-body text-saffron font-medium truncate max-w-[200px] sm:max-w-[400px]">
              {article.title}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-container mx-auto px-6 lg:px-12 py-8 lg:py-12">
        {/* ── Back Button ── */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 font-body text-sm text-charcoal-light hover:text-saffron transition-colors duration-200 mb-6 cursor-pointer"
        >
          <ArrowLeft size={16} />
          {t('Back to News', 'खबरों पर वापस')}
        </motion.button>

        {/* ── Hero Image ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeSmooth }}
          className="relative w-full max-h-[400px] rounded-2xl overflow-hidden shadow-warm mb-8"
        >
          <img
            src={heroImage}
            alt={article.title}
            className="w-full h-[300px] lg:h-[400px] object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }}
          />
          {/* Category badge on image */}
          <div className="absolute bottom-4 left-4">
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white shadow-warm"
              style={{ backgroundColor: catColor }}
            >
              {article.category}
            </span>
          </div>
        </motion.div>

        {/* ── Article Title ── */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: easeSmooth }}
          className="font-display font-bold text-3xl lg:text-4xl text-indigo mb-6 text-left leading-tight text-balance"
        >
          {article.title}
        </motion.h1>

        {/* ── Meta Row ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: easeSmooth }}
          className="flex flex-wrap items-center gap-4 lg:gap-6 mb-8 pb-6 border-b border-gold/20"
        >
          {/* Author */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-saffron/10 flex items-center justify-center">
              <User size={14} className="text-saffron" />
            </div>
            <span className="font-body text-sm text-charcoal">{authorName}</span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-charcoal-light">
            <Calendar size={14} />
            <span className="font-body text-sm">{article.timestamp}</span>
          </div>

          {/* Read time */}
          <div className="flex items-center gap-2 text-charcoal-light">
            <Clock size={14} />
            <span className="font-body text-sm">{article.readTime}</span>
          </div>

          {/* Source */}
          <div className="flex items-center gap-2 text-charcoal-light">
            <Share2 size={14} />
            <span className="font-body text-sm">{article.source}</span>
          </div>
        </motion.div>

        {/* ── Share Buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: easeSmooth }}
          className="flex flex-wrap items-center gap-3 mb-8"
        >
          <span className="font-body text-sm text-charcoal-light mr-1">
            {t('Share:', 'शेयर:')}
          </span>
          <button
            onClick={shareToTwitter}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 transition-colors duration-200 text-sm font-medium cursor-pointer"
          >
            <Twitter size={14} />
            Twitter
          </button>
          <button
            onClick={shareToFacebook}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 transition-colors duration-200 text-sm font-medium cursor-pointer"
          >
            <Facebook size={14} />
            Facebook
          </button>
          <button
            onClick={shareToWhatsApp}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors duration-200 text-sm font-medium cursor-pointer"
          >
            <MessageCircle size={14} />
            WhatsApp
          </button>
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-saffron/10 text-saffron hover:bg-saffron/20 transition-colors duration-200 text-sm font-medium cursor-pointer"
          >
            <Link2 size={14} />
            {t('Copy Link', 'लिंक कॉपी करें')}
          </button>
        </motion.div>

        {/* ── Article Content ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: easeSmooth }}
          className="max-w-[720px] mb-12"
        >
          {fullContent.split('\n\n').map((paragraph, i) => (
            <p
              key={i}
              className="font-body text-base text-charcoal leading-relaxed mb-5"
            >
              {paragraph}
            </p>
          ))}

          {/* Article tags */}
          <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-gold/20">
            <span className="font-body text-sm text-charcoal-light">{t('Tags:', 'टैग:')}</span>
            {[article.category, 'India', 'News', 'Positive'].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-white border border-gold/20 text-xs font-body text-charcoal-light hover:border-saffron/40 hover:text-saffron transition-colors duration-200 cursor-pointer"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* ── Related Articles ── */}
        {related.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: easeSmooth }}
            className="mt-12 pt-10 border-t border-gold/20"
          >
            <h2 className="font-heading font-bold text-2xl text-indigo mb-6">
              {t('Related Articles', 'संबंधित लेख')}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((rel, i) => {
                const relCatColor = categoryColors[rel.category as keyof typeof categoryColors] || '#FF9933'
                const relImage = getHeroImage(rel)
                return (
                  <motion.div
                    key={rel.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + i * 0.1, ease: easeSmooth }}
                  >
                    <Link
                      to={`/article/${rel.id}`}
                      className="group block bg-white rounded-xl border border-gold/15 overflow-hidden shadow-warm hover:shadow-warm-lg transition-all duration-300 cursor-pointer hover:scale-[1.02]"
                    >
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={relImage}
                          alt={rel.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute top-3 left-3">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                            style={{ backgroundColor: relCatColor }}
                          >
                            {rel.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-heading font-semibold text-sm text-indigo leading-snug group-hover:text-saffron transition-colors duration-200 line-clamp-2">
                          {rel.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-2 text-xs text-charcoal-light">
                          <span>{rel.source}</span>
                          <span>&middot;</span>
                          <span>{rel.readTime}</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ── Back to News Button ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <Link
            to="/categories"
            className="inline-flex items-center gap-2 bg-saffron text-white font-body font-semibold rounded-full px-8 py-3.5 transition-all duration-250 hover:bg-saffron-light hover:scale-[1.03] shadow-warm hover:shadow-warm-lg"
          >
            <ArrowLeft size={16} />
            {t('Back to News', 'खबरों पर वापस')}
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
