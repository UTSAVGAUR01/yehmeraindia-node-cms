import { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Users,
  Globe,
  Award,
  ArrowRight,
  ChevronDown,
  Target,
  Zap,
  BookOpen,
  Rocket,
  MessageCircle,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

/* ──────────────────────────────────────────────
   Animation helpers
   ────────────────────────────────────────────── */

const easeSmooth = [0.4, 0, 0.2, 1] as [number, number, number, number]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: easeSmooth },
  }),
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeSmooth } },
}

/* ──────────────────────────────────────────────
   Data
   ────────────────────────────────────────────── */

const STAT_ITEMS = [
  { value: '2.5M+', labelEn: 'Monthly Readers', labelHi: 'मासिक पाठक', icon: Users },
  { value: '50K+', labelEn: 'Positive Stories', labelHi: 'सकारात्मक कहानियाँ', icon: Heart },
  { value: '28', labelEn: 'States Covered', labelHi: 'कवर किए गए राज्य', icon: Globe },
  { value: '15+', labelEn: 'Awards Won', labelHi: 'जीते गए पुरस्कार', icon: Award },
]

const PRINCIPLES = [
  {
    titleEn: 'Authenticity',
    titleHi: 'प्रामाणिकता',
    descriptionEn: 'Every story verified. Every source cited. Truth above all.',
    descriptionHi: 'हर कहानी सत्यापित। हर स्रोत उद्धृत। सबसे ऊपर सच्चाई।',
    icon: Target,
    color: 'bg-indigo/10 text-indigo',
  },
  {
    titleEn: 'Innovation',
    titleHi: 'नवाचार',
    descriptionEn: 'AI-driven insights. Real-time storytelling. Modern journalism.',
    descriptionHi: 'AI-संचालित अंतर्दृष्टि। रीयल-टाइम कहानी कहना। आधुनिक पत्रकारिता।',
    icon: Zap,
    color: 'bg-saffron/10 text-saffron',
  },
  {
    titleEn: 'Education',
    titleHi: 'शिक्षा',
    descriptionEn: 'Context, not just headlines. Depth, not just speed.',
    descriptionHi: 'केवल सुर्खियाँ नहीं, संदर्भ। केवल गति नहीं, गहराई।',
    icon: BookOpen,
    color: 'bg-green/10 text-green',
  },
  {
    titleEn: 'Impact',
    titleHi: 'प्रभाव',
    descriptionEn: 'Stories that drive change. News that moves society forward.',
    descriptionHi: 'परिवर्तन लाने वाली कहानियाँ। समाज को आगे बढ़ाने वाली खबरें।',
    icon: Rocket,
    color: 'bg-terracotta/10 text-terracotta',
  },
]

const TIMELINE = [
  {
    year: '2019',
    titleEn: 'Founded in Delhi',
    titleHi: 'दिल्ली में स्थापना',
    descriptionEn: 'Started as a small blog focused on positive Indian news stories that mainstream media overlooked.',
    descriptionHi: 'सकारात्मक भारतीय समाचारों पर केंद्रित एक छोटे ब्लॉग के रूप में शुरुआत।',
  },
  {
    year: '2020',
    titleEn: 'Nationwide Reach',
    titleHi: 'राष्ट्रव्यापी पहुंच',
    descriptionEn: 'Crossed 100K monthly readers during the pandemic, providing hope through positive coverage.',
    descriptionHi: 'महामारी के दौरान 1 लाख मासिक पाठकों को पार किया।',
  },
  {
    year: '2021',
    titleEn: 'AI Anchor Launch',
    titleHi: 'AI एंकर लॉन्च',
    descriptionEn: 'Introduced India\'s first AI-powered bilingual news anchor for 24/7 broadcast.',
    descriptionHi: '24/7 प्रसारण के लिए भारत का पहला AI-संचालित द्विभाषी समाचार एंकर पेश किया।',
  },
  {
    year: '2022',
    titleEn: '28 States Coverage',
    titleHi: '28 राज्य कवरेज',
    descriptionEn: 'Expanded to cover positive stories from every corner of India, in multiple languages.',
    descriptionHi: 'भारत के हर कोने से सकारात्मक कहानियों को कई भाषाओं में कवर किया।',
  },
  {
    year: '2023',
    titleEn: '2.5M Readers',
    titleHi: '25 लाख पाठक',
    descriptionEn: 'Achieved 2.5 million monthly active readers, becoming India\'s #1 positive news platform.',
    descriptionHi: '2.5 मिलियन मासिक सक्रिय पाठकों तक पहुँच बनाई।',
  },
]

const FAQS = [
  {
    questionEn: 'What makes Yeh Mera India different from other news platforms?',
    questionHi: 'Yeh Mera India को अन्य समाचार प्लेटफॉर्म से क्या अलग बनाता है?',
    answerEn: 'We exclusively curate positive, solution-oriented stories about India. No sensationalism, no negativity bias—just stories that inspire pride and action.',
    answerHi: 'हम केवल भारत के बारे में सकारात्मक, समाधान-उन्मुख कहानियाँ क्यूरेट करते हैं।',
  },
  {
    questionEn: 'How does the AI Anchor work?',
    questionHi: 'AI एंकर कैसे काम करता है?',
    answerEn: 'Our AI Anchor uses natural language processing and voice synthesis to deliver news in both Hindi and English, with emotional expression that matches story sentiment.',
    answerHi: 'हमारा AI एंकर प्राकृतिक भाषा प्रसंस्करण और वॉयस सिंथेसिस का उपयोग करता है।',
  },
  {
    questionEn: 'How do you verify your news sources?',
    questionHi: 'आप अपने समाचार स्रोतों की कैसे जांच करते हैं?',
    answerEn: 'Every story goes through a multi-step verification process. We source from 50+ verified Indian and international outlets, cross-reference facts, and clearly cite all sources.',
    answerHi: 'हर कहानी एक बहु-चरणीय सत्यापन प्रक्रिया से गुजरती है।',
  },
  {
    questionEn: 'Can I contribute stories to Yeh Mera India?',
    questionHi: 'क्या मैं Yeh Mera India में कहानियाँ योगदान कर सकता हूँ?',
    answerEn: 'Absolutely! Visit our Author Dashboard after registering. You can submit positive stories, track their performance, and grow as a citizen journalist.',
    answerHi: 'बिल्कुल! रजिस्टर करने के बाद हमारे Author Dashboard पर जाएँ।',
  },
]

/* ──────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────── */

function StatCounter({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  const [displayValue, setDisplayValue] = useState('0')

  useEffect(() => {
    if (!inView) return
    const numericPart = value.replace(/[^0-9.]/g, '')
    const suffix = value.replace(/[0-9.]/g, '')
    const target = parseFloat(numericPart)
    if (isNaN(target)) {
      setDisplayValue(value)
      return
    }
    const duration = 1500
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = target * eased
      if (target >= 1000) {
        setDisplayValue(`${Math.round(current).toLocaleString('en-IN')}${suffix}`)
      } else if (numericPart.includes('.')) {
        setDisplayValue(`${current.toFixed(1)}${suffix}`)
      } else {
        setDisplayValue(`${Math.round(current)}${suffix}`)
      }
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, value])

  return (
    <div ref={ref} className="text-center">
      <p className="font-display font-bold text-4xl lg:text-5xl text-cream">{displayValue}</p>
      <p className="text-cream/70 text-sm mt-1 font-body">{label}</p>
    </div>
  )
}

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="font-display font-semibold text-indigo text-base text-left pr-4 group-hover:text-saffron transition-colors">
          {question}
        </span>
        <ChevronDown
          size={20}
          className={`text-charcoal-light shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: easeSmooth }}
            className="overflow-hidden"
          >
            <p className="text-charcoal-light text-sm pb-5 font-body leading-relaxed text-left">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ──────────────────────────────────────────────
   Main Page
   ────────────────────────────────────────────── */

export default function About() {
  const { t } = useLanguage()
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)
  const heroRef = useRef<HTMLDivElement>(null)
  const missionRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const faqRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  const missionInView = useInView(missionRef, { once: true, margin: '-100px' })
  const timelineInView = useInView(timelineRef, { once: true, margin: '-100px' })
  const ctaInView = useInView(ctaRef, { once: true, margin: '-100px' })

  return (
    <div className="bg-cream">
      {/* ─── Section 1: Hero ─── */}
      <section
        ref={heroRef}
        className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-terracotta/10 via-cream to-green/10"
      >
        <div className="absolute inset-0 bandhej-texture opacity-30 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeSmooth }}
            className="text-left max-w-2xl"
          >
            <span className="inline-block font-mono text-xs text-saffron tracking-[0.15em] uppercase mb-4">
              {t('About Us', 'हमारे बारे में')}
            </span>
            <h1 className="font-display font-bold heading-xl text-indigo mb-6 text-left">
              {t(
                "Telling India's Story, One Triumph at a Time",
                'भारत की कहानी, एक विजय at a Time'
              )}
            </h1>
            <p className="text-charcoal-light text-base font-body leading-relaxed max-w-xl text-left">
              {t(
                'Yeh Mera India is India\'s premier positive news platform, dedicated to showcasing the stories of progress, innovation, and human spirit that make our nation extraordinary.',
                'Yeh Mera India भारत का प्रमुख सकारात्मक समाचार प्लेटफॉर्म है।'
              )}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Section 2: Stats ─── */}
      <section className="section-padding bg-indigo relative overflow-hidden">
        <div className="absolute inset-0 ajrakh-frame opacity-30 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12"
          >
            {STAT_ITEMS.map((stat) => (
              <motion.div key={stat.labelEn} variants={staggerItem}>
                <StatCounter
                  value={stat.value}
                  label={t(stat.labelEn, stat.labelHi)}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Section 3: Mission & Principles ─── */}
      <section ref={missionRef} className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[40%_60%] gap-12 lg:gap-20">
            {/* Left — Mission text */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate={missionInView ? 'visible' : 'hidden'}
              custom={0}
              className="flex flex-col justify-center"
            >
              <span className="font-mono text-xs text-saffron tracking-[0.15em] uppercase text-left">
                {t('OUR MISSION', 'हमारा मिशन')}
              </span>
              <h2 className="font-display font-bold heading-lg text-indigo mt-3 mb-6 text-left">
                {t('Why We Exist', 'हम क्यों मौजूद हैं')}
              </h2>
              <p className="text-charcoal-light font-body leading-relaxed mb-4 text-left">
                {t(
                  "In a media landscape dominated by negativity, we believe India's stories deserve better. Every day, millions of Indians achieve extraordinary things, communities come together, and innovations emerge from unexpected corners.",
                  'नकारात्मकता से भरे मीडिया परिदृश्य में, हम मानते हैं कि भारत की कहानियाँ बेहतर की हकदार हैं।'
                )}
              </p>
              <p className="text-charcoal-light font-body leading-relaxed mb-6 text-left">
                {t(
                  'We exist to shine a light on these stories. To remind every Indian of the incredible nation we are building together. To inspire action, foster unity, and spread hope.',
                  'हम इन कहानियों पर प्रकाश डालने के लिए मौजूद हैं।'
                )}
              </p>
              <blockquote className="border-l-4 border-saffron pl-5 py-2">
                <p className="font-editorial text-xl text-indigo italic text-left">
                  &ldquo;{t(
                    'The story of India is not written in headlines alone, but in the quiet triumphs of everyday Indians.',
                    'भारत की कहानी केवल सुर्खियों में नहीं लिखी जाती, बल्कि रोजमर्रा के भारतीयों की शांत विजयों में।'
                  )}&rdquo;
                </p>
              </blockquote>
            </motion.div>

            {/* Right — Principles grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              {PRINCIPLES.map((p, i) => {
                const Icon = p.icon
                return (
                  <motion.div
                    key={p.titleEn}
                    variants={fadeUp}
                    initial="hidden"
                    animate={missionInView ? 'visible' : 'hidden'}
                    custom={0.1 + i * 0.1}
                    className="bg-cream rounded-2xl border border-gold/20 p-6 transition-all duration-300 hover:border-saffron/40 hover:shadow-warm"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${p.color} mb-4`}>
                      <Icon size={22} />
                    </div>
                    <h3 className="font-display font-semibold text-indigo text-base mb-2 text-left">
                      {t(p.titleEn, p.titleHi)}
                    </h3>
                    <p className="text-charcoal-light text-sm font-body leading-relaxed text-left">
                      {t(p.descriptionEn, p.descriptionHi)}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 4: Timeline ─── */}
      <section ref={timelineRef} className="section-padding bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate={timelineInView ? 'visible' : 'hidden'}
            custom={0}
            className="text-left mb-14"
          >
            <span className="inline-block font-mono text-xs text-saffron tracking-[0.15em] uppercase mb-3">
              {t('Our Journey', 'हमारी यात्रा')}
            </span>
            <h2 className="font-display font-bold heading-lg text-indigo text-left">
              {t('From Blog to Movement', 'ब्लॉग से आंदोलन तक')}
            </h2>
          </motion.div>

          {/* Timeline */}
          <div className="relative max-w-3xl">
            {/* Vertical line */}
            <div className="absolute left-4 lg:left-1/2 top-0 bottom-0 w-0.5 bg-gold/30 -translate-x-1/2" />

            {TIMELINE.map((item, i) => {
              const isLeft = i % 2 === 0
              return (
                <motion.div
                  key={item.year}
                  variants={fadeUp}
                  initial="hidden"
                  animate={timelineInView ? 'visible' : 'hidden'}
                  custom={0.1 + i * 0.1}
                  className={`relative flex items-start gap-8 mb-12 last:mb-0 ${
                    isLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  }`}
                >
                  {/* Dot */}
                  <div className="absolute left-4 lg:left-1/2 -translate-x-1/2 z-10">
                    <div className="w-8 h-8 rounded-full bg-saffron border-4 border-cream flex items-center justify-center">
                      <span className="font-mono text-[10px] font-bold text-white">{item.year.slice(2)}</span>
                    </div>
                  </div>

                  {/* Content card */}
                  <div className={`ml-12 lg:ml-0 lg:w-[calc(50%-2rem)] ${isLeft ? 'lg:mr-auto lg:pr-8' : 'lg:ml-auto lg:pl-8'}`}>
                    <div className="bg-white rounded-xl border border-gold/15 p-5 shadow-warm">
                      <span className="font-mono text-xs text-saffron font-semibold">{item.year}</span>
                      <h3 className="font-display font-semibold text-indigo text-base mt-1 mb-2 text-left">
                        {t(item.titleEn, item.titleHi)}
                      </h3>
                      <p className="text-charcoal-light text-sm font-body leading-relaxed text-left">
                        {t(item.descriptionEn, item.descriptionHi)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── Section 5: FAQ ─── */}
      <section ref={faqRef} className="section-padding bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-left mb-10"
          >
            <span className="inline-block font-mono text-xs text-saffron tracking-[0.15em] uppercase mb-3">
              {t('FAQ', 'सामान्य प्रश्न')}
            </span>
            <h2 className="font-display font-bold heading-lg text-indigo text-left">
              {t('Questions & Answers', 'प्रश्न और उत्तर')}
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="border-t border-gray-200"
          >
            {FAQS.map((faq, i) => (
              <motion.div key={i} variants={staggerItem}>
                <FAQItem
                  question={t(faq.questionEn, faq.questionHi)}
                  answer={t(faq.answerEn, faq.answerHi)}
                  isOpen={openFaqIndex === i}
                  onToggle={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Section 6: CTA ─── */}
      <section ref={ctaRef} className="section-padding bg-cream">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={ctaInView ? 'visible' : 'hidden'}
          custom={0}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="relative rounded-3xl p-10 lg:p-16 bg-gradient-to-r from-saffron to-terracotta overflow-hidden text-left">
            <div className="absolute inset-0 bandhej-texture opacity-30 pointer-events-none" />
            <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />

            <div className="relative z-10">
              <h2 className="font-display font-bold heading-lg text-white mb-4 text-left">
                {t('Be Part of the Story', 'कहानी का हिस्सा बनें')}
              </h2>
              <p className="text-white/80 max-w-xl font-body leading-relaxed mb-8 text-left">
                {t(
                  'Join our community of changemakers, readers, and storytellers. Together, we can reshape how India sees itself.',
                  'परिवर्तनकर्ताओं, पाठकों और कथावाचकों की हमारी समुदाय में शामिल हों।'
                )}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="/register"
                  className="inline-flex items-center gap-2 bg-white text-saffron font-body font-semibold rounded-full px-8 py-3.5 transition-all duration-250 hover:bg-cream hover:scale-[1.03] shadow-warm"
                >
                  {t('Get Started', 'शुरू करें')}
                  <ArrowRight size={16} />
                </a>
                <a
                  href="/author"
                  className="inline-flex items-center gap-2 border-2 border-white/40 text-white font-body font-semibold rounded-full px-8 py-3.5 transition-all duration-250 hover:bg-white/10"
                >
                  <MessageCircle size={16} />
                  {t('Author Dashboard', 'लेखक डैशबोर्ड')}
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
