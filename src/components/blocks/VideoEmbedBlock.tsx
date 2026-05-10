import { Play } from 'lucide-react'
import type { PageBlock } from '@/context/PageBuilderContext'

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export default function VideoEmbedBlock({ block }: { block: PageBlock }) {
  const videoUrl = block.content.videoUrl || ''
  const videoId = extractYouTubeId(videoUrl)

  if (!videoId) {
    return (
      <section className="w-full py-8 px-6">
        <div className="max-w-3xl mx-auto">
          <div
            className="w-full aspect-video rounded-xl flex flex-col items-center justify-center border-2 border-dashed gap-3"
            style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}
          >
            <Play size={40} style={{ color: '#D1D5DB' }} />
            <p className="text-sm font-medium" style={{ color: '#9CA3AF' }}>
              Enter a YouTube URL to preview
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full py-8 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="w-full aspect-video rounded-xl overflow-hidden shadow-sm">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </div>
    </section>
  )
}
