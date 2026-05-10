import { useRef, useEffect, lazy, Suspense, useCallback } from 'react'
import { Link } from 'react-router'
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion'
import { Database, TrendingUp, Brain, Mic } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

// Lazy-load the GSAP-driven process flow to isolate it from Framer Motion
const ProcessFlowGSAP = lazy(() => import('@/components/ProcessFlowGSAP'))

/* ── Animation helpers ────────────────────────────────────────────── */

const easeSmooth = [0.4, 0, 0.2, 1] as [number, number, number, number]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: easeSmooth },
  }),
}

/* ── Tech cards data ──────────────────────────────────────────────── */

interface TechCard {
  step: string
  Icon: LucideIcon
  title: string
  desc: string
}

const techCards: TechCard[] = [
  {
    step: '01',
    Icon: Database,
    title: 'Data Aggregation Engine',
    desc: 'Our ingestion layer processes 25,000+ articles per hour from 500+ trusted Indian sources including Hindi, Tamil, Telugu, Bengali, and Marathi publishers. NLP filtering eliminates duplicates, verifies credibility, and ranks stories by relevance and timeliness.',
  },
  {
    step: '02',
    Icon: TrendingUp,
    title: 'Trending Intelligence',
    desc: 'Real-time analytics monitor social signals across Indian platforms, engagement velocity, and cross-reference patterns. Stories are scored by momentum across 22 official languages \u2014 so you hear about what matters to Bharat, not just what\u2019s loud.',
  },
  {
    step: '03',
    Icon: Brain,
    title: 'AI Content Synthesis',
    desc: 'Advanced language models distill complex articles into clear, concise summaries while preserving nuance and context. The system adapts tone and depth for Indian audiences, supporting Hinglish, regional languages, and cultural context.',
  },
  {
    step: '04',
    Icon: Mic,
    title: 'Neural Voice Synthesis',
    desc: 'Our anchor voice is powered by state-of-the-art neural TTS with emotional range, natural prosody, and multilingual capability. Choose from Hindi, English, Hinglish, and regional language delivery styles with Indian voice personalities.',
  },
]

/* ── Stats data ───────────────────────────────────────────────────── */

interface StatItem {
  raw: number
  prefix: string
  suffix: string
  label: string
  subLabel: string
  isText?: boolean
}

const statsEn: StatItem[] = [
  { raw: 50, prefix: '', suffix: ' lakh+', label: 'Articles processed', subLabel: 'Growing daily' },
  { raw: 500, prefix: '', suffix: '+', label: 'Indian news sources', subLabel: 'Trusted publishers' },
  { raw: 2.5, prefix: '', suffix: 'M', label: 'Daily listeners', subLabel: 'From 28 states of India' },
  { raw: 2, prefix: '< ', suffix: ' min', label: 'Average latency', subLabel: 'From publish to broadcast', isText: true },
]

const statsHi: StatItem[] = [
  { raw: 50, prefix: '', suffix: ' लाख+', label: 'लेख प्रोसेस किए', subLabel: 'हर रोज़ बढ़ता हुआ' },
  { raw: 500, prefix: '', suffix: '+', label: 'भारतीय समाचार स्रोत', subLabel: 'विश्वसनीय प्रकाशक' },
  { raw: 2.5, prefix: '', suffix: 'M', label: 'दैनिक श्रोता', subLabel: 'भारत के 28 राज्यों से' },
  { raw: 2, prefix: '< ', suffix: ' मिनट', label: 'औसत लेटेंसी', subLabel: 'प्रकाशन से प्रसारण तक', isText: true },
]

/* ── Animated Counter ─────────────────────────────────────────────── */

function AnimatedCounter({ raw, prefix, suffix, isText }: { raw: number; prefix: string; suffix: string; isText?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => {
    if (isText) {
      return `${prefix}${Math.round(v)}${suffix}`
    }
    if (raw < 1) {
      return `${prefix}${v.toFixed(1)}${suffix}`
    }
    return `${prefix}${Math.round(v)}${suffix}`
  })

  useEffect(() => {
    if (!isInView) return
    const controls = animate(count, raw, {
      duration: 2,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    })
    return controls.stop
  }, [isInView, count, raw, isText])

  return <motion.span ref={ref}>{rounded}</motion.span>
}

/* ── Tech Card SVG Visual ─────────────────────────────────────────── */

function TechCardLine() {
  const ref = useRef<SVGSVGElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <svg
      ref={ref}
      className="w-full h-8 mt-4"
      viewBox="0 0 200 30"
      preserveAspectRatio="none"
    >
      <motion.path
        d="M0 15 Q 25 5, 50 15 T 100 15 T 150 15 T 200 15"
        fill="none"
        stroke="#FF9933"
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1, ease: easeSmooth, delay: 0.3 }}
      />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  About Page                                                       */
/* ═══════════════════════════════════════════════════════════════════ */

export default function About() {
  const { t } = useLanguage()
  const heroRef = useRef<HTMLDivElement>(null)
  const techRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  const heroInView = useInView(heroRef, { once: true, margin: '-50px' })
  const techInView = useInView(techRef, { once: true, margin: '-100px' })
  const statsInView = useInView(statsRef, { once: true, margin: '-100px' })
  const ctaInView = useInView(ctaRef, { once: true, margin: '-100px' })

  /* Scroll-to-section handler */
  const scrollToTech = useCallback(() => {
    techRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const stats = t('en', 'en') === 'en' ? statsEn : statsHi

  return (
    <div className="min-h-[100dvh] bg-void">
      {/* ════════════════════════════════════════════
          Section 1 — Hero: "News of India, in a new style"
      ════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-[80vh] flex items-center overflow-hidden pt-16"
      >
        {/* Subtle left-side gradient orb */}
        <div
          className="absolute -left-32 top-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'rgba(255,153,51,0.04)', filter: 'blur(150px)' }}
        />

        <div className="max-w-container mx-auto px-6 lg:px-12 py-16 md:py-24 w-full">
          <div className="grid lg:grid-cols-[55%_45%] gap-12 lg:gap-16 items-center">
            {/* Left Column — Narrative */}
            <div>
              {/* Eyebrow */}
              <motion.span
                className="inline-block font-mono text-xs tracking-[0.15em] uppercase"
                style={{ color: '#FF9933' }}
                initial={{ opacity: 0 }}
                animate={heroInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.6, ease: easeSmooth }}
              >
                {t('Our Mission', 'हमारा मिशन')}
              </motion.span>

              {/* Title */}
              <motion.h1
                className="font-display font-extrabold text-hero text-frost mt-4"
                initial={{ opacity: 0, y: 40 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.15, ease: easeSmooth }}
              >
                {t('News of India, in a New Style', 'भारत की खबरें, नए अंदाज़ में')}
              </motion.h1>

              {/* Body paragraphs */}
              <motion.p
                className="text-steel text-body leading-[1.75] mt-6 max-w-[520px]"
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.35, ease: easeSmooth }}
              >
                Yeh Mera India was built on a simple belief: every Indian deserves access to news that is instant, unbiased, and delivered in a way that feels natural. In an era of information overload, we use artificial intelligence to cut through the noise &mdash; with stories in Hindi, English, and regional languages.
              </motion.p>

              <motion.p
                className="text-steel text-body leading-[1.75] mt-4 max-w-[520px]"
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.5, ease: easeSmooth }}
              >
                Our AI anchor doesn&apos;t just read headlines &mdash; it understands context, adapts to your preferences, and delivers stories with the warmth and familiarity of a trusted Indian broadcaster. Available 24/7, in 22 scheduled languages, across every device.
              </motion.p>

              {/* Founder quote */}
              <motion.blockquote
                className="mt-8 border-l-[3px] pl-6"
                style={{ borderColor: '#FF9933' }}
                initial={{ opacity: 0, x: -20 }}
                animate={heroInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.65, ease: easeSmooth }}
              >
                <p className="font-heading font-semibold text-h3 text-frost">
                  &ldquo;We didn&apos;t build a news aggregator. We built a news companion for every Indian.&rdquo;
                </p>
              </motion.blockquote>

              {/* CTA link */}
              <motion.button
                onClick={scrollToTech}
                className="inline-flex items-center mt-8 font-body font-medium text-sm transition-colors duration-250 hover:opacity-80"
                style={{ color: '#FF9933' }}
                initial={{ opacity: 0 }}
                animate={heroInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.8, ease: easeSmooth }}
              >
                {t('Meet the Technology', 'तकनीक से मिलें')} &rarr;
              </motion.button>
            </div>

            {/* Right Column — Visual */}
            <motion.div
              className="relative rounded-[20px] overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.4, ease: easeSmooth }}
            >
              <img
                src="/about-team.jpg"
                alt="Yeh Mera India team"
                className="w-full h-auto object-cover"
                loading="eager"
              />
              {/* Bottom gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-void to-transparent pointer-events-none" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          Section 2 — Technology Stack
      ════════════════════════════════════════════ */}
      <section ref={techRef} className="py-16 md:py-32">
        <div className="max-w-container mx-auto px-6 lg:px-12">
          {/* Section Header */}
          <div className="text-center mb-16">
            <motion.span
              className="inline-block font-mono text-xs tracking-[0.15em] uppercase"
              style={{ color: '#FF9933' }}
              variants={fadeUp}
              initial="hidden"
              animate={techInView ? 'visible' : 'hidden'}
              custom={0}
            >
              {t('TECHNOLOGY', 'तकनीक')}
            </motion.span>
            <motion.h2
              className="font-display font-bold text-h1 text-frost mt-3 mx-auto max-w-[700px]"
              variants={fadeUp}
              initial="hidden"
              animate={techInView ? 'visible' : 'hidden'}
              custom={1}
            >
              {t('Built for Speed, Scale, and Intelligence', 'गति, स्केल और बुद्धिमत्ता के लिए बना')}
            </motion.h2>
            <motion.p
              className="text-steel text-body mt-3"
              variants={fadeUp}
              initial="hidden"
              animate={techInView ? 'visible' : 'hidden'}
              custom={2}
            >
              {t('Four pillars power every broadcast.', 'हर प्रसारण को चार स्तंभ शक्ति देते हैं।')}
            </motion.p>
          </div>

          {/* Tech Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {techCards.map((card, i) => (
              <motion.div
                key={card.step}
                className="relative bg-midnight rounded-2xl border border-slate p-8 overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ '--tw-shadow-color': 'rgba(255,153,51,0.15)' } as React.CSSProperties}
                variants={fadeUp}
                initial="hidden"
                animate={techInView ? 'visible' : 'hidden'}
                custom={i}
                transition={{ duration: 0.6, ease: easeSmooth }}
              >
                {/* Decorative step number */}
                <span
                  className="absolute top-4 right-4 font-display font-extrabold text-[4rem] leading-none pointer-events-none select-none"
                  style={{ color: 'rgba(30,41,59,0.3)' }}
                >
                  {card.step}
                </span>

                {/* Icon */}
                <div className="relative z-10 flex items-center justify-center w-12 h-12 mb-5">
                  <card.Icon size={48} strokeWidth={1.5} style={{ color: '#FF9933' }} />
                </div>

                {/* Title */}
                <h3 className="relative z-10 font-heading font-semibold text-h3 text-frost mb-3">
                  {card.title}
                </h3>

                {/* Description */}
                <p className="relative z-10 text-steel text-sm leading-[1.65]">
                  {card.desc}
                </p>

                {/* SVG line */}
                <TechCardLine />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          Section 3 — How It Works (Process Flow)
      ════════════════════════════════════════════ */}
      <section className="bg-midnight py-16 md:py-32">
        <div className="max-w-container mx-auto px-6 lg:px-12">
          {/* Section Header */}
          <div className="text-center mb-16">
            <motion.span
              className="inline-block font-mono text-xs tracking-[0.1em] uppercase"
              style={{ color: '#FF9933' }}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              custom={0}
            >
              {t('THE PROCESS', 'प्रक्रिया')}
            </motion.span>
            <motion.h2
              className="font-display font-bold text-h1 text-frost mt-3"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              custom={1}
            >
              {t('From Headlines to Broadcast in Seconds', 'सेकंडों में सुर्ख़ियों से प्रसारण तक')}
            </motion.h2>
          </div>

          {/* Process Flow — GSAP isolated in separate component */}
          <Suspense
            fallback={
              <div className="min-h-[300px] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#FF9933] border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <ProcessFlowGSAP />
          </Suspense>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          Section 4 — Platform Stats
      ════════════════════════════════════════════ */}
      <section ref={statsRef} className="py-16 md:py-24">
        <div className="max-w-container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className={`text-center py-8 px-4 ${
                  i < stats.length - 1 ? 'lg:border-r lg:border-slate' : ''
                }`}
                variants={fadeUp}
                initial="hidden"
                animate={statsInView ? 'visible' : 'hidden'}
                custom={i}
                transition={{ duration: 0.6, ease: easeSmooth }}
              >
                <p className="font-display font-extrabold text-hero" style={{ background: 'linear-gradient(135deg, #FF9933 0%, #FFB366 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  <AnimatedCounter
                    raw={stat.raw}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    isText={stat.isText}
                  />
                </p>
                <p className="font-heading font-semibold text-h3 text-frost mt-2">
                  {stat.label}
                </p>
                <p className="text-steel text-sm mt-1">{stat.subLabel}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          Section 5 — CTA + Footer area
      ════════════════════════════════════════════ */}
      <section
        ref={ctaRef}
        className="py-16 md:py-24 bg-studio-backdrop"
      >
        <div className="max-w-container mx-auto px-6 lg:px-12 text-center">
          <motion.span
            className="inline-block font-mono text-xs tracking-[0.15em] uppercase"
            style={{ color: '#FF9933' }}
            variants={fadeUp}
            initial="hidden"
            animate={ctaInView ? 'visible' : 'hidden'}
            custom={0}
          >
            {t('GET STARTED', 'शुरू करें')}
          </motion.span>

          <motion.h2
            className="font-display font-bold text-h1 text-frost mt-3 mx-auto max-w-[600px]"
            variants={fadeUp}
            initial="hidden"
            animate={ctaInView ? 'visible' : 'hidden'}
            custom={1}
          >
            {t('Experience the Future of News Delivery', 'समाचार वितरण का भविष्य अनुभव करें')}
          </motion.h2>

          <motion.p
            className="text-steel text-body mt-4 max-w-[500px] mx-auto"
            variants={fadeUp}
            initial="hidden"
            animate={ctaInView ? 'visible' : 'hidden'}
            custom={2}
          >
            {t(
              'Join over 2.5 million daily listeners who trust Yeh Mera India for their daily news.',
              '25 लाख+ दैनिक श्रोताओं के साथ जुड़ें जो Yeh Mera India पर भरोसा करते हैं।'
            )}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
            variants={fadeUp}
            initial="hidden"
            animate={ctaInView ? 'visible' : 'hidden'}
            custom={3}
          >
            <Link
              to="/anchor"
              className="inline-flex items-center font-body font-semibold rounded-full px-8 py-4 transition-all duration-250 hover:scale-[1.03] hover:shadow-lg"
              style={{ backgroundColor: '#FF9933', color: '#0B0F1A' }}
            >
              {t('Launch Anchor Studio', 'एंकर स्टूडियो लॉन्च करें')}
            </Link>
            <Link
              to="/categories"
              className="inline-flex items-center bg-transparent border border-slate text-frost font-body font-semibold rounded-full px-8 py-4 transition-all duration-250 hover:border-[#FF9933]"
              style={{ '--tw-text-opacity': 1 } as React.CSSProperties}
            >
              {t('Explore Categories', 'श्रेणियाँ देखें')}
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
