import { useState, useCallback } from 'react'
import { ArrowLeft, Save, Eye, EyeOff, Globe, FileCode, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { CustomPage, PageBlock } from '@/context/PageBuilderContext'
import { usePageBuilder } from '@/context/PageBuilderContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import BlockLibrary from '@/components/BlockLibrary'
import BlockRenderer from '@/components/BlockRenderer'
import BlockEditorPanel from '@/components/BlockEditorPanel'

interface PageBuilderPageProps {
  page: CustomPage | null
  onBack: () => void
}

export default function PageBuilderPage({ page, onBack }: PageBuilderPageProps) {
  const { pages, addPage, updatePage, setCurrentPage } = usePageBuilder()
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [isPreview, setIsPreview] = useState(false)
  const [showHtmlEditor, setShowHtmlEditor] = useState(false)
  const [htmlContent, setHtmlContent] = useState('')

  // Editing state for new/existing page
  const [editingPage, setEditingPage] = useState<CustomPage | null>(page)

  const isNewPage = !page || !pages.find((p) => p.id === page.id)

  const handleCreateNew = useCallback(() => {
    const newPage: CustomPage = {
      id: '',
      title: 'Untitled Page',
      slug: 'untitled-page',
      description: '',
      blocks: [],
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setEditingPage(newPage)
    setCurrentPage(newPage)
  }, [setCurrentPage])

  if (!editingPage && !page) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(232,93,4,0.1)' }}
        >
          <Plus size={28} style={{ color: '#E85D04' }} />
        </div>
        <h3 className="text-lg font-semibold" style={{ color: '#2B2D42' }}>
          No Page Selected
        </h3>
        <p className="text-sm" style={{ color: '#6B7280' }}>
          Create a new page or select an existing one to start building.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={handleCreateNew}
            style={{ backgroundColor: '#E85D04', color: '#FFFFFF' }}
          >
            <Plus size={16} className="mr-1.5" />
            Create New Page
          </Button>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft size={16} className="mr-1.5" />
            Back to Pages
          </Button>
        </div>
      </div>
    )
  }

  const currentPageData = editingPage || page
  if (!currentPageData) return null

  const sortedBlocks = [...currentPageData.blocks].sort((a, b) => a.order - b.order)
  const selectedBlock = sortedBlocks.find((b) => b.id === selectedBlockId) || null

  const handleBlockClick = (block: PageBlock) => {
    if (isPreview) return
    setSelectedBlockId(block.id === selectedBlockId ? null : block.id)
  }

  const handleSave = () => {
    if (isNewPage && editingPage) {
      const pageData = {
        title: editingPage.title,
        slug: editingPage.slug,
        description: editingPage.description,
        blocks: editingPage.blocks,
        isPublished: editingPage.isPublished,
      }
      // Create via context
      const newId = addPage(pageData)
      toast.success('Page created successfully')
      // Update local state with the new ID
      setEditingPage((prev) => (prev ? { ...prev, id: newId } : prev))
    } else if (editingPage) {
      updatePage(editingPage.id, {
        title: editingPage.title,
        slug: editingPage.slug,
        description: editingPage.description,
        isPublished: editingPage.isPublished,
      })
      toast.success('Page saved successfully')
    }
  }

  const handlePublishToggle = () => {
    if (!editingPage) return
    const updated = { ...editingPage, isPublished: !editingPage.isPublished }
    setEditingPage(updated)
    if (!isNewPage) {
      updatePage(editingPage.id, { isPublished: !editingPage.isPublished })
    }
    toast.success(updated.isPublished ? 'Page published' : 'Page unpublished')
  }

  const handleUpdatePageField = (field: string, value: string) => {
    if (!editingPage) return
    setEditingPage({ ...editingPage, [field]: value })
  }

  // Generate simple HTML for the HTML editor view
  const generateSimpleHtml = () => {
    const blocksHtml = sortedBlocks.map((b) => {
      const c = b.content
      switch (b.type) {
        case 'hero': return `<section class="hero" style="background:${c.buttonLink || '#E85D04'};padding:80px 24px;text-align:center;color:white;"><h1>${c.title}</h1><p>${c.subtitle}</p></section>`
        case 'text': return `<section class="text" style="padding:48px 24px;text-align:${c.alignment || 'left'};"><h2>${c.heading}</h2><p>${c.body}</p></section>`
        default: return `<section class="${b.type}"></section>`
      }
    }).join('\n')
    return `<!DOCTYPE html>\n<html>\n<head><title>${currentPageData.title}</title></head>\n<body>\n${blocksHtml}\n</body>\n</html>`
  }

  if (showHtmlEditor) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowHtmlEditor(false)} className="gap-1.5">
              <ArrowLeft size={16} />
              Back to Builder
            </Button>
            <h2 className="text-lg font-semibold" style={{ color: '#2B2D42' }}>
              HTML Editor — {currentPageData.title}
            </h2>
          </div>
          <Button
            size="sm"
            onClick={() => { toast.success('HTML saved'); setShowHtmlEditor(false) }}
            style={{ backgroundColor: '#E85D04', color: '#FFFFFF' }}
            className="gap-1.5"
          >
            <Save size={16} />
            Save HTML
          </Button>
        </div>
        <div
          className="rounded-xl border shadow-sm overflow-hidden flex"
          style={{ borderColor: '#E5E7EB', minHeight: '500px' }}
        >
          <div className="flex-1 flex flex-col" style={{ minWidth: 0 }}>
            <div className="px-4 py-2 border-b flex items-center gap-2" style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}>
              <FileCodeIcon />
              <span className="text-xs font-medium" style={{ color: '#6B7280' }}>HTML Source</span>
            </div>
            <textarea
              value={htmlContent || generateSimpleHtml()}
              onChange={(e) => setHtmlContent(e.target.value)}
              className="flex-1 w-full p-4 text-xs font-mono resize-none focus:outline-none"
              style={{ backgroundColor: '#FFFFFF', color: '#2B2D42', lineHeight: 1.6 }}
              spellCheck={false}
            />
          </div>
          <div className="flex-1 flex flex-col border-l" style={{ minWidth: 0, borderColor: '#E5E7EB' }}>
            <div className="px-4 py-2 border-b flex items-center gap-2" style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}>
              <EyeIcon />
              <span className="text-xs font-medium" style={{ color: '#6B7280' }}>Live Preview</span>
            </div>
            <iframe
              className="flex-1 w-full border-0 bg-white"
              style={{ minHeight: '460px' }}
              title="HTML Preview"
              srcDoc={htmlContent || generateSimpleHtml()}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)]" style={{ backgroundColor: '#FFF8F0' }}>
      {/* Header Bar */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 shrink-0">
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="h-6 w-px shrink-0" style={{ backgroundColor: '#E5E7EB' }} />
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Input
              value={editingPage?.title || ''}
              onChange={(e) => handleUpdatePageField('title', e.target.value)}
              className="text-sm font-semibold border-0 bg-transparent focus-visible:ring-0 px-0 max-w-[300px]"
              placeholder="Page Title"
            />
            <div className="hidden sm:flex items-center gap-2">
              <Globe size={14} style={{ color: '#9CA3AF' }} />
              <span className="text-xs font-mono" style={{ color: '#9CA3AF' }}>
                /{editingPage?.slug || ''}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 mr-2">
            <Switch
              id="publish-toggle"
              checked={editingPage?.isPublished || false}
              onCheckedChange={handlePublishToggle}
            />
            <Label
              htmlFor="publish-toggle"
              className="text-xs font-medium cursor-pointer hidden sm:inline"
              style={{ color: editingPage?.isPublished ? '#2D6A4F' : '#6B7280' }}
            >
              {editingPage?.isPublished ? 'Published' : 'Draft'}
            </Label>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHtmlEditor(true)}
            className="gap-1.5 text-xs hidden sm:flex"
          >
            <FileCode size={14} />
            HTML
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
            className="gap-1.5 text-xs"
          >
            {isPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            {isPreview ? 'Edit' : 'Preview'}
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

      {/* 3-Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Block Library */}
        {!isPreview && (
          <BlockLibrary pageId={currentPageData.id || 'temp'} />
        )}

        {/* Center: Builder Canvas */}
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#F3F4F6' }}>
          {/* Page Settings */}
          {!isPreview && (
            <div
              className="mx-4 mt-4 p-4 rounded-xl border bg-white"
              style={{ borderColor: '#E5E7EB' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9CA3AF' }}>
                Page Settings
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 block" style={{ color: '#6B7280' }}>Title</Label>
                  <Input
                    value={editingPage?.title || ''}
                    onChange={(e) => handleUpdatePageField('title', e.target.value)}
                    className="text-sm"
                    placeholder="Page Title"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block" style={{ color: '#6B7280' }}>Slug</Label>
                  <Input
                    value={editingPage?.slug || ''}
                    onChange={(e) => handleUpdatePageField('slug', e.target.value)}
                    className="text-sm"
                    placeholder="page-slug"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block" style={{ color: '#6B7280' }}>Description</Label>
                  <Textarea
                    value={editingPage?.description || ''}
                    onChange={(e) => handleUpdatePageField('description', e.target.value)}
                    className="text-sm min-h-[36px] py-1.5"
                    placeholder="Short description..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Canvas */}
          <div className="p-4">
            <div
              className="mx-auto rounded-xl border overflow-hidden"
              style={{
                maxWidth: isPreview ? '100%' : '900px',
                backgroundColor: '#FFFFFF',
                borderColor: '#E5E7EB',
                minHeight: '200px',
              }}
            >
              {sortedBlocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#FFF8F0' }}
                  >
                    <Plus size={24} style={{ color: '#E85D04' }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: '#6B7280' }}>
                    Your canvas is empty
                  </p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    Click a block from the library to add it
                  </p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: '#F3F4F6' }}>
                  {sortedBlocks.map((b) => (
                    <BlockRenderer
                      key={b.id}
                      block={b}
                      isPreview={isPreview}
                      isSelected={b.id === selectedBlockId}
                      onClick={handleBlockClick}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Block Editor */}
        {!isPreview && (
          <BlockEditorPanel
            block={selectedBlock}
            pageId={currentPageData.id || 'temp'}
            onClose={() => setSelectedBlockId(null)}
          />
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
