import { createContext, useContext, useState, useCallback, useEffect } from 'react'

export type BlockType =
  | 'hero'
  | 'text'
  | 'image'
  | 'news-grid'
  | 'category-cards'
  | 'stats-counter'
  | 'quote'
  | 'divider-pattern'
  | 'cta-button'
  | 'two-column'
  | 'video-embed'
  | 'social-links'
  | 'html-custom'

export interface PageBlock {
  id: string
  type: BlockType
  content: Record<string, string>
  styles: Record<string, string>
  order: number
}

export interface CustomPage {
  id: string
  title: string
  slug: string
  description: string
  blocks: PageBlock[]
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

interface PageBuilderContextType {
  pages: CustomPage[]
  currentPage: CustomPage | null
  setCurrentPage: (page: CustomPage | null) => void
  addPage: (page: Omit<CustomPage, 'id' | 'createdAt' | 'updatedAt'>) => string
  updatePage: (id: string, updates: Partial<CustomPage>) => void
  deletePage: (id: string) => void
  duplicatePage: (id: string) => void
  addBlock: (pageId: string, block: Omit<PageBlock, 'id'>) => void
  updateBlock: (pageId: string, blockId: string, updates: Partial<PageBlock>) => void
  removeBlock: (pageId: string, blockId: string) => void
  reorderBlocks: (pageId: string, blockIds: string[]) => void
  moveBlock: (pageId: string, blockId: string, direction: 'up' | 'down') => void
  generateHtml: (pageId: string) => string
}

const PageBuilderContext = createContext<PageBuilderContextType | undefined>(undefined)

function generateId() {
  return `block_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function generatePageId() {
  return `page_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

const DEMO_PAGES: CustomPage[] = [
  {
    id: 'page_about_mission',
    title: 'About Our Mission',
    slug: 'about-our-mission',
    description: 'Learn about our mission to bring authentic Indian stories to the world.',
    isPublished: true,
    createdAt: '2025-01-15T10:30:00.000Z',
    updatedAt: '2025-06-20T14:45:00.000Z',
    blocks: [
      {
        id: 'hero_1',
        type: 'hero',
        order: 0,
        content: {
          title: 'Our Mission',
          subtitle: 'Bringing the real stories of India to every corner of the world',
          buttonText: 'Join Our Journey',
          buttonLink: '/register',
        },
        styles: {
          backgroundColor: '#E85D04',
          textColor: '#FFFFFF',
        },
      },
      {
        id: 'text_1',
        type: 'text',
        order: 1,
        content: {
          heading: 'Who We Are',
          body: 'Yeh Mera India is a digital platform dedicated to sharing authentic stories, news, and perspectives from across India. Founded in 2024, we believe in the power of storytelling to connect communities and preserve our rich cultural heritage.',
          alignment: 'left',
        },
        styles: {},
      },
      {
        id: 'stats_1',
        type: 'stats-counter',
        order: 2,
        content: {
          stat1Label: 'Stories Published',
          stat1Value: '12000',
          stat1Icon: 'FileText',
          stat2Label: 'Active Readers',
          stat2Value: '500000',
          stat2Icon: 'Users',
          stat3Label: 'Cities Covered',
          stat3Value: '780',
          stat3Icon: 'MapPin',
          stat4Label: 'Contributors',
          stat4Value: '2500',
          stat4Icon: 'PenTool',
        },
        styles: {
          backgroundColor: '#1D3557',
          textColor: '#FFFFFF',
        },
      },
      {
        id: 'quote_1',
        type: 'quote',
        order: 3,
        content: {
          quote: 'The story of India is not just in its monuments, but in the voices of its people.',
          author: 'Rajesh Sharma',
          authorTitle: 'Founder, Yeh Mera India',
        },
        styles: {},
      },
    ],
  },
  {
    id: 'page_contact_us',
    title: 'Contact Us',
    slug: 'contact-us',
    description: 'Get in touch with the Yeh Mera India team.',
    isPublished: true,
    createdAt: '2025-02-10T08:00:00.000Z',
    updatedAt: '2025-06-18T11:20:00.000Z',
    blocks: [
      {
        id: 'text_2',
        type: 'text',
        order: 0,
        content: {
          heading: 'Get In Touch',
          body: 'We would love to hear from you. Whether you have a story to share, feedback to give, or a partnership opportunity, our team is here to connect.',
          alignment: 'center',
        },
        styles: {},
      },
      {
        id: 'two_col_1',
        type: 'two-column',
        order: 1,
        content: {
          leftColumn: '## Editorial Office\n\nYeh Mera India Media Pvt. Ltd.\n42, Connaught Place\nNew Delhi - 110001\n\n**Phone:** +91 11 2345 6789\n**Email:** editor@yehmeraindia.in',
          rightColumn: '## Regional Offices\n\n**Mumbai:** Bandra West, Maharashtra\n**Bangalore:** Koramangala, Karnataka\n**Chennai:** T. Nagar, Tamil Nadu\n**Kolkata:** Salt Lake, West Bengal',
        },
        styles: {},
      },
      {
        id: 'social_1',
        type: 'social-links',
        order: 2,
        content: {
          facebook: 'https://facebook.com/yehmeraindia',
          twitter: 'https://twitter.com/yehmeraindia',
          instagram: 'https://instagram.com/yehmeraindia',
          linkedin: 'https://linkedin.com/company/yehmeraindia',
          youtube: 'https://youtube.com/yehmeraindia',
        },
        styles: {
          backgroundColor: '#FFF8F0',
        },
      },
    ],
  },
]

export function PageBuilderProvider({ children }: { children: React.ReactNode }) {
  const [pages, setPages] = useState<CustomPage[]>(() => {
    try {
      const saved = localStorage.getItem('ymi_pages')
      if (saved) return JSON.parse(saved) as CustomPage[]
    } catch { /* ignore */ }
    return DEMO_PAGES
  })

  const [currentPage, setCurrentPage] = useState<CustomPage | null>(null)

  useEffect(() => {
    localStorage.setItem('ymi_pages', JSON.stringify(pages))
  }, [pages])

  const addPage = useCallback((page: Omit<CustomPage, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newPage: CustomPage = {
      ...page,
      id: generatePageId(),
      createdAt: now,
      updatedAt: now,
    }
    setPages((prev) => [...prev, newPage])
    return newPage.id
  }, [])

  const updatePage = useCallback((id: string, updates: Partial<CustomPage>) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      )
    )
  }, [])

  const deletePage = useCallback((id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id))
    setCurrentPage((prev) => (prev?.id === id ? null : prev))
  }, [])

  const duplicatePage = useCallback((id: string) => {
    setPages((prev) => {
      const page = prev.find((p) => p.id === id)
      if (!page) return prev
      const now = new Date().toISOString()
      const duplicated: CustomPage = {
        ...page,
        id: generatePageId(),
        title: `${page.title} (Copy)`,
        slug: `${page.slug}-copy`,
        isPublished: false,
        createdAt: now,
        updatedAt: now,
        blocks: page.blocks.map((b) => ({ ...b, id: generateId() })),
      }
      return [...prev, duplicated]
    })
  }, [])

  const addBlock = useCallback((pageId: string, block: Omit<PageBlock, 'id'>) => {
    const newBlock: PageBlock = { ...block, id: generateId() }
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId
          ? {
              ...p,
              blocks: [...p.blocks, newBlock],
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    )
    return newBlock.id
  }, [])

  const updateBlock = useCallback((pageId: string, blockId: string, updates: Partial<PageBlock>) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId
          ? {
              ...p,
              blocks: p.blocks.map((b) =>
                b.id === blockId ? { ...b, ...updates } : b
              ),
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    )
  }, [])

  const removeBlock = useCallback((pageId: string, blockId: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId
          ? {
              ...p,
              blocks: p.blocks.filter((b) => b.id !== blockId),
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    )
  }, [])

  const reorderBlocks = useCallback((pageId: string, blockIds: string[]) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== pageId) return p
        const blockMap = new Map(p.blocks.map((b) => [b.id, b]))
        const reordered = blockIds
          .map((id) => blockMap.get(id))
          .filter((b): b is PageBlock => !!b)
          .map((b, i) => ({ ...b, order: i }))
        return { ...p, blocks: reordered, updatedAt: new Date().toISOString() }
      })
    )
  }, [])

  const moveBlock = useCallback((pageId: string, blockId: string, direction: 'up' | 'down') => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== pageId) return p
        const sorted = [...p.blocks].sort((a, b) => a.order - b.order)
        const idx = sorted.findIndex((b) => b.id === blockId)
        if (idx === -1) return p
        if (direction === 'up' && idx === 0) return p
        if (direction === 'down' && idx === sorted.length - 1) return p
        const newIdx = direction === 'up' ? idx - 1 : idx + 1
        ;[sorted[idx], sorted[newIdx]] = [sorted[newIdx], sorted[idx]]
        return {
          ...p,
          blocks: sorted.map((b, i) => ({ ...b, order: i })),
          updatedAt: new Date().toISOString(),
        }
      })
    )
  }, [])

  const generateHtml = useCallback((pageId: string) => {
    const page = pages.find((p) => p.id === pageId)
    if (!page) return ''
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${page.title} | Yeh Mera India</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #2B2D42; }
  .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
</style>
</head>
<body>
${page.blocks.map((b) => `<div class="block block-${b.type}"></div>`).join('\n')}
</body>
</html>`
  }, [pages])

  return (
    <PageBuilderContext.Provider
      value={{
        pages,
        currentPage,
        setCurrentPage,
        addPage,
        updatePage,
        deletePage,
        duplicatePage,
        addBlock,
        updateBlock,
        removeBlock,
        reorderBlocks,
        moveBlock,
        generateHtml,
      }}
    >
      {children}
    </PageBuilderContext.Provider>
  )
}

export function usePageBuilder() {
  const ctx = useContext(PageBuilderContext)
  if (!ctx) throw new Error('usePageBuilder must be used within PageBuilderProvider')
  return ctx
}
