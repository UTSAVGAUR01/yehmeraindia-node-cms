import { ArrowRight } from 'lucide-react'
import type { PageBlock } from '@/context/PageBuilderContext'

export default function CtaBlock({ block }: { block: PageBlock }) {
  const title = block.content.title || 'Ready to get started?'
  const subtitle = block.content.subtitle || ''
  const buttonText = block.content.buttonText || 'Get Started'
  const buttonLink = block.content.buttonLink || '#'
  const bgColor = block.styles.backgroundColor || '#1D3557'
  const textColor = block.styles.textColor || '#FFFFFF'

  return (
    <section
      className="w-full py-16 px-6 text-center"
      style={{ backgroundColor: bgColor }}
    >
      <div className="max-w-3xl mx-auto">
        <h2
          className="text-3xl md:text-4xl font-bold mb-4"
          style={{ color: textColor }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="text-lg mb-8 opacity-90"
            style={{ color: textColor }}
          >
            {subtitle}
          </p>
        )}
        <a
          href={buttonLink}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all hover:shadow-lg hover:scale-105"
          style={{
            backgroundColor: '#E85D04',
            color: '#FFFFFF',
          }}
        >
          {buttonText}
          <ArrowRight size={18} />
        </a>
      </div>
    </section>
  )
}
