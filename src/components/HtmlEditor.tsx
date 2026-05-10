import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Save, RotateCcw, Play, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import type { CustomPage } from '@/context/PageBuilderContext'
import { usePageBuilder } from '@/context/PageBuilderContext'
import { Button } from '@/components/ui/button'
import type { PageBlock } from '@/context/PageBuilderContext'

interface HtmlEditorProps {
  page: CustomPage
  onBack: () => void
}

function blockToHtml(block: PageBlock): string {
  const c = block.content
  switch (block.type) {
    case 'hero':
      return `<!-- Hero Block -->
<section style="background: linear-gradient(135deg, ${c.title || '#E85D04'} 0%, #d14a00 100%); padding: 80px 24px; text-align: center; color: white;">
  <div style="max-width: 896px; margin: 0 auto;">
    <h1 style="font-size: 48px; font-weight: bold; margin-bottom: 16px;">${c.title || ''}</h1>
    ${c.subtitle ? `<p style="font-size: 20px; opacity: 0.9; margin-bottom: 32px;">${c.subtitle}</p>` : ''}
    ${c.buttonText ? `<a href="${c.buttonLink || '#'}" style="display: inline-block; padding: 12px 24px; background: white; color: ${c.title || '#E85D04'}; border-radius: 8px; text-decoration: none; font-weight: 600;">${c.buttonText}</a>` : ''}
  </div>
</section>`

    case 'text':
      return `<!-- Text Block -->
<section style="padding: 48px 24px; text-align: ${c.alignment || 'left'};">
  <div style="max-width: 768px; margin: 0 auto;">
    ${c.heading ? `<h2 style="font-size: 30px; font-weight: bold; color: #2B2D42; margin-bottom: 16px;">${c.heading}</h2>` : ''}
    <p style="font-size: 16px; line-height: 1.6; color: #4B5563; white-space: pre-wrap;">${c.body || ''}</p>
  </div>
</section>`

    case 'image':
      return `<!-- Image Block -->
<section style="padding: 32px 24px;">
  <div style="max-width: 896px; margin: 0 auto;">
    <img src="${c.imageUrl || ''}" alt="${c.altText || ''}" style="width: 100%; border-radius: 12px; max-height: 500px; object-fit: cover;" />
    ${c.caption ? `<p style="text-align: center; font-size: 14px; color: #6B7280; margin-top: 12px;">${c.caption}</p>` : ''}
  </div>
</section>`

    case 'stats-counter':
      return `<!-- Stats Block -->
<section style="background-color: ${c.stat1Value || '#1D3557'}; padding: 48px 24px;">
  <div style="max-width: 1024px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 24px; text-align: center; color: white;">
    ${[1, 2, 3, 4].map((i) => {
      const label = c[`stat${i}Label`]
      const value = c[`stat${i}Value`]
      if (!label || !value) return ''
      return `<div><div style="font-size: 30px; font-weight: bold;">${Number(value).toLocaleString('en-IN')}</div><div style="font-size: 14px; opacity: 0.8;">${label}</div></div>`
    }).join('')}
  </div>
</section>`

    case 'quote':
      return `<!-- Quote Block -->
<section style="background-color: #FFF8F0; padding: 64px 24px; text-align: center;">
  <div style="max-width: 768px; margin: 0 auto;">
    <blockquote style="font-size: 24px; font-style: italic; color: #2B2D42; margin-bottom: 24px; font-family: Georgia, serif;">&ldquo;${c.quote || ''}&rdquo;</blockquote>
    <div style="font-weight: 600; color: #1D3557;">${c.author || ''}</div>
    ${c.authorTitle ? `<div style="font-size: 12px; color: #6B7280;">${c.authorTitle}</div>` : ''}
  </div>
</section>`

    case 'divider-pattern':
      return `<!-- Divider Block -->
<div style="height: ${c.height || 40}px; background-color: #FFF8F0;"></div>`

    case 'cta-button':
      return `<!-- CTA Block -->
<section style="background-color: ${c.title || '#1D3557'}; padding: 64px 24px; text-align: center; color: white;">
  <div style="max-width: 768px; margin: 0 auto;">
    <h2 style="font-size: 36px; font-weight: bold; margin-bottom: 16px;">${c.title || ''}</h2>
    ${c.subtitle ? `<p style="font-size: 18px; opacity: 0.9; margin-bottom: 32px;">${c.subtitle}</p>` : ''}
    <a href="${c.buttonLink || '#'}" style="display: inline-block; padding: 14px 32px; background-color: #E85D04; color: white; border-radius: 8px; text-decoration: none; font-weight: 600;">${c.buttonText || 'Click Here'}</a>
  </div>
</section>`

    case 'two-column':
      return `<!-- Two Column Block -->
<section style="padding: 48px 24px;">
  <div style="max-width: 1024px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
    <div style="background: #F9FAFB; padding: 16px; border-radius: 12px; white-space: pre-wrap; font-size: 14px; color: #4B5563;">${c.leftColumn || ''}</div>
    <div style="background: #F9FAFB; padding: 16px; border-radius: 12px; white-space: pre-wrap; font-size: 14px; color: #4B5563;">${c.rightColumn || ''}</div>
  </div>
</section>`

    case 'video-embed': {
      const videoId = c.videoUrl?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)?.[1]
      return `<!-- Video Block -->
<section style="padding: 32px 24px;">
  <div style="max-width: 768px; margin: 0 auto;">
    <div style="position: relative; padding-bottom: 56.25%; border-radius: 12px; overflow: hidden;">
      <iframe src="https://www.youtube.com/embed/${videoId || ''}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allowfullscreen></iframe>
    </div>
  </div>
</section>`
    }

    case 'social-links':
      return `<!-- Social Links Block -->
<section style="background-color: #FFF8F0; padding: 32px 24px; text-align: center;">
  <div style="max-width: 768px; margin: 0 auto;">
    <p style="font-size: 14px; color: #6B7280; margin-bottom: 16px;">Follow us on social media</p>
    <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
      ${['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'].map((s) => {
        const url = c[s]
        if (!url) return ''
        return `<a href="${url}" target="_blank" style="padding: 10px 16px; background: white; border-radius: 8px; text-decoration: none; font-size: 14px; color: #2B2D42;">${s.charAt(0).toUpperCase() + s.slice(1)}</a>`
      }).join('')}
    </div>
  </div>
</section>`

    case 'html-custom':
      return `<!-- Custom HTML Block -->\n${c.htmlContent || ''}`

    default:
      return `<!-- ${block.type} Block -->`
  }
}

function generatePageHtml(page: CustomPage): string {
  const blocksHtml = page.blocks
    .sort((a, b) => a.order - b.order)
    .map(blockToHtml)
    .join('\n\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title} | Yeh Mera India</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #2B2D42; line-height: 1.5; }
  </style>
</head>
<body>

${blocksHtml}

</body>
</html>`
}

export default function HtmlEditor({ page, onBack }: HtmlEditorProps) {
  const { updatePage } = usePageBuilder()
  const [htmlContent, setHtmlContent] = useState(() => generatePageHtml(page))
  const [showPreview, setShowPreview] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(htmlContent)
        doc.close()
      }
    }
  }, [htmlContent])

  const handleSave = () => {
    updatePage(page.id, {
      title: page.title,
      updatedAt: new Date().toISOString(),
    })
    toast.success('HTML saved successfully')
  }

  const handleFormat = () => {
    // Basic formatting: add indentation
    let formatted = htmlContent
      .replace(/>\s*</g, '>\n<')
      .replace(/(<\/[^>]+>)/g, '$1\n')
    setHtmlContent(formatted)
    toast.success('HTML formatted')
  }

  const handleReset = () => {
    if (window.confirm('Reset to generated HTML? All changes will be lost.')) {
      setHtmlContent(generatePageHtml(page))
      toast.success('HTML reset to generated version')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5">
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: '#2B2D42' }}>
              HTML Editor
            </h2>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              {page.title} — /{page.slug}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleFormat} className="gap-1.5 text-xs">
            <Wand2 size={14} />
            Format
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-xs hover:text-red-600 hover:border-red-300">
            <RotateCcw size={14} />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-1.5 text-xs"
          >
            <Play size={14} />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="gap-1.5 text-xs"
            style={{ backgroundColor: '#E85D04', color: '#FFFFFF' }}
          >
            <Save size={14} />
            Save
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div
        className="rounded-xl border shadow-sm overflow-hidden flex"
        style={{ borderColor: '#E5E7EB', minHeight: '500px' }}
      >
        <div className="flex-1 flex flex-col" style={{ minWidth: 0 }}>
          <div
            className="px-4 py-2 border-b flex items-center gap-2"
            style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}
          >
            <FileCodeIcon />
            <span className="text-xs font-medium" style={{ color: '#6B7280' }}>
              HTML Source
            </span>
          </div>
          <textarea
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            className="flex-1 w-full p-4 text-xs font-mono resize-none focus:outline-none"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#2B2D42',
              lineHeight: 1.6,
              tabSize: 2,
            }}
            spellCheck={false}
          />
        </div>

        {showPreview && (
          <div
            className="flex-1 flex flex-col border-l"
            style={{ minWidth: 0, borderColor: '#E5E7EB' }}
          >
            <div
              className="px-4 py-2 border-b flex items-center gap-2"
              style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}
            >
              <EyeIcon />
              <span className="text-xs font-medium" style={{ color: '#6B7280' }}>
                Live Preview
              </span>
            </div>
            <div className="flex-1 bg-white">
              <iframe
                ref={iframeRef}
                className="w-full h-full border-0"
                style={{ minHeight: '460px' }}
                title="HTML Preview"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FileCodeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m10 13-2 2 2 2" />
      <path d="m14 17 2-2-2-2" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
