import type { PageBlock } from '@/context/PageBuilderContext'

export default function ImageBlock({ block }: { block: PageBlock }) {
  const imageUrl = block.content.imageUrl || ''
  const caption = block.content.caption || ''
  const altText = block.content.altText || caption || 'Image'

  if (!imageUrl) {
    return (
      <section className="w-full py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <div
            className="w-full h-64 rounded-xl flex items-center justify-center border-2 border-dashed"
            style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}
          >
            <p className="text-sm font-medium" style={{ color: '#9CA3AF' }}>
              No image URL set
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <img
          src={imageUrl}
          alt={altText}
          className="w-full rounded-xl shadow-sm object-cover"
          style={{ maxHeight: '500px' }}
        />
        {caption && (
          <p className="text-sm text-center mt-3" style={{ color: '#6B7280' }}>
            {caption}
          </p>
        )}
      </div>
    </section>
  )
}
