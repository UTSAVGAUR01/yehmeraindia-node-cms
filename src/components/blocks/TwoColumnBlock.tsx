import type { PageBlock } from '@/context/PageBuilderContext'

export default function TwoColumnBlock({ block }: { block: PageBlock }) {
  const leftColumn = block.content.leftColumn || ''
  const rightColumn = block.content.rightColumn || ''

  function renderMarkdown(text: string) {
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let key = 0

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('## ')) {
        elements.push(
          <h3
            key={key++}
            className="text-xl font-bold mt-4 mb-2"
            style={{ color: '#2B2D42' }}
          >
            {trimmed.slice(3)}
          </h3>
        )
      } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        elements.push(
          <p
            key={key++}
            className="text-sm font-semibold mb-1"
            style={{ color: '#1D3557' }}
          >
            {trimmed.slice(2, -2)}
          </p>
        )
      } else if (trimmed === '') {
        elements.push(<div key={key++} className="h-2" />)
      } else {
        elements.push(
          <p
            key={key++}
            className="text-sm leading-relaxed mb-1"
            style={{ color: '#4B5563' }}
          >
            {trimmed}
          </p>
        )
      }
    }
    return elements
  }

  return (
    <section className="w-full py-12 px-6" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-4 rounded-xl" style={{ backgroundColor: '#F9FAFB' }}>
          {renderMarkdown(leftColumn)}
        </div>
        <div className="p-4 rounded-xl" style={{ backgroundColor: '#F9FAFB' }}>
          {renderMarkdown(rightColumn)}
        </div>
      </div>
    </section>
  )
}
