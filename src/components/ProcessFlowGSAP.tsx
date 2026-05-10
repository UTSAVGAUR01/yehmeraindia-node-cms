import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const steps = [
  { num: 1, label: 'Gather', desc: '200+ sources scanned every minute' },
  { num: 2, label: 'Analyze', desc: 'AI ranks stories by relevance & trend' },
  { num: 3, label: 'Synthesize', desc: 'Articles distilled into clear summaries' },
  { num: 4, label: 'Broadcast', desc: 'AI anchor delivers your personalized news' },
]

export default function ProcessFlowGSAP() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([])
  const textRefs = useRef<(HTMLDivElement | null)[]>([])

  useGSAP(() => {
    if (!sectionRef.current || !lineRef.current) return

    // Animate the progress line fill from 0% to 100% on scroll
    gsap.fromTo(
      lineRef.current,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 60%',
          end: 'bottom 40%',
          scrub: true,
        },
      }
    )

    // Animate each step node activation
    nodeRefs.current.forEach((node, i) => {
      if (!node) return
      const threshold = (i + 1) / steps.length

      gsap.fromTo(
        node,
        { backgroundColor: 'rgba(30, 41, 59, 0)', borderColor: '#1E293B' },
        {
          backgroundColor: '#06B6D4',
          borderColor: '#06B6D4',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: `top ${60 - threshold * 20}%`,
            end: `top ${50 - threshold * 20}%`,
            scrub: true,
          },
        }
      )

      // Text fade in
      const textEl = textRefs.current[i]
      if (textEl) {
        gsap.fromTo(
          textEl,
          { opacity: 0, y: 15 },
          {
            opacity: 1,
            y: 0,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: `top ${55 - threshold * 20}%`,
              end: `top ${45 - threshold * 20}%`,
              scrub: true,
            },
          }
        )
      }
    })
  }, { scope: sectionRef })

  return (
    <div ref={sectionRef} className="relative py-16 md:py-24">
      {/* Connecting line background */}
      <div className="absolute top-1/2 left-[12.5%] right-[12.5%] h-0.5 bg-slate -translate-y-1/2 hidden md:block" />

      {/* Animated fill line */}
      <div
        ref={lineRef}
        className="absolute top-1/2 left-[12.5%] right-[12.5%] h-0.5 bg-cyan-bolt -translate-y-1/2 origin-left hidden md:block"
        style={{ transform: 'scaleX(0)' }}
      />

      {/* Mobile vertical line */}
      <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-slate md:hidden" />
      <div
        ref={(el) => { if (el) { lineRef.current = el } }}
        className="absolute left-8 top-8 bottom-8 w-0.5 bg-cyan-bolt origin-top md:hidden"
        style={{ transform: 'scaleY(0)' }}
      />

      {/* Steps */}
      <div className="relative grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-6">
        {steps.map((step, i) => (
          <div key={step.num} className="relative flex md:flex-col items-center md:text-center">
            {/* Step circle */}
            <div
              ref={(el) => { nodeRefs.current[i] = el }}
              className="relative z-10 flex-shrink-0 w-16 h-16 rounded-full border-2 border-slate bg-midnight flex items-center justify-center transition-colors duration-300"
            >
              <span className="font-heading font-bold text-xl text-frost">
                {step.num}
              </span>
            </div>

            {/* Label + Description */}
            <div
              ref={(el) => { textRefs.current[i] = el }}
              className="ml-6 md:ml-0 md:mt-5 opacity-0"
            >
              <p className="font-heading font-semibold text-sm text-frost mb-1">
                {step.label}
              </p>
              <p className="text-xs text-steel max-w-[200px] leading-relaxed">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
