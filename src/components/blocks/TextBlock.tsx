import type { PageBlock } from '@/context/PageBuilderContext'

export default function TextBlock({ block }: { block: PageBlock }) {
  const heading = block.content.heading || ''
  const body = block.content.body || ''
  const alignment = block.content.alignment || 'left'

  const alignClass =
    alignment === 'center'
      ? 'text-center'
      : alignment === 'right'
        ? 'text-right'
        : 'text-left'

  return (
    <section className={`w-full py-12 px-6 ${alignClass}`}>
      <div className="max-w-3xl mx-auto">
        {heading && (
          <h2 className="text-3xl font-bold mb-4" style={{ color: '#2B2D42' }}>
            {heading}
          </h2>
        )}
        <div
          className="text-base leading-relaxed whitespace-pre-wrap"
          style={{ color: '#4B5563' }}
        >
          {body}
        </div>
      </div>
    </section>
  )
}
