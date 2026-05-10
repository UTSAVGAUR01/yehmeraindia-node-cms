import { Trash2, ChevronUp, ChevronDown, X } from 'lucide-react'
import type { PageBlock, BlockType } from '@/context/PageBuilderContext'
import { usePageBuilder } from '@/context/PageBuilderContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface BlockEditorPanelProps {
  block: PageBlock | null
  pageId: string
  onClose: () => void
}

const ICON_OPTIONS = [
  'FileText', 'Users', 'MapPin', 'PenTool', 'TrendingUp', 'Eye', 'Heart', 'Globe'
]

export default function BlockEditorPanel({ block, pageId, onClose }: BlockEditorPanelProps) {
  const { updateBlock, removeBlock, moveBlock } = usePageBuilder()

  if (!block) {
    return (
      <div
        className="w-[300px] shrink-0 h-full border-l flex flex-col items-center justify-center p-6"
        style={{ backgroundColor: '#FFF8F0', borderColor: '#E5E7EB' }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
          style={{ backgroundColor: '#F3F4F6' }}
        >
          <X size={20} style={{ color: '#9CA3AF' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: '#6B7280' }}>
          Select a block to edit
        </p>
        <p className="text-xs mt-1 text-center" style={{ color: '#9CA3AF' }}>
          Click on any block in the canvas to edit its properties
        </p>
      </div>
    )
  }

  const handleContentChange = (key: string, value: string) => {
    updateBlock(pageId, block.id, {
      content: { ...block.content, [key]: value },
    })
  }

  const handleStyleChange = (key: string, value: string) => {
    updateBlock(pageId, block.id, {
      styles: { ...block.styles, [key]: value },
    })
  }

  const handleDelete = () => {
    removeBlock(pageId, block.id)
    onClose()
  }

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium" style={{ color: '#6B7280' }}>
        {label}
      </Label>
      {children}
    </div>
  )

  return (
    <div
      className="w-[300px] shrink-0 h-full border-l flex flex-col overflow-hidden"
      style={{ backgroundColor: '#FFF8F0', borderColor: '#E5E7EB' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#E5E7EB' }}>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#E85D04' }}>
            {block.type.replace(/-/g, ' ')}
          </p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: '#2B2D42' }}>
            Edit Block
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors"
        >
          <X size={16} style={{ color: '#6B7280' }} />
        </button>
      </div>

      {/* Scrollable fields */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {renderFields(block.type, block.content, block.styles, handleContentChange, handleStyleChange, Field)}
      </div>

      {/* Actions */}
      <div className="p-4 border-t space-y-2" style={{ borderColor: '#E5E7EB' }}>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => moveBlock(pageId, block.id, 'up')}
          >
            <ChevronUp size={14} className="mr-1" /> Move Up
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => moveBlock(pageId, block.id, 'down')}
          >
            <ChevronDown size={14} className="mr-1" /> Move Down
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          onClick={handleDelete}
        >
          <Trash2 size={14} className="mr-1" /> Delete Block
        </Button>
      </div>
    </div>
  )
}

function renderFields(
  type: BlockType,
  content: Record<string, string>,
  styles: Record<string, string>,
  onContent: (key: string, value: string) => void,
  onStyle: (key: string, value: string) => void,
  Field: ({ label, children }: { label: string; children: React.ReactNode }) => React.ReactNode
) {
  switch (type) {
    case 'hero':
      return (
        <>
          <Field label="Title">
            <Input value={content.title || ''} onChange={(e) => onContent('title', e.target.value)} placeholder="Hero Title" className="text-sm" />
          </Field>
          <Field label="Subtitle">
            <Textarea value={content.subtitle || ''} onChange={(e) => onContent('subtitle', e.target.value)} placeholder="Subtitle text..." className="text-sm min-h-[60px]" />
          </Field>
          <Field label="Button Text">
            <Input value={content.buttonText || ''} onChange={(e) => onContent('buttonText', e.target.value)} placeholder="Get Started" className="text-sm" />
          </Field>
          <Field label="Button Link">
            <Input value={content.buttonLink || ''} onChange={(e) => onContent('buttonLink', e.target.value)} placeholder="/path" className="text-sm" />
          </Field>
          <Field label="Background Color">
            <div className="flex items-center gap-2">
              <input type="color" value={styles.backgroundColor || '#E85D04'} onChange={(e) => onStyle('backgroundColor', e.target.value)} className="w-8 h-8 rounded border cursor-pointer" />
              <Input value={styles.backgroundColor || '#E85D04'} onChange={(e) => onStyle('backgroundColor', e.target.value)} className="text-sm flex-1" />
            </div>
          </Field>
        </>
      )

    case 'text':
      return (
        <>
          <Field label="Heading">
            <Input value={content.heading || ''} onChange={(e) => onContent('heading', e.target.value)} placeholder="Section Heading" className="text-sm" />
          </Field>
          <Field label="Body Text">
            <Textarea value={content.body || ''} onChange={(e) => onContent('body', e.target.value)} placeholder="Write your content here..." className="text-sm min-h-[120px]" />
          </Field>
          <Field label="Alignment">
            <Select value={content.alignment || 'left'} onValueChange={(v) => onContent('alignment', v)}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </>
      )

    case 'image':
      return (
        <>
          <Field label="Image URL">
            <Input value={content.imageUrl || ''} onChange={(e) => onContent('imageUrl', e.target.value)} placeholder="https://example.com/image.jpg" className="text-sm" />
          </Field>
          <Field label="Alt Text">
            <Input value={content.altText || ''} onChange={(e) => onContent('altText', e.target.value)} placeholder="Descriptive alt text" className="text-sm" />
          </Field>
          <Field label="Caption">
            <Input value={content.caption || ''} onChange={(e) => onContent('caption', e.target.value)} placeholder="Image caption" className="text-sm" />
          </Field>
        </>
      )

    case 'stats-counter':
      return (
        <>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 rounded-lg space-y-2" style={{ backgroundColor: '#FFFFFF' }}>
              <p className="text-xs font-semibold" style={{ color: '#2B2D42' }}>Stat {i}</p>
              <Input
                value={content[`stat${i}Label`] || ''}
                onChange={(e) => onContent(`stat${i}Label`, e.target.value)}
                placeholder="Label"
                className="text-sm"
              />
              <Input
                value={content[`stat${i}Value`] || ''}
                onChange={(e) => onContent(`stat${i}Value`, e.target.value)}
                placeholder="Value (number)"
                className="text-sm"
              />
              <Select value={content[`stat${i}Icon`] || 'TrendingUp'} onValueChange={(v) => onContent(`stat${i}Icon`, v)}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          <Field label="Background Color">
            <div className="flex items-center gap-2">
              <input type="color" value={styles.backgroundColor || '#1D3557'} onChange={(e) => onStyle('backgroundColor', e.target.value)} className="w-8 h-8 rounded border cursor-pointer" />
              <Input value={styles.backgroundColor || '#1D3557'} onChange={(e) => onStyle('backgroundColor', e.target.value)} className="text-sm flex-1" />
            </div>
          </Field>
        </>
      )

    case 'quote':
      return (
        <>
          <Field label="Quote Text">
            <Textarea value={content.quote || ''} onChange={(e) => onContent('quote', e.target.value)} placeholder="Enter the quote..." className="text-sm min-h-[80px]" />
          </Field>
          <Field label="Author">
            <Input value={content.author || ''} onChange={(e) => onContent('author', e.target.value)} placeholder="Author name" className="text-sm" />
          </Field>
          <Field label="Author Title">
            <Input value={content.authorTitle || ''} onChange={(e) => onContent('authorTitle', e.target.value)} placeholder="e.g. CEO, Yeh Mera India" className="text-sm" />
          </Field>
        </>
      )

    case 'divider-pattern':
      return (
        <>
          <Field label="Pattern Type">
            <Select value={content.patternType || 'lahariya'} onValueChange={(v) => onContent('patternType', v)}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lahariya">Lahariya (Waves)</SelectItem>
                <SelectItem value="bandhej">Bandhej (Dots)</SelectItem>
                <SelectItem value="warli">Warli (Tribal)</SelectItem>
                <SelectItem value="ajrakh">Ajrakh (Geometry)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Height (px)">
            <Input value={content.height || '40'} onChange={(e) => onContent('height', e.target.value)} placeholder="40" className="text-sm" type="number" />
          </Field>
        </>
      )

    case 'cta-button':
      return (
        <>
          <Field label="Title">
            <Input value={content.title || ''} onChange={(e) => onContent('title', e.target.value)} placeholder="CTA Title" className="text-sm" />
          </Field>
          <Field label="Subtitle">
            <Textarea value={content.subtitle || ''} onChange={(e) => onContent('subtitle', e.target.value)} placeholder="Optional subtitle..." className="text-sm min-h-[50px]" />
          </Field>
          <Field label="Button Text">
            <Input value={content.buttonText || ''} onChange={(e) => onContent('buttonText', e.target.value)} placeholder="Click Here" className="text-sm" />
          </Field>
          <Field label="Button Link">
            <Input value={content.buttonLink || ''} onChange={(e) => onContent('buttonLink', e.target.value)} placeholder="/path" className="text-sm" />
          </Field>
          <Field label="Background Color">
            <div className="flex items-center gap-2">
              <input type="color" value={styles.backgroundColor || '#1D3557'} onChange={(e) => onStyle('backgroundColor', e.target.value)} className="w-8 h-8 rounded border cursor-pointer" />
              <Input value={styles.backgroundColor || '#1D3557'} onChange={(e) => onStyle('backgroundColor', e.target.value)} className="text-sm flex-1" />
            </div>
          </Field>
        </>
      )

    case 'two-column':
      return (
        <>
          <Field label="Left Column">
            <Textarea value={content.leftColumn || ''} onChange={(e) => onContent('leftColumn', e.target.value)} placeholder="Left column content..." className="text-sm min-h-[100px]" />
          </Field>
          <Field label="Right Column">
            <Textarea value={content.rightColumn || ''} onChange={(e) => onContent('rightColumn', e.target.value)} placeholder="Right column content..." className="text-sm min-h-[100px]" />
          </Field>
        </>
      )

    case 'video-embed':
      return (
        <>
          <Field label="YouTube URL">
            <Input value={content.videoUrl || ''} onChange={(e) => onContent('videoUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." className="text-sm" />
          </Field>
        </>
      )

    case 'social-links':
      return (
        <>
          {['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'].map((social) => (
            <Field key={social} label={social.charAt(0).toUpperCase() + social.slice(1) + ' URL'}>
              <Input value={content[social] || ''} onChange={(e) => onContent(social, e.target.value)} placeholder={`https://${social}.com/...`} className="text-sm" />
            </Field>
          ))}
        </>
      )

    case 'html-custom':
      return (
        <>
          <Field label="HTML Content">
            <Textarea value={content.htmlContent || ''} onChange={(e) => onContent('htmlContent', e.target.value)} placeholder="<div>Your custom HTML...</div>" className="text-sm min-h-[200px] font-mono text-xs" />
          </Field>
        </>
      )

    default:
      return (
        <p className="text-sm" style={{ color: '#9CA3AF' }}>
          No editable fields for this block type.
        </p>
      )
  }
}
