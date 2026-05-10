import { Quote } from 'lucide-react'
import type { PageBlock } from '@/context/PageBuilderContext'

export default function QuoteBlock({ block }: { block: PageBlock }) {
  const quote = block.content.quote || 'Your inspirational quote goes here.'
  const author = block.content.author || 'Unknown'
  const authorTitle = block.content.authorTitle || ''

  return (
    <section className="w-full py-16 px-6" style={{ backgroundColor: '#FFF8F0' }}>
      <div className="max-w-3xl mx-auto text-center">
        <Quote
          size={32}
          className="mx-auto mb-6"
          style={{ color: '#E85D04', opacity: 0.5 }}
        />
        <blockquote
          className="text-2xl md:text-3xl font-medium italic leading-relaxed mb-6"
          style={{
            color: '#2B2D42',
            fontFamily: "'Playfair Display', Georgia, serif",
          }}
        >
          &ldquo;{quote}&rdquo;
        </blockquote>
        <div className="flex flex-col items-center gap-1">
          <span
            className="text-sm font-semibold"
            style={{ color: '#1D3557' }}
          >
            {author}
          </span>
          {authorTitle && (
            <span className="text-xs" style={{ color: '#6B7280' }}>
              {authorTitle}
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
