import { useRef } from 'react'
import { Link } from 'react-router'
import { motion, useInView } from 'framer-motion'
import {
  Landmark, Cpu, Trophy, Clapperboard, Atom, TrendingUp,
  HeartPulse, Globe, Sparkles, Gamepad2,
  Volume2, Languages, Gauge, Clock, ArrowRight, Play,
  Newspaper, MapPin, Users
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

/* ─── Animation helpers ─── */

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const fadeUpChild = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return { ref, inView }
}

/* ─── Section 1: Hero ─── */
function HeroSection() {
  const { t } = useLanguage()

  return (
    <section className="relative min-h-[calc(100dvh-64px)] flex items-center overflow-hidden bg-gradient-to-br from-cream via-cream to-[#F5EDE0]">
      {/* Subtle Lahariya pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'url(/pattern-lahariya.png)',
          backgroundSize: '300px',
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Warm radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(232,93,4,0.04) 0%, rgba(255,248,240,0.95) 60%)' }}
      />

      {/* Decorative saffron orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-saffron/[0.06] blur-[120px] animate-orb-drift pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full bg-indigo/[0.04] blur-[120px] animate-orb-drift pointer-events-none" style={{ animationDelay: '-7s' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
        <div className="grid lg:grid-cols-[55%_45%] gap-12 items-center">
          {/* Left column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
            className="text-left"
          >
            {/* Tag */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="inline-flex items-center gap-2 bg-saffron/10 text-saffron px-3 py-1.5 rounded-full mb-6 border border-saffron/20"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-saffron animate-pulse" />
              <span className="font-mono text-xs font-medium tracking-wide">{t('POSITIVE NEWS FOR INDIA', 'भारत के लिए सकारात्मक समाचार')}</span>
            </motion.div>

            {/* Headline */}
            <h1 className="font-display font-bold heading-xl text-indigo mb-4 text-left">
              {t('Stories that', 'कहानियाँ जो')}{' '}
              <span className="font-editorial text-saffron">{t('inspire', 'प्रेरित')}</span>{' '}
              {t('India', 'करती हैं')}
            </h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="font-body text-base text-charcoal-light max-w-[480px] mb-8 text-left leading-relaxed"
            >
              {t(
                'Curated positive news for social workers, youth leaders, government officials, and every proud Indian.',
                'सामाजिक कार्यकर्ताओं, युवा नेताओं, सरकारी अधिकारियों और हर गौरवान्वित भारतीय के लिए सकारात्मक समाचार।'
              )}
            </motion.p>

            {/* CTA Group */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="flex flex-wrap gap-4 mb-10"
            >
              <Link
                to="/anchor"
                className="inline-flex items-center bg-saffron text-white font-body font-semibold rounded-full px-8 py-3.5 transition-all duration-250 hover:bg-saffron-light hover:scale-[1.03] shadow-warm hover:shadow-warm-lg"
              >
                <Play size={16} className="mr-2" fill="currentColor" />
                {t('Watch AI Anchor', 'AI एंकर देखें')}
              </Link>
              <Link
                to="/categories"
                className="inline-flex items-center bg-transparent border-2 border-indigo text-indigo font-body font-semibold rounded-full px-8 py-3.5 transition-all duration-250 hover:bg-indigo hover:text-white"
              >
                {t('Read Stories', 'कहानियाँ पढ़ें')}
              </Link>
            </motion.div>

            {/* Quick stats row */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="flex items-center gap-6"
            >
              {[
                { num: t('500K+', '5 लाख+'), label: t('Readers', 'पाठक') },
                { num: t('50+', '50+'), label: t('Categories', 'श्रेणियाँ') },
                { num: t('28', '२८'), label: t('States', 'राज्य') },
              ].map((stat, i) => (
                <div key={stat.label} className="flex items-center gap-6">
                  <div className="text-left">
                    <span className="font-mono font-semibold text-sm text-saffron">{stat.num}</span>
                    <span className="font-body text-sm text-charcoal-light ml-1.5">{stat.label}</span>
                  </div>
                  {i < 2 && <span className="w-px h-4 bg-gold/40" />}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right column — Anchor Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Saffron decorative border */}
              <div className="absolute -inset-[3px] rounded-[24px] bg-gradient-to-br from-saffron via-saffron-light to-gold opacity-60" />
              <div className="relative z-10 rounded-[20px] overflow-hidden bg-white shadow-warm-lg">
                <img
                  src="/indian-anchor-hero.png"
                  alt="AI News Anchor"
                  className="w-full h-auto object-cover"
                />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white shadow-warm rounded-full px-4 py-2 border border-gold/20">
                <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
                <span className="font-mono text-xs font-medium text-indigo">LIVE 24/7</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ─── Section 2: Featured Categories ─── */
function CategorySection() {
  const { t } = useLanguage()
  const { ref, inView } = useReveal()

  const categoryData = [
    { nameEn: 'Politics', nameHi: 'राजनीति', icon: Landmark, countEn: '2,847 stories', countHi: '2,847 कहानियाँ', color: 'bg-indigo/10 text-indigo' },
    { nameEn: 'Technology', nameHi: 'तकनीक', icon: Cpu, countEn: '4,152 stories', countHi: '4,152 कहानियाँ', color: 'bg-saffron/10 text-saffron' },
    { nameEn: 'Sports', nameHi: 'खेल', icon: Trophy, countEn: '3,091 stories', countHi: '3,091 कहानियाँ', color: 'bg-green/10 text-green' },
    { nameEn: 'Entertainment', nameHi: 'मनोरंजन', icon: Clapperboard, countEn: '1,876 stories', countHi: '1,876 कहानियाँ', color: 'bg-terracotta/10 text-terracotta' },
    { nameEn: 'Science', nameHi: 'विज्ञान', icon: Atom, countEn: '2,304 stories', countHi: '2,304 कहानियाँ', color: 'bg-indigo-light/10 text-indigo-light' },
    { nameEn: 'Business', nameHi: 'व्यापार', icon: TrendingUp, countEn: '3,567 stories', countHi: '3,567 कहानियाँ', color: 'bg-gold/15 text-gold' },
    { nameEn: 'Health', nameHi: 'स्वास्थ्य', icon: HeartPulse, countEn: '1,923 stories', countHi: '1,923 कहानियाँ', color: 'bg-green/10 text-green' },
    { nameEn: 'World', nameHi: 'दुनिया', icon: Globe, countEn: '4,891 stories', countHi: '4,891 कहानियाँ', color: 'bg-indigo/10 text-indigo' },
    { nameEn: 'Lifestyle', nameHi: 'जीवनशैली', icon: Sparkles, countEn: '1,445 stories', countHi: '1,445 कहानियाँ', color: 'bg-saffron/10 text-saffron' },
    { nameEn: 'Gaming', nameHi: 'गेमिंग', icon: Gamepad2, countEn: '2,118 stories', countHi: '2,118 कहानियाँ', color: 'bg-terracotta/10 text-terracotta' },
  ]

  return (
    <section className="section-padding bg-white relative" ref={ref}>
      {/* Subtle bandhej texture */}
      <div className="absolute inset-0 bandhej-texture pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
          className="text-left mb-12"
        >
          <span className="font-mono text-xs text-saffron tracking-[0.15em] uppercase">
            {t('Explore', 'अन्वेषण करें')}
          </span>
          <h2 className="font-display font-bold heading-lg text-indigo mt-2 text-left">
            {t('Featured Categories', 'विशेष श्रेणियाँ')}
          </h2>
          <p className="text-charcoal-light mt-2 max-w-md text-left font-body leading-relaxed">
            {t(
              'Discover stories across topics that matter to every Indian.',
              'हर भारतीय के लिए मायने रखने वाले विषयों पर कहानियाँ खोजें।'
            )}
          </p>
        </motion.div>

        {/* Category grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6"
        >
          {categoryData.map((cat) => {
            const Icon = cat.icon
            return (
              <motion.div
                key={cat.nameEn}
                variants={fadeUpChild}
                whileHover={{ y: -4, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } }}
                className="group flex flex-col items-start text-left gap-3 p-6 rounded-2xl bg-white border border-gold/20 cursor-pointer transition-all duration-250 hover:border-saffron/40 hover:shadow-warm hover:shadow-warm-lg"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.color} transition-transform duration-250 group-hover:scale-110`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-semibold text-indigo text-base text-left">
                  {t(cat.nameEn, cat.nameHi)}
                </h3>
                <p className="text-charcoal-light text-sm text-left">{t(cat.countEn, cat.countHi)}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

/* ─── Section 3: Trending Editorial ─── */
function TrendingSection() {
  const { t } = useLanguage()
  const { ref, inView } = useReveal()

  const trendingTopics = [
    { rank: 1, titleEn: 'ISRO Gaganyaan: First crew drop test completed successfully', titleHi: 'ISRO Gaganyaan: पहली क्रू ड्रॉप टेस्ट सफलतापूर्वक पूरी', sourceEn: 'Navbharat Times', sourceHi: 'नवभारत टाइम्स', timeEn: '2 hours ago', timeHi: '2 घंटे पहले', category: 'Science', categoryColor: 'tag-pill-indigo' },
    { rank: 2, titleEn: 'India-UK FTA agreement signed, 30% trade growth expected', titleHi: 'भारत-UK FTA समझौते पर हस्ताक्षर, व्यापार में 30% वृद्धि की उम्मीद', sourceEn: 'Economic Times', sourceHi: 'इकनॉमिक टाइम्स', timeEn: '4 hours ago', timeHi: '4 घंटे पहले', category: 'Business', categoryColor: 'tag-pill-green' },
    { rank: 3, titleEn: 'IPL 2025 Playoffs: RCB vs CSK qualifier match today', titleHi: 'IPL 2025 Playoffs: RCB vs CSK क्वालीफायर मुकाबला आज', sourceEn: 'SportsKeeda', sourceHi: 'स्पोर्ट्सकीड़ा', timeEn: '5 hours ago', timeHi: '5 घंटे पहले', category: 'Sports', categoryColor: 'tag-pill-saffron' },
  ]

  const wordCloud = [
    { word: 'ISRO', size: 'text-h2', color: 'text-saffron', weight: 'font-extrabold' },
    { word: 'India', size: 'text-xl', color: 'text-indigo', weight: 'font-bold' },
    { word: 'AI', size: 'text-lg', color: 'text-charcoal-light', weight: 'font-semibold' },
    { word: 'Cricket', size: 'text-base', color: 'text-charcoal-light', weight: 'font-medium' },
    { word: 'Election', size: 'text-h3', color: 'text-indigo', weight: 'font-bold' },
    { word: 'Startup', size: 'text-sm', color: 'text-charcoal-light', weight: 'font-medium' },
    { word: 'G20', size: 'text-lg', color: 'text-saffron-light', weight: 'font-semibold' },
    { word: 'Health', size: 'text-base', color: 'text-charcoal-light', weight: 'font-medium' },
    { word: 'Bollywood', size: 'text-xl', color: 'text-indigo', weight: 'font-bold' },
    { word: '5G', size: 'text-sm', color: 'text-charcoal-light', weight: 'font-medium' },
    { word: 'Space', size: 'text-lg', color: 'text-charcoal-light', weight: 'font-semibold' },
    { word: 'Digital', size: 'text-base', color: 'text-saffron', weight: 'font-bold' },
  ]

  return (
    <section className="section-padding bg-cream relative" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10"
        >
          <div className="text-left">
            <span className="font-mono text-xs text-saffron tracking-[0.15em] uppercase">
              {t('Trending', 'ट्रेंडिंग')}
            </span>
            <h2 className="font-display font-bold heading-lg text-indigo mt-2 text-left">
              {t("Trending Now — What's Hot", 'ट्रेंडिंग अभी — What\'s Hot')}
            </h2>
          </div>
          <Link
            to="/trending"
            className="inline-flex items-center gap-1 font-body font-medium text-saffron hover:text-saffron-light transition-colors text-sm"
          >
            {t('View full trending', 'पूरी ट्रेंडिंग देखें')}
            <ArrowRight size={14} />
          </Link>
        </motion.div>

        {/* Content */}
        <div className="grid lg:grid-cols-[60%_40%] gap-8">
          {/* Left — Featured card + side cards */}
          <div className="space-y-4">
            {trendingTopics.map((topic, i) => (
              <motion.div
                key={topic.rank}
                initial={{ opacity: 0, x: -30 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="group flex items-start gap-4 p-5 rounded-xl bg-white border border-gold/15 cursor-pointer transition-all duration-300 hover:border-saffron/30 hover:shadow-warm"
              >
                <span className={`font-display font-extrabold text-2xl shrink-0 ${
                  i === 0 ? 'text-saffron' : 'text-charcoal-light/40'
                }`}>
                  {topic.rank}
                </span>
                <div className="flex-1 min-w-0">
                  {/* Category pill */}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    topic.categoryColor === 'tag-pill-indigo' ? 'bg-indigo/10 text-indigo border-indigo/20' :
                    topic.categoryColor === 'tag-pill-green' ? 'bg-green/10 text-green border-green/20' :
                    'bg-saffron/10 text-saffron border-saffron/20'
                  } mb-2`}>
                    {topic.category}
                  </span>
                  <h3 className="font-display font-semibold text-indigo text-base leading-snug mb-1.5 group-hover:text-saffron transition-colors mt-2 text-left">
                    {t(topic.titleEn, topic.titleHi)}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-charcoal-light">
                    <span>{t(topic.sourceEn, topic.sourceHi)}</span>
                    <span>&middot;</span>
                    <span>{t(topic.timeEn, topic.timeHi)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right — Word Cloud */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center content-center gap-3 min-h-[300px] rounded-xl bg-white border border-gold/15 p-6"
          >
            {wordCloud.map((w, i) => (
              <motion.span
                key={w.word}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.4 + i * 0.05, duration: 0.4 }}
                className={`${w.size} ${w.color} ${w.weight} font-display cursor-pointer hover:text-saffron transition-colors duration-200 animate-float-slow`}
                style={{ animationDelay: `${-i * 1.5}s`, animationDuration: `${8 + (i % 3) * 4}s` }}
              >
                {w.word}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ─── Section 4: Meet Your AI Anchor ─── */
function AnchorFeatureSection() {
  const { t } = useLanguage()
  const { ref, inView } = useReveal()

  const features = [
    { icon: Volume2, textEn: 'Natural voice synthesis with emotional expression', textHi: 'भावनात्मक अभिव्यक्ति के साथ प्राकृतिक आवाज़ संश्लेषण' },
    { icon: Languages, textEn: 'Hindi + English bilingual support', textHi: 'हिंदी + अंग्रेजी द्विभाषी समर्थन' },
    { icon: Gauge, textEn: 'Adjustable reading speed: 1x, 1.5x, 2x', textHi: 'समायोज्य पढ़ने की गति: 1x, 1.5x, 2x' },
    { icon: Clock, textEn: '24/7 live broadcasting, always current', textHi: '24/7 लाइव प्रसारण, हमेशा अपडेटेड' },
  ]

  return (
    <section
      className="section-padding bg-cream relative overflow-hidden"
      ref={ref}
    >
      {/* Warli divider at top */}
      <div className="warli-divider absolute top-0 left-0 right-0" />

      {/* Subtle left gradient */}
      <div className="absolute top-1/2 -left-48 w-96 h-96 rounded-full bg-saffron/[0.04] blur-[150px] -translate-y-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — Anchor Visual */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
            className="relative"
          >
            <div className="relative rounded-[20px] overflow-hidden shadow-warm-lg border border-gold/15">
              <img
                src="/indian-anchor-hero.png"
                alt="AI Anchor"
                className="w-full h-auto object-cover"
              />
              {/* LIVE badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-terracotta/90 text-white px-3 py-1.5 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                <span className="font-mono text-xs font-semibold">LIVE</span>
              </div>
              {/* Media player controls */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-warm">
                <button className="text-indigo hover:text-saffron transition-colors">
                  <Play size={18} fill="currentColor" />
                </button>
                <div className="flex-1 h-1 bg-cream-dark rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-saffron rounded-full" />
                </div>
                <span className="font-mono text-xs text-charcoal-light">1x</span>
              </div>
            </div>
          </motion.div>

          {/* Right — Feature Content */}
          <div>
            <motion.span
              initial={{ opacity: 0, x: 40 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="inline-block font-mono text-xs text-saffron tracking-[0.15em] uppercase mb-3"
            >
              {t('AI Anchor', 'AI एंकर')}
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, x: 40 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="font-display font-bold heading-lg text-indigo mb-4 text-left"
            >
              {t(
                'Meet Your AI Anchor — News with Indian Soul',
                'मिलिए अपनी AI एंकर से — भारतीय भावना के साथ समाचार'
              )}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: 40 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="text-charcoal-light max-w-[460px] mb-8 text-left font-body leading-relaxed"
            >
              {t(
                "Our AI anchor delivers the latest headlines with the warmth of a trusted Indian broadcaster. She understands context, speaks Hindi and English, and brings emotion to every story.",
                'हमारी AI एंकर एक विश्वसनीय भारतीय प्रसारक की गर्मजोशी के साथ ताज़ा सुर्खियाँ प्रस्तुत करती है।'
              )}
            </motion.p>

            {/* Feature list */}
            <motion.ul
              variants={staggerContainer}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              className="space-y-4 mb-8"
            >
              {features.map((f) => {
                const Icon = f.icon
                return (
                  <motion.li key={f.textEn} variants={fadeUpChild} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-saffron/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-saffron" />
                    </div>
                    <span className="font-body text-sm text-indigo text-left leading-relaxed">
                      {t(f.textEn, f.textHi)}
                    </span>
                  </motion.li>
                )
              })}
            </motion.ul>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.85, duration: 0.6 }}
            >
              <Link
                to="/anchor"
                className="inline-flex items-center gap-2 font-body font-medium text-saffron hover:text-saffron-light transition-colors duration-200"
              >
                {t('Go to Anchor Studio', 'एंकर स्टूडियो में जाएं')}
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Section 5: Stats Band ─── */
function StatsSection() {
  const { t } = useLanguage()
  const { ref, inView } = useReveal()

  const stats = [
    { valueEn: '500K+', valueHi: '5 लाख+', labelEn: 'Readers', labelHi: 'पाठक', icon: Users },
    { valueEn: '50+', valueHi: '50+', labelEn: 'Categories', labelHi: 'श्रेणियाँ', icon: Newspaper },
    { valueEn: '28', valueHi: '२८', labelEn: 'States Covered', labelHi: 'राज्य कवर', icon: MapPin },
    { valueEn: '10K+', valueHi: '10 हज़ार+', labelEn: 'Positive Stories', labelHi: 'सकारात्मक कहानियाँ', icon: HeartPulse },
  ]

  return (
    <section className="section-padding bg-indigo relative overflow-hidden" ref={ref}>
      {/* Warli decorative border */}
      <div className="absolute top-0 left-0 right-0 h-6 warli-divider opacity-30" />
      <div className="absolute bottom-0 left-0 right-0 h-6 warli-divider opacity-30" />

      {/* Ajrakh subtle overlay */}
      <div className="absolute inset-0 ajrakh-frame opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.labelEn}
                variants={fadeUpChild}
                className="text-center"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-cream/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-saffron-light" />
                </div>
                <p className="font-display font-extrabold text-3xl lg:text-4xl text-cream">
                  {t(stat.valueEn, stat.valueHi)}
                </p>
                <p className="text-cream/60 text-sm mt-1">
                  {t(stat.labelEn, stat.labelHi)}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

/* ─── Section 6: CTA Banner ─── */
function CTABanner() {
  const { t } = useLanguage()
  const { ref, inView } = useReveal()

  return (
    <section className="section-padding bg-cream relative" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative rounded-3xl p-10 lg:p-16 text-left overflow-hidden bg-gradient-to-r from-saffron to-terracotta"
        >
          {/* Decorative pattern overlay */}
          <div className="absolute inset-0 bandhej-texture opacity-30 pointer-events-none" />

          {/* Decorative circles */}
          <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative z-10">
            <h2 className="font-display font-bold heading-lg text-white mb-4 text-left">
              {t('Join the Movement', 'आंदोलन से जुड़ें')}
            </h2>
            <p className="text-white/80 max-w-xl font-body leading-relaxed mb-8 text-left">
              {t(
                'Whether you are a social worker, a GenZ changemaker, or a government official — be part of the community spreading positive stories across India.',
                'चाहे आप सामाजिक कार्यकर्ता हों, GenZ परिवर्तनकर्ता हों, या सरकारी अधिकारी — भारत में सकारात्मक कहानियाँ फैलाने वाले समुदाय का हिस्सा बनें।'
              )}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center bg-white text-saffron font-body font-semibold rounded-full px-10 py-4 text-base transition-all duration-250 hover:bg-cream hover:scale-[1.03] shadow-warm"
              >
                {t('Get Started', 'शुरू करें')}
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center bg-transparent border-2 border-white/40 text-white font-body font-semibold rounded-full px-8 py-4 text-base transition-all duration-250 hover:bg-white/10 hover:border-white/60"
              >
                {t('Learn More', 'और जानें')}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── Home Page ─── */
export default function Home() {
  return (
    <div className="bg-cream">
      <HeroSection />
      <CategorySection />
      <TrendingSection />
      <AnchorFeatureSection />
      <StatsSection />
      <CTABanner />
    </div>
  )
}
