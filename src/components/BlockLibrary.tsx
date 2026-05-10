import {
  Layout,
  Type,
  Image,
  BarChart3,
  Quote,
  Minus,
  MousePointerClick,
  Columns2,
  Video,
  Share2,
  Code,
  Plus,
  Grid3X3,
  Newspaper,
} from 'lucide-react'
import type { BlockType } from '@/context/PageBuilderContext'
import { usePageBuilder } from '@/context/PageBuilderContext'
import { ScrollArea } from '@/components/ui/scroll-area'

interface BlockLibraryItem {
  type: BlockType
  label: string
  description: string
  icon: React.ElementType
  category: string
}

const BLOCK_LIBRARY: BlockLibraryItem[] = [
  {
    type: 'hero',
    label: 'Hero Banner',
    description: 'Full-width banner with title, subtitle, and CTA button',
    icon: Layout,
    category: 'Layout',
  },
  {
    type: 'text',
    label: 'Text Section',
    description: 'Heading and body text with alignment options',
    icon: Type,
    category: 'Content',
  },
  {
    type: 'image',
    label: 'Image',
    description: 'Full-width image with optional caption',
    icon: Image,
    category: 'Media',
  },
  {
    type: 'stats-counter',
    label: 'Stats Counter',
    description: 'Animated statistics with icons (up to 4)',
    icon: BarChart3,
    category: 'Content',
  },
  {
    type: 'quote',
    label: 'Quote Block',
    description: 'Styled blockquote with author attribution',
    icon: Quote,
    category: 'Content',
  },
  {
    type: 'divider-pattern',
    label: 'Pattern Divider',
    description: 'Decorative Indian textile pattern divider',
    icon: Minus,
    category: 'Decorative',
  },
  {
    type: 'cta-button',
    label: 'CTA Banner',
    description: 'Call-to-action section with button',
    icon: MousePointerClick,
    category: 'Layout',
  },
  {
    type: 'two-column',
    label: 'Two Column',
    description: '50/50 split layout for content',
    icon: Columns2,
    category: 'Layout',
  },
  {
    type: 'video-embed',
    label: 'Video Embed',
    description: 'YouTube video embed with responsive sizing',
    icon: Video,
    category: 'Media',
  },
  {
    type: 'social-links',
    label: 'Social Links',
    description: 'Social media icon buttons row',
    icon: Share2,
    category: 'Content',
  },
  {
    type: 'html-custom',
    label: 'Custom HTML',
    description: 'Raw HTML content for advanced users',
    icon: Code,
    category: 'Content',
  },
  {
    type: 'news-grid',
    label: 'News Grid',
    description: 'Grid of news articles (auto-populated)',
    icon: Newspaper,
    category: 'Layout',
  },
  {
    type: 'category-cards',
    label: 'Category Cards',
    description: 'Category card grid (auto-populated)',
    icon: Grid3X3,
    category: 'Layout',
  },
]

interface BlockLibraryProps {
  pageId: string
}

export default function BlockLibrary({ pageId }: BlockLibraryProps) {
  const { addBlock } = usePageBuilder()

  const handleAddBlock = (item: BlockLibraryItem) => {
    const defaultContent: Record<string, string> = {}
    const defaultStyles: Record<string, string> = {}

    switch (item.type) {
      case 'hero':
        defaultContent.title = 'New Hero Section'
        defaultContent.subtitle = 'Add your subtitle here'
        defaultContent.buttonText = 'Learn More'
        defaultContent.buttonLink = '#'
        defaultStyles.backgroundColor = '#E85D04'
        break
      case 'text':
        defaultContent.heading = 'Section Heading'
        defaultContent.body = 'Add your content here...'
        defaultContent.alignment = 'left'
        break
      case 'image':
        defaultContent.imageUrl = ''
        defaultContent.altText = ''
        defaultContent.caption = ''
        break
      case 'stats-counter':
        defaultContent.stat1Label = 'Stories'
        defaultContent.stat1Value = '1000'
        defaultContent.stat1Icon = 'FileText'
        defaultContent.stat2Label = 'Readers'
        defaultContent.stat2Value = '50000'
        defaultContent.stat2Icon = 'Users'
        defaultStyles.backgroundColor = '#1D3557'
        break
      case 'quote':
        defaultContent.quote = 'Your inspirational quote goes here.'
        defaultContent.author = 'Author Name'
        defaultContent.authorTitle = 'Title'
        break
      case 'divider-pattern':
        defaultContent.patternType = 'lahariya'
        defaultContent.height = '40'
        break
      case 'cta-button':
        defaultContent.title = 'Call to Action'
        defaultContent.subtitle = 'Add your subtitle'
        defaultContent.buttonText = 'Click Here'
        defaultContent.buttonLink = '#'
        defaultStyles.backgroundColor = '#1D3557'
        break
      case 'two-column':
        defaultContent.leftColumn = 'Left column content...'
        defaultContent.rightColumn = 'Right column content...'
        break
      case 'video-embed':
        defaultContent.videoUrl = ''
        break
      case 'social-links':
        defaultContent.facebook = ''
        defaultContent.twitter = ''
        defaultContent.instagram = ''
        defaultContent.linkedin = ''
        defaultContent.youtube = ''
        break
      case 'html-custom':
        defaultContent.htmlContent = '<div>Your custom HTML here</div>'
        break
      case 'news-grid':
        defaultContent.title = 'Latest News'
        defaultContent.count = '6'
        break
      case 'category-cards':
        defaultContent.title = 'Categories'
        break
    }

    addBlock(pageId, {
      type: item.type,
      content: defaultContent,
      styles: defaultStyles,
      order: Date.now(),
    })
  }

  const categories = ['Layout', 'Content', 'Media', 'Decorative']

  return (
    <div
      className="w-[240px] shrink-0 h-full border-r flex flex-col"
      style={{ backgroundColor: '#FFF8F0', borderColor: '#E5E7EB' }}
    >
      <div className="p-4 border-b" style={{ borderColor: '#E5E7EB' }}>
        <h3 className="text-sm font-semibold" style={{ color: '#2B2D42' }}>
          Block Library
        </h3>
        <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
          Click to add blocks
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {categories.map((category) => {
            const items = BLOCK_LIBRARY.filter((b) => b.category === category)
            if (items.length === 0) return null
            return (
              <div key={category}>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider px-2 mb-2"
                  style={{ color: '#9CA3AF' }}
                >
                  {category}
                </p>
                <div className="space-y-1.5">
                  {items.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.type}
                        onClick={() => handleAddBlock(item)}
                        className="w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-all hover:shadow-md group"
                        style={{ backgroundColor: '#FFFFFF' }}
                      >
                        <div
                          className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: '#FFF8F0' }}
                        >
                          <Icon size={16} style={{ color: '#E85D04' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p
                              className="text-xs font-medium truncate"
                              style={{ color: '#2B2D42' }}
                            >
                              {item.label}
                            </p>
                            <Plus
                              size={12}
                              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ color: '#E85D04' }}
                            />
                          </div>
                          <p
                            className="text-[10px] mt-0.5 leading-tight"
                            style={{ color: '#9CA3AF' }}
                          >
                            {item.description}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
