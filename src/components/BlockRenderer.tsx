import type { PageBlock } from '@/context/PageBuilderContext'
import HeroBlock from '@/components/blocks/HeroBlock'
import TextBlock from '@/components/blocks/TextBlock'
import ImageBlock from '@/components/blocks/ImageBlock'
import StatsBlock from '@/components/blocks/StatsBlock'
import QuoteBlock from '@/components/blocks/QuoteBlock'
import DividerBlock from '@/components/blocks/DividerBlock'
import CtaBlock from '@/components/blocks/CtaBlock'
import TwoColumnBlock from '@/components/blocks/TwoColumnBlock'
import VideoEmbedBlock from '@/components/blocks/VideoEmbedBlock'
import SocialLinksBlock from '@/components/blocks/SocialLinksBlock'
import HtmlCustomBlock from '@/components/blocks/HtmlCustomBlock'

interface BlockRendererProps {
  block: PageBlock
  isPreview?: boolean
  isSelected?: boolean
  onClick?: (block: PageBlock) => void
}

export default function BlockRenderer({
  block,
  isPreview,
  isSelected,
  onClick,
}: BlockRendererProps) {
  const renderBlock = () => {
    switch (block.type) {
      case 'hero':
        return <HeroBlock block={block} />
      case 'text':
        return <TextBlock block={block} />
      case 'image':
        return <ImageBlock block={block} />
      case 'stats-counter':
        return <StatsBlock block={block} />
      case 'quote':
        return <QuoteBlock block={block} />
      case 'divider-pattern':
        return <DividerBlock block={block} />
      case 'cta-button':
        return <CtaBlock block={block} />
      case 'two-column':
        return <TwoColumnBlock block={block} />
      case 'video-embed':
        return <VideoEmbedBlock block={block} />
      case 'social-links':
        return <SocialLinksBlock block={block} />
      case 'html-custom':
        return <HtmlCustomBlock block={block} />
      default:
        return (
          <div className="w-full py-8 px-6 text-center">
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              Unknown block type: {block.type}
            </p>
          </div>
        )
    }
  }

  if (isPreview) {
    return <div className="w-full">{renderBlock()}</div>
  }

  return (
    <div
      className="relative w-full rounded-xl transition-all cursor-pointer group"
      style={{
        boxShadow: isSelected
          ? '0 0 0 2px #E85D04, 0 4px 6px -1px rgba(0,0,0,0.1)'
          : '0 1px 3px rgba(0,0,0,0.08)',
        backgroundColor: '#FFFFFF',
      }}
      onClick={() => onClick?.(block)}
    >
      <div className="overflow-hidden rounded-xl">{renderBlock()}</div>

      {/* Block type label */}
      <div
        className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: 'rgba(43,45,66,0.8)', color: '#fff' }}
      >
        {block.type}
      </div>
    </div>
  )
}
