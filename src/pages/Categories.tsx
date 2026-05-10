import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Landmark,
  Cpu,
  Trophy,
  Clapperboard,
  Atom,
  TrendingUp,
  HeartPulse,
  Globe,
  Sparkles,
  Gamepad2,
  Search,
  ArrowRight,
  MapPinned,
  Wheat,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/context/LanguageContext'

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface Category {
  nameEn: string
  nameHi: string
  icon: LucideIcon
  image: string
  articles: string
  lastUpdated: string
}

const categories: Category[] = [
  { nameEn: 'Politics', nameHi: 'राजनीति', icon: Landmark, image: '/category-politics.jpg', articles: '5,247', lastUpdated: '5 min ago' },
  { nameEn: 'Technology', nameHi: 'तकनीक', icon: Cpu, image: '/category-tech.jpg', articles: '6,852', lastUpdated: '2 min ago' },
  { nameEn: 'Sports', nameHi: 'खेल', icon: Trophy, image: '/category-sports.jpg', articles: '4,391', lastUpdated: '3 min ago' },
  { nameEn: 'Entertainment', nameHi: 'मनोरंजन', icon: Clapperboard, image: '/category-entertainment.jpg', articles: '3,576', lastUpdated: '8 min ago' },
  { nameEn: 'Science', nameHi: 'विज्ञान', icon: Atom, image: '/category-science.jpg', articles: '2,904', lastUpdated: '10 min ago' },
  { nameEn: 'Business', nameHi: 'व्यापार', icon: TrendingUp, image: '/category-business.jpg', articles: '5,167', lastUpdated: '1 min ago' },
  { nameEn: 'Health', nameHi: 'स्वास्थ्य', icon: HeartPulse, image: '/category-health.jpg', articles: '2,523', lastUpdated: '12 min ago' },
  { nameEn: 'World', nameHi: 'दुनिया', icon: Globe, image: '/category-world.jpg', articles: '3,891', lastUpdated: '4 min ago' },
  { nameEn: 'India', nameHi: 'भारत', icon: MapPinned, image: '/category-politics.jpg', articles: '8,234', lastUpdated: 'Just now' },
  { nameEn: 'States', nameHi: 'राज्य', icon: MapPinned, image: '/category-politics.jpg', articles: '6,118', lastUpdated: '2 min ago' },
  { nameEn: 'Agriculture', nameHi: 'कृषि', icon: Wheat, image: '/category-world.jpg', articles: '2,445', lastUpdated: '15 min ago' },
  { nameEn: 'Lifestyle', nameHi: 'जीवनशैली', icon: Sparkles, image: '/category-tech.jpg', articles: '1,845', lastUpdated: '20 min ago' },
  { nameEn: 'Gaming', nameHi: 'गेमिंग', icon: Gamepad2, image: '/category-sports.jpg', articles: '2,318', lastUpdated: '10 min ago' },
]

const allTopics: string[] = [
  'AI', 'Agriculture', 'Startups', 'Crypto', 'Space', 'Cybersecurity', 'Robotics', 'Biotech',
  'Energy', 'Automobile', 'Education', 'Finance', 'Stock Market', 'Real Estate', 'Fashion',
  'Food', 'Travel', 'Music', 'Bollywood', 'Television', 'Books', 'Fitness', 'Mental Health',
  'Nutrition', 'Parenting', 'Relationships', 'Productivity', 'Design', 'Photography',
  'Architecture', 'Law', 'Immigration', 'Defence', 'Diplomacy', 'Elections', 'Supreme Court',
  'Parliament', 'Economics', 'Employment', 'Business', 'Olympics', 'Cricket', 'Football', 'Hockey',
  'Tennis', 'Badminton', 'Kabaddi', 'Motorsport', 'Swimming', 'Athletics',
]

interface SpotlightArticle {
  title: string
  source: string
  time: string
  image: string
}

const spotlightArticles: SpotlightArticle[] = [
  { title: 'ISRO Successfully Launches Chandrayaan-4 Mission', source: 'DD News', time: '10 min ago', image: '/category-science.jpg' },
  { title: 'Digital India 2.0: New Initiatives Announced', source: 'PIB', time: '25 min ago', image: '/category-tech.jpg' },
  { title: 'India Achieves Record Rice Production This Year', source: 'Kisan Samachar', time: '1h ago', image: '/category-world.jpg' },
]

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */

const easeSmooth = [0.4, 0, 0.2, 1] as [number, number, number, number]
const easeBounce = [0.34, 1.56, 0.64, 1] as [number, number, number, number]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: easeSmooth },
  }),
}

const fadeUpY = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: easeSmooth },
  }),
}

const slideFromLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: easeSmooth },
  },
}

const slideFromRight = {
  hidden: { opacity: 0, x: 30 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, delay, ease: easeSmooth },
  }),
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, delay, ease: easeBounce },
  }),
}

const SAFFRON = '#FF9933'

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Categories() {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const heroRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const spotlightRef = useRef<HTMLDivElement>(null)
  const topicsRef = useRef<HTMLDivElement>(null)

  /* ---- filtering ---- */
  const filteredCategories = categories.filter((cat) =>
    cat.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.nameHi.includes(searchQuery)
  )

  const filteredTopics = searchQuery
    ? allTopics.filter((topic) => topic.toLowerCase().includes(searchQuery.toLowerCase()))
    : allTopics

  /* ---- category click ---- */
  const handleCategoryClick = useCallback(
    (nameEn: string, nameHi: string) => {
      const displayName = t(nameEn, nameHi)
      toast.info(`${displayName} news feed ${t('coming soon!', 'जल्द आ रहा है!')}`, {
        description: t(
          'Category pages will be available in a future update.',
          'Category pages will be available in a future update.'
        ),
      })
    },
    [t]
  )

  /* ---- search focus ---- */
  const searchInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (searchQuery && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchQuery])

  return (
    <div className="min-h-[100dvh] bg-void">
      {/* ============================================================ */}
      {/* SECTION 1 — Page Hero                                         */}
      {/* ============================================================ */}
      <section
        ref={heroRef}
        className="relative flex flex-col items-center justify-center text-center bg-studio-backdrop"
        style={{ minHeight: '320px' }}
      >
        {/* Mobile height override */}
        <style>{`@media(max-width:639px){.hero-section{min-height:240px!important}}`}</style>
        <div className="hero-section w-full flex flex-col items-center justify-center px-6 pt-24 pb-10">
          {/* Eyebrow */}
          <motion.span
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="font-mono text-xs tracking-[0.15em] uppercase"
            style={{ color: SAFFRON }}
          >
            {t('EXPLORE', 'EXPLORE')}
          </motion.span>

          {/* Title */}
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0.15}
            className="font-heading font-extrabold text-hero text-frost mt-3"
          >
            {t('News Categories', 'समाचार श्रेणियाँ')}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0.3}
            className="text-h3 text-steel mt-4 max-w-[520px] mx-auto"
          >
            {t(
              'Browse stories across 50+ topics, from Indian politics to agriculture.',
              'भारतीय राजनीति से लेकर कृषि तक, 50+ विषयों में खबरें ब्राउज़ करें।'
            )}
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, y: 20, scale: 0.95 },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.5, delay: 0.5, ease: easeSmooth },
              },
            }}
            className="mt-8 w-full flex justify-center"
          >
            <div className="relative" style={{ width: 'max(320px, 40%)', maxWidth: '100%' }}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-steel pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('Search categories...', 'श्रेणियाँ खोजें...')}
                className="w-full bg-midnight border border-slate rounded-full pl-11 pr-5 py-3 text-sm text-frost placeholder:text-steel outline-none transition-all duration-250 focus:border-[#FF9933]"
                style={{ '--tw-shadow': '0 0 0 3px rgba(255,153,51,0.15)' } as React.CSSProperties}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 2 — Featured Categories Grid                          */}
      {/* ============================================================ */}
      <section className="py-16 px-6 lg:px-12">
        <div ref={gridRef} className="max-w-container mx-auto">
          <AnimatePresence mode="wait">
            {filteredCategories.length > 0 ? (
              <motion.div
                key={searchQuery}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
              >
                {filteredCategories.map((cat, i) => {
                  const Icon = cat.icon
                  return (
                    <motion.div
                      key={cat.nameEn}
                      custom={i * 0.06}
                      variants={fadeUpY}
                      className="group cursor-pointer"
                      onClick={() => handleCategoryClick(cat.nameEn, cat.nameHi)}
                      whileHover={{ y: -6, transition: { duration: 0.3, ease: easeSmooth } }}
                    >
                      <div className="relative overflow-hidden rounded-2xl border border-slate bg-midnight transition-all duration-300 hover:border-[#FF9933] hover:shadow-[0_12px_40px_rgba(255,153,51,0.12)]">
                        {/* Image */}
                        <div className="relative aspect-video overflow-hidden">
                          <img
                            src={cat.image}
                            alt={t(cat.nameEn, cat.nameHi)}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-midnight/60" />
                        </div>

                        {/* Content */}
                        <div className="p-5">
                          <div className="flex items-center gap-2.5 mb-2">
                            <Icon className="w-5 h-5 transition-transform duration-250 group-hover:scale-110" style={{ color: SAFFRON }} />
                            <h3 className="font-heading font-semibold text-frost text-base">
                              {t(cat.nameEn, cat.nameHi)}
                            </h3>
                          </div>
                          <p className="text-sm text-steel mb-1">
                            {cat.articles} {t('articles', 'लेख')}
                          </p>
                          <p className="text-xs text-steel">
                            {t('Latest update', 'नवीनतम अपडेट')} {cat.lastUpdated}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20"
              >
                <p className="text-steel text-lg">
                  {t('No categories found for', 'कोई श्रेणी नहीं मिली')}&ldquo;{searchQuery}&rdquo;
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-sm transition-colors hover:opacity-80"
                  style={{ color: SAFFRON }}
                >
                  {t('Clear search', 'खोज साफ़ करें')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 3 — Category Spotlight                                */}
      {/* ============================================================ */}
      <section ref={spotlightRef} className="py-24 bg-midnight">
        <div className="max-w-container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-12 lg:gap-16">
            {/* Left — Category Info */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={slideFromLeft}
              className="flex flex-col justify-center"
            >
              <span className="font-mono text-xs tracking-[0.1em] uppercase" style={{ color: '#FF9933' }}>
                {t('CATEGORY SPOTLIGHT', 'CATEGORY SPOTLIGHT')}
              </span>
              <h2 className="font-heading font-bold text-h1 text-frost mt-3">
                {t('Trending in Technology', 'तकनीक में ट्रेंडिंग')}
              </h2>
              <p className="text-body text-steel mt-4">
                {t(
                  "From Indian startups to ISRO's space missions, stay ahead with the latest in tech.",
                  'भारतीय स्टार्टअप्स से लेकर ISRO की अंतरिक्ष यात्रा तक, तकनीक जगत की हर खबर सबसे पहले।'
                )}
              </p>
              <div className="flex items-center gap-3 mt-6 font-mono text-sm text-steel">
                <span>
                  <span style={{ color: SAFFRON }}>6,852</span> {t('articles', 'लेख')}
                </span>
                <span className="text-slate">&middot;</span>
                <span>{t('Updated every 2 minutes', 'हर 2 मिनट में अपडेट')}</span>
              </div>
              <button
                onClick={() => handleCategoryClick('Technology', 'तकनीक')}
                className="mt-6 inline-flex items-center gap-2 font-body font-medium text-sm transition-colors group w-fit hover:opacity-80"
                style={{ color: SAFFRON }}
              >
                {t('Browse Tech News', 'तकनीक की खबरें ब्राउज़ करें')}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>

            {/* Right — Article Stack */}
            <div className="flex flex-col gap-4">
              {spotlightArticles.map((article, i) => (
                <motion.div
                  key={article.title}
                  custom={i * 0.1}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  variants={slideFromRight}
                  className="group cursor-pointer"
                  onClick={() =>
                    toast.info(t('Article reading coming soon!', 'लेख पढ़ना जल्द आ रहा है!'), {
                      description: t(
                        'Full article pages will be available in a future update.',
                        'Full article pages will be available in a future update.'
                      ),
                    })
                  }
                >
                  <div className="flex gap-4 bg-void border border-slate rounded-xl p-5 transition-all duration-300 group-hover:border-[#FF9933] group-hover:translate-x-1">
                    {/* Thumbnail */}
                    <div className="shrink-0">
                      <img
                        src={article.image}
                        alt=""
                        className="w-20 h-20 rounded-lg object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex flex-col justify-center min-w-0">
                      <span
                        className="inline-flex self-start items-center px-2.5 py-0.5 rounded-full border text-xs font-medium mb-2"
                        style={{ color: SAFFRON, borderColor: SAFFRON }}
                      >
                        {t('Technology', 'तकनीक')}
                      </span>
                      <h4 className="font-heading font-semibold text-frost text-sm leading-snug truncate">
                        {article.title}
                      </h4>
                      <p className="text-xs text-steel mt-1">
                        {article.source} &middot; {article.time}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 4 — All Topics Quick List                             */}
      {/* ============================================================ */}
      <section className="py-16 px-6 lg:px-12">
        <div ref={topicsRef} className="max-w-container mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            custom={0}
            className="font-heading font-bold text-h2 text-frost text-center mb-10"
          >
            {t('All Topics', 'सभी विषय')}
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="flex flex-wrap justify-center gap-3"
          >
            <AnimatePresence mode="wait">
              {filteredTopics.map((topic, i) => (
                <motion.button
                  key={topic}
                  custom={i * 0.02}
                  variants={scaleIn}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
                  onClick={() => {
                    toast.info(`${t('Topic', 'विषय')}: ${topic}`, {
                      description: t('Topic-based news feeds coming soon!', 'Topic-based news feeds coming soon!'),
                    })
                  }}
                  className="px-4 py-2 rounded-full border border-slate bg-midnight text-sm text-frost font-body transition-all duration-200 hover:scale-105 cursor-pointer"
                  style={{ '--tw-hover-bg-opacity': 1, '--tw-hover-text-opacity': 1 } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = SAFFRON
                    e.currentTarget.style.color = '#0B0F1A'
                    e.currentTarget.style.borderColor = SAFFRON
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ''
                    e.currentTarget.style.color = ''
                    e.currentTarget.style.borderColor = ''
                  }}
                >
                  {topic}
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredTopics.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-steel mt-8"
            >
              {t('No topics match', 'कोई विषय मेल नहीं खाता')}&ldquo;{searchQuery}&rdquo;
            </motion.p>
          )}
        </div>
      </section>

      {/* Bottom spacer */}
      <div className="h-8" />
    </div>
  )
}
