import { Facebook, Twitter, Instagram, Linkedin, Youtube, ExternalLink } from 'lucide-react'
import type { PageBlock } from '@/context/PageBuilderContext'

const SOCIAL_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  facebook: { label: 'Facebook', icon: Facebook, color: '#1877F2' },
  twitter: { label: 'Twitter', icon: Twitter, color: '#1DA1F2' },
  instagram: { label: 'Instagram', icon: Instagram, color: '#E4405F' },
  linkedin: { label: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
  youtube: { label: 'YouTube', icon: Youtube, color: '#FF0000' },
}

export default function SocialLinksBlock({ block }: { block: PageBlock }) {
  const bgColor = block.styles.backgroundColor || '#FFF8F0'
  const socials = Object.entries(SOCIAL_CONFIG).filter(
    ([key]) => block.content[key]
  )

  if (socials.length === 0) {
    return (
      <section className="w-full py-8 px-6" style={{ backgroundColor: bgColor }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm" style={{ color: '#9CA3AF' }}>
            Add social media URLs in the block editor
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full py-8 px-6" style={{ backgroundColor: bgColor }}>
      <div className="max-w-3xl mx-auto flex flex-col items-center gap-4">
        <p className="text-sm font-medium" style={{ color: '#6B7280' }}>
          Follow us on social media
        </p>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {socials.map(([key, config]) => {
            const Icon = config.icon
            const url = block.content[key]
            if (!url) return null
            return (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:shadow-md hover:scale-105"
                style={{
                  backgroundColor: `${config.color}15`,
                  color: config.color,
                }}
              >
                <Icon size={18} />
                <span>{config.label}</span>
                <ExternalLink size={12} className="opacity-50" />
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
