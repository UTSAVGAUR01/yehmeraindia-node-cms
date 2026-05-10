import { ArrowRight } from 'lucide-react'
import type { PageBlock } from '@/context/PageBuilderContext'

export default function HeroBlock({ block }: { block: PageBlock }) {
  const title = block.content.title || 'Hero Title'
  const subtitle = block.content.subtitle || ''
  const buttonText = block.content.buttonText || ''
  const buttonLink = block.content.buttonLink || '#'
  const bgColor = block.styles.backgroundColor || '#E85D04'

  return (
    <section
      className="relative w-full py-20 px-6 text-center overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${bgColor} 0%, #d14a00 100%)` }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}
        {buttonText && (
          <a
            href={buttonLink}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-lg font-semibold text-sm transition-all hover:shadow-lg hover:scale-105"
            style={{ color: bgColor }}
          >
            {buttonText}
            <ArrowRight size={16} />
          </a>
        )}
      </div>
    </section>
  )
}
