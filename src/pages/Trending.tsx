import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Bell,
  Globe,
  ArrowRight,
  MapPin,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */

interface HeatMapTopic {
  id: number
  name: string
  mentions: string
  level: 'hot' | 'warm' | 'rising' | 'declining'
  direction: 'up' | 'down'
  category: string
  sparkline: number[]
}

interface TimelineStory {
  id: number
  time: string
  headline: string
  source: string
  viralScore: number
}

interface RegionItem {
  headline: string
  source: string
  items: { text: string; direction: 'up' | 'down' | 'up2' }[]
}

/* ──────────────────────────────────────────────
   Demo Data
   ────────────────────────────────────────────── */

const HEAT_TOPICS: HeatMapTopic[] = [
  { id: 1, name: 'ISRO Mission', mentions: '85K', level: 'hot', direction: 'up', category: 'Tech', sparkline: [20, 35, 30, 50, 45, 60, 55, 70, 65, 80] },
  { id: 2, name: 'Ayodhya Temple', mentions: '72K', level: 'warm', direction: 'up', category: 'India', sparkline: [15, 25, 20, 35, 40, 38, 45, 42, 50, 48] },
  { id: 3, name: 'Digital India 2.0', mentions: '58K', level: 'warm', direction: 'up', category: 'Tech', sparkline: [30, 28, 35, 32, 40, 38, 35, 42, 40, 45] },
  { id: 4, name: 'IPL 2025', mentions: '65K', level: 'hot', direction: 'up', category: 'Sports', sparkline: [10, 12, 15, 18, 20, 22, 25, 24, 26, 28] },
  { id: 5, name: 'Budget 2025', mentions: '55K', level: 'warm', direction: 'up', category: 'Business', sparkline: [12, 18, 15, 22, 20, 28, 25, 30, 27, 32] },
  { id: 6, name: 'Farmer Welfare Schemes', mentions: '48K', level: 'rising', direction: 'up', category: 'India', sparkline: [10, 12, 15, 18, 20, 22, 25, 24, 26, 28] },
  { id: 7, name: 'India Semiconductor', mentions: '42K', level: 'hot', direction: 'up', category: 'Tech', sparkline: [5, 8, 12, 15, 18, 22, 25, 28, 32, 35] },
  { id: 8, name: 'Rupee vs Dollar', mentions: '38K', level: 'rising', direction: 'down', category: 'Business', sparkline: [40, 38, 35, 32, 30, 28, 26, 24, 22, 20] },
  { id: 9, name: 'Lok Sabha Elections', mentions: '92K', level: 'hot', direction: 'up', category: 'Politics', sparkline: [10, 12, 11, 14, 16, 15, 18, 17, 19, 20] },
  { id: 10, name: 'UPI Global', mentions: '35K', level: 'warm', direction: 'up', category: 'Tech', sparkline: [2, 5, 15, 25, 30, 28, 35, 32, 38, 40] },
  { id: 11, name: 'Olympics Prep', mentions: '28K', level: 'rising', direction: 'up', category: 'Sports', sparkline: [6, 7, 8, 8, 9, 10, 10, 11, 11, 12] },
  { id: 12, name: 'Monsoon Forecast', mentions: '45K', level: 'warm', direction: 'up', category: 'India', sparkline: [6, 7, 8, 8, 9, 10, 10, 11, 11, 12] },
]

const TIMELINE_STORIES: TimelineStory[] = [
  { id: 1, time: '08:42 AM', headline: 'BREAKING: ISRO Announces New Lunar Mission', source: 'DD News', viralScore: 96 },
  { id: 2, time: '09:15 AM', headline: 'Viral: Indian Athlete Qualifies for Olympics Finals', source: 'SportsKeeda', viralScore: 89 },
  { id: 3, time: '10:03 AM', headline: 'New Study: Ayurvedic Treatment Shows Promise', source: 'The Hindu', viralScore: 75 },
  { id: 4, time: '11:30 AM', headline: 'Bollywood Blockbuster Breaks Opening Day Records', source: 'Filmfare', viralScore: 93 },
  { id: 5, time: '12:45 PM', headline: 'PM Unveils New Smart City Initiatives', source: 'PIB', viralScore: 88 },
  { id: 6, time: '01:20 PM', headline: 'Indian Startup Becomes Latest Unicorn', source: 'Entrackr', viralScore: 91 },
]

const REGIONS: Record<string, RegionItem> = {
  'North India': {
    headline: 'UP Government Announces New Infrastructure Projects',
    source: 'Amar Ujala',
    items: [
      { text: 'Expressway Expansion', direction: 'up' },
      { text: 'Ganga Cleanup Progress', direction: 'up' },
      { text: 'Wheat Production Up', direction: 'up2' },
    ],
  },
  'South India': {
    headline: 'Tam Nadu IT Hub Sees Record Investment',
    source: 'The Hindu',
    items: [
      { text: 'Semiconductor Plant Inaugurated', direction: 'up2' },
      { text: 'Temple Tourism Boom', direction: 'up' },
      { text: 'Film Industry Strike Ends', direction: 'down' },
    ],
  },
  'Northeast': {
    headline: 'Act East Policy: New Trade Routes Open',
    source: 'Northeast Today',
    items: [
      { text: 'Bamboo Industry Growth', direction: 'up2' },
      { text: 'Tourism Numbers Rising', direction: 'up' },
      { text: 'Connectivity Projects', direction: 'up' },
    ],
  },
}

const FILTER_TABS = ['All', 'Politics', 'Technology', 'Sports', 'Business', 'India']

const CATEGORIES_MAP: Record<string, string[]> = {
  'Politics': ['Politics'],
  'Technology': ['Tech'],
  'Sports': ['Sports'],
  'Business': ['Business'],
  'India': ['India'],
}

const SAFFRON = '#FF9933'

/* ──────────────────────────────────────────────
   Animation helpers
   ────────────────────────────────────────────── */

const easeSmooth = [0.4, 0, 0.2, 1] as [number, number, number, number]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeSmooth } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeSmooth } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: easeSmooth } },
}

/* ──────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────── */

/** Pulsing live dot — isolated + memoized */
const LivePulseDot = memo(function LivePulseDot() {
  return (
    <span className="relative flex h-3 w-3">
      <span className="absolute inline-flex h-full w-full rounded-full bg-signal-red opacity-75 animate-pulse-dot" />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-signal-red" />
    </span>
  )
})

/** Animated stat counter using Framer Motion */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (latest) => {
    if (target >= 1000) {
      return latest.toLocaleString('en-IN', { maximumFractionDigits: 0 })
    }
    return latest.toFixed(target % 1 !== 0 ? 1 : 0)
  })

  useEffect(() => {
    const controls = animate(motionValue, target, {
      duration: 1.5,
      ease: easeSmooth,
    })
    return controls.stop
  }, [target, motionValue])

  useEffect(() => {
    const unsubscribe = rounded.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = latest + suffix
      }
    })
    return unsubscribe
  }, [rounded, suffix])

  return <span ref={ref}>0{suffix}</span>
}

/** Mini sparkline SVG */
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 40
  const h = 16
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: easeSmooth }}
      />
    </svg>
  )
}

/** Heat map cell */
function HeatMapCell({ topic, index }: { topic: HeatMapTopic; index: number }) {
  const levelConfig = {
    hot: { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.4)', iconColor: '#F97316', label: '\uD83D\uDD25\uD83D\uDD25\uD83D\uDD25' },
    warm: { bg: 'rgba(255,153,51,0.1)', border: 'rgba(255,153,51,0.35)', iconColor: SAFFRON, label: '\uD83D\uDD25\uD83D\uDD25' },
    rising: { bg: 'rgba(30,41,59,0.8)', border: 'rgba(30,41,59,1)', iconColor: '#475569', label: '\uD83D\uDD25' },
    declining: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', iconColor: '#EF4444', label: '\uD83D\uDD25' },
  }

  const config = levelConfig[topic.level]
  const sparkColor = topic.level === 'hot' ? '#F97316' : topic.level === 'declining' ? '#EF4444' : SAFFRON

  return (
    <motion.div
      variants={scaleIn}
      custom={index}
      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
      className="rounded-xl p-4 cursor-pointer transition-shadow duration-200"
      style={{
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        '--tw-shadow-color': 'rgba(255,153,51,0.15)',
      } as React.CSSProperties}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 0 20px rgba(255,153,51,0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = ''
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-sm text-frost truncate">{topic.name}</p>
          <p className="font-mono text-xs text-steel mt-0.5">{topic.mentions} mentions</p>
        </div>
        <div className="ml-2 shrink-0">
          {topic.direction === 'up' ? (
            <TrendingUp size={14} className="text-emerald" />
          ) : (
            <TrendingDown size={14} className="text-signal-red" />
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <MiniSparkline data={topic.sparkline} color={sparkColor} />
        <span className="text-xs ml-2" style={{ color: config.iconColor }}>{config.label}</span>
      </div>
    </motion.div>
  )
}

/** Timeline item */
function TimelineItem({ story, index }: { story: TimelineStory; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const isLeft = index % 2 === 0
  const barColor = story.viralScore >= 90 ? '#F97316' : story.viralScore >= 75 ? SAFFRON : SAFFRON

  return (
    <div ref={ref} className="relative flex items-center w-full mb-8 last:mb-0">
      {/* Timeline dot */}
      <div className="absolute left-1/2 -translate-x-1/2 z-10">
        <motion.div
          className="w-3 h-3 rounded-full border-2"
          style={{ borderColor: SAFFRON, backgroundColor: isInView ? SAFFRON : '#0B0F1A' }}
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : { scale: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        />
      </div>

      {/* Card */}
      <motion.div
        className={`w-[calc(50%-2rem)] ${isLeft ? 'mr-auto' : 'ml-auto'}`}
        initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: isLeft ? -30 : 30 }}
        transition={{ duration: 0.5, delay: index * 0.15, ease: easeSmooth }}
      >
        <div
          className="bg-void rounded-xl border border-slate p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          style={{ '--tw-hover-border-opacity': 1 } as React.CSSProperties}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = SAFFRON
            e.currentTarget.style.boxShadow = '0 0 20px rgba(255,153,51,0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = ''
            e.currentTarget.style.boxShadow = ''
          }}
        >
          <span className="font-mono text-xs" style={{ color: SAFFRON }}>{story.time}</span>
          <h4 className="font-heading font-semibold text-sm text-frost mt-1.5 leading-snug">
            {story.headline}
          </h4>
          <p className="text-steel text-xs mt-1">{story.source}</p>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-xs text-steel">Viral score</span>
              <span className="font-mono text-xs font-medium" style={{ color: barColor }}>{story.viralScore}/100</span>
            </div>
            <div className="h-1 rounded-full bg-slate overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: barColor }}
                initial={{ width: 0 }}
                animate={isInView ? { width: `${story.viralScore}%` } : { width: 0 }}
                transition={{ duration: 1, delay: 0.3 + index * 0.15, ease: easeSmooth }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/** Region card */
function RegionCard({ region, data }: { region: string; data: RegionItem }) {
  const iconMap: Record<string, React.ReactElement> = {
    'North India': <MapPin size={28} style={{ color: SAFFRON }} />,
    'South India': <MapPin size={28} style={{ color: SAFFRON }} />,
    'Northeast': <Globe size={28} style={{ color: SAFFRON }} />,
  }

  return (
    <motion.div
      variants={fadeUp}
      className="bg-midnight rounded-2xl border border-slate p-6 transition-all duration-300 hover:shadow-lg"
      style={{ '--tw-hover-border-opacity': 1 } as React.CSSProperties}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = SAFFRON
        e.currentTarget.style.boxShadow = '0 0 20px rgba(255,153,51,0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = ''
        e.currentTarget.style.boxShadow = ''
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          {iconMap[region]}
        </motion.div>
        <h3 className="font-heading font-bold text-h2 text-frost">{region}</h3>
      </div>

      <div className="mb-5 pb-5 border-b border-slate">
        <p className="text-frost text-sm font-medium leading-relaxed">{data.headline}</p>
        <p className="text-steel text-xs mt-1">{data.source}</p>
      </div>

      <ul className="space-y-3">
        {data.items.map((item, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.05 }}
            className="flex items-center gap-2"
          >
            <span className="font-mono text-xs text-steel w-5">{i + 1}.</span>
            <span className="text-frost text-sm flex-1">{item.text}</span>
            {item.direction === 'up2' ? (
              <span className="flex gap-0.5">
                <TrendingUp size={14} className="text-emerald" />
                <TrendingUp size={14} className="text-emerald -ml-1" />
              </span>
            ) : item.direction === 'up' ? (
              <TrendingUp size={14} className="text-emerald" />
            ) : (
              <TrendingDown size={14} className="text-signal-red" />
            )}
          </motion.li>
        ))}
      </ul>

      <button
        className="mt-5 flex items-center gap-1 text-sm font-medium transition-colors duration-200 group hover:opacity-80"
        style={{ color: SAFFRON }}
      >
        View all
        <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
      </button>
    </motion.div>
  )
}

/* ──────────────────────────────────────────────
   Main Page
   ────────────────────────────────────────────── */

export default function Trending() {
  const { t } = useLanguage()
  const [activeFilter, setActiveFilter] = useState('All')
  const [email, setEmail] = useState('')
  const heroRef = useRef<HTMLDivElement>(null)
  const heatRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const regionRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  const heroInView = useInView(heroRef, { once: true })
  const heatInView = useInView(heatRef, { once: true, margin: '-100px' })
  const regionInView = useInView(regionRef, { once: true, margin: '-100px' })
  const ctaInView = useInView(ctaRef, { once: true, margin: '-100px' })

  const filteredTopics = activeFilter === 'All'
    ? HEAT_TOPICS
    : HEAT_TOPICS.filter((t) => CATEGORIES_MAP[activeFilter]?.includes(t.category))

  const handleAlertSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setEmail('')
  }, [])

  return (
    <div className="bg-void">
      {/* ─── Section 1: Dashboard Hero ─── */}
      <section
        ref={heroRef}
        className="relative h-[420px] flex items-center justify-center overflow-hidden"
      >
        {/* Background image with Ken Burns */}
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ scale: 1 }}
          animate={{ scale: 1.05 }}
          transition={{ duration: 20, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }}
        >
          <img
            src="/trending-visual.png"
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
        </motion.div>
        {/* Dark overlay gradient */}
        <div
          className="absolute inset-0 z-[1]"
          style={{ background: 'linear-gradient(180deg, rgba(11,15,26,0.3) 0%, rgba(11,15,26,0.9) 100%)' }}
        />

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.span
            className="inline-block font-mono font-medium text-xs tracking-[0.15em] uppercase mb-4"
            style={{ color: SAFFRON }}
            initial={{ opacity: 0, y: 10 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: easeSmooth }}
          >
            {t('Real-Time Intelligence', 'Real-Time Intelligence')}
          </motion.span>

          <motion.h1
            className="font-heading font-extrabold text-hero text-frost mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: easeSmooth }}
          >
            {t('Trending', 'ट्रेंडिंग')}{' '}
            <span style={{ background: 'linear-gradient(135deg, #FF9933 0%, #FFB366 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t('Now', 'अभी')}
            </span>
          </motion.h1>

          <motion.p
            className="font-body text-h3 text-steel max-w-[520px] mx-auto mb-5"
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: easeSmooth }}
          >
            {t(
              'Live tracking of the stories gaining momentum across India.',
              'भारत में सुर्ख़ियों की लाइव ट्रैकिंग।'
            )}
          </motion.p>

          {/* Live indicator */}
          <motion.div
            className="flex items-center justify-center gap-2 mb-12"
            initial={{ opacity: 0 }}
            animate={heroInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <LivePulseDot />
            <span className="font-mono text-sm text-steel">
              {t(
                'Tracking 500+ Indian sources in real-time',
                '500+ भारतीय स्रोत रियल-टाइम में ट्रैक किए जा रहे हैं'
              )}
            </span>
          </motion.div>

          {/* Stats Ribbon */}
          <motion.div
            className="flex flex-wrap justify-center gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate={heroInView ? 'visible' : 'hidden'}
          >
            {[
              { value: 5847, labelEn: 'Stories Today', labelHi: 'आज की खबरें', suffix: '' },
              { value: 256, labelEn: 'Breaking Now', labelHi: 'ब्रेकिंग', suffix: '' },
              { value: 24.8, labelEn: 'Social Mentions', labelHi: 'सोशल उल्लेख', suffix: 'M' },
              { value: 28, labelEn: 'States', labelHi: 'राज्य', suffix: '' },
            ].map((stat) => (
              <motion.div
                key={stat.labelEn}
                variants={staggerItem}
                className="bg-midnight/80 backdrop-blur-[12px] rounded-xl border border-slate px-8 py-5 min-w-[140px]"
              >
                <div className="font-heading font-bold text-[2.5rem] leading-none" style={{ color: SAFFRON }}>
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="font-body text-xs text-steel mt-1">{t(stat.labelEn, stat.labelHi)}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Section 2: Trending Heat Map ─── */}
      <section ref={heatRef} className="py-24 px-6 lg:px-12">
        <div className="max-w-container mx-auto">
          {/* Section header */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={heatInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: easeSmooth }}
          >
            <span className="inline-block font-mono font-medium text-xs tracking-[0.1em] uppercase mb-3" style={{ color: '#FF9933' }}>
              {t('Heat Map', 'Heat Map')}
            </span>
            <h2 className="font-heading font-bold text-h1 text-frost mb-6">
              {t("What's Heating Up", "What's Heating Up")}
            </h2>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={
                    activeFilter === tab
                      ? 'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200'
                      : 'px-4 py-2 rounded-full text-sm font-medium bg-midnight text-frost border border-slate transition-all duration-200 hover:border-[#FF9933]'
                  }
                  style={activeFilter === tab ? { backgroundColor: SAFFRON, color: '#0B0F1A' } : {}}
                >
                  {tab}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Heat map grid */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate={heatInView ? 'visible' : 'hidden'}
            key={activeFilter}
          >
            {filteredTopics.map((topic, i) => (
              <HeatMapCell key={topic.id} topic={topic} index={i} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Section 3: Viral Stories Timeline ─── */}
      <section ref={timelineRef} className="py-24 px-6 lg:px-12 bg-midnight">
        <div className="max-w-container mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: easeSmooth }}
          >
            <h2 className="font-heading font-bold text-h1 text-frost mb-3">
              {t('Viral Stories Timeline', 'Viral Stories Timeline')}
            </h2>
            <p className="text-steel text-body max-w-xl mx-auto">
              {t(
                'Track how stories explode across the internet in real-time.',
                'देखें कि कैसे खबरें इंटरनेट पर तहलका मचाती हैं।'
              )}
            </p>
          </motion.div>

          {/* Timeline */}
          <div className="relative max-w-3xl mx-auto">
            {/* Center line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-slate rounded-full" />

            {TIMELINE_STORIES.map((story, i) => (
              <TimelineItem key={story.id} story={story} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 4: Trending by Region ─── */}
      <section ref={regionRef} className="py-24 px-6 lg:px-12">
        <div className="max-w-container mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            animate={regionInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: easeSmooth }}
          >
            <span className="inline-block font-mono font-medium text-xs tracking-[0.15em] uppercase mb-3" style={{ color: SAFFRON }}>
              {t('Bharat Pulse', 'भारत का पल्स')}
            </span>
            <h2 className="font-heading font-bold text-h1 text-frost">
              {t("What's Trending Where", 'कहाँ क्या ट्रेंड कर रहा है')}
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            animate={regionInView ? 'visible' : 'hidden'}
          >
            {Object.entries(REGIONS).map(([region, data]) => (
              <RegionCard key={region} region={region} data={data} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Section 5: Get Alerts CTA ─── */}
      <section ref={ctaRef} className="py-20 px-6 lg:px-12">
        <motion.div
          className="max-w-[640px] mx-auto bg-midnight rounded-[20px] border border-slate p-8 md:p-12 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: easeSmooth }}
        >
          {/* Bell icon */}
          <motion.div
            className="inline-flex items-center justify-center mb-6"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Bell size={40} style={{ color: SAFFRON }} />
          </motion.div>

          <h2 className="font-heading font-bold text-h1 text-frost mb-4">
            {t(
              'Never Miss a Breaking Story',
              'कोई ब्रेकिंग खबर मिस न करें'
            )}
          </h2>
          <p className="text-steel text-body mb-8 max-w-md mx-auto">
            {t(
              'Get instant alerts when stories start trending in your chosen categories.',
              'अपनी पसंदीदा श्रेणियों में जब खबरें ट्रेंड करने लगें तो तुरंत अलर्ट पाएँ।'
            )}
          </p>

          <motion.form
            onSubmit={handleAlertSubmit}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2, ease: easeSmooth }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('Enter your email', 'अपना ईमेल दर्ज करें')}
              className="w-full sm:w-[280px] bg-void border border-slate rounded-full px-6 py-3 text-frost text-sm placeholder:text-steel focus:outline-none transition-colors duration-200"
              style={{ '--tw-focus-border-opacity': 1 } as React.CSSProperties}
              onFocus={(e) => { e.currentTarget.style.borderColor = SAFFRON }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '' }}
            />
            <button
              type="submit"
              className="w-full sm:w-auto font-body font-semibold text-sm rounded-full px-6 py-3 transition-all duration-200 hover:scale-[1.03] shrink-0"
              style={{ backgroundColor: SAFFRON, color: '#0B0F1A' }}
            >
              {t('Get Alerts', 'अलर्ट पाएँ')}
            </button>
          </motion.form>

          <p className="text-steel text-xs">
            {t(
              'Join 1M+ subscribers. No spam, ever.',
              '10 लाख+ सब्सक्राइबर्स के साथ जुड़ें। कोई स्पैम नहीं।'
            )}
          </p>
        </motion.div>
      </section>
    </div>
  )
}
