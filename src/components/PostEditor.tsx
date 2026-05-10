import { useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  ImagePlus,
  X,
  Loader2,
  Upload,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { AuthorPost } from '@/context/AuthorContext'
import { useMediaUpload } from '@/hooks/useMediaUpload'

const CATEGORIES = [
  'Politics',
  'Technology',
  'Sports',
  'Business',
  'Entertainment',
  'Science',
  'Health',
  'World',
  'India',
]

interface PostEditorProps {
  editPost?: AuthorPost | null
  onSave: (post: {
    title: string
    excerpt: string
    content: string
    category: string
    imageData?: string
    author: string
    status: 'draft' | 'published'
    language: 'en' | 'hi'
  }) => void
  onCancel: () => void
}

interface FormErrors {
  title?: string
  excerpt?: string
  content?: string
  category?: string
  author?: string
}

export default function PostEditor({ editPost, onSave, onCancel }: PostEditorProps) {
  const isEditing = !!editPost

  const [title, setTitle] = useState(editPost?.title || '')
  const [excerpt, setExcerpt] = useState(editPost?.excerpt || '')
  const [content, setContent] = useState(editPost?.content || '')
  const [category, setCategory] = useState(editPost?.category || '')
  const [author, setAuthor] = useState(editPost?.author || '')
  const [language, setLanguage] = useState<'en' | 'hi'>(editPost?.language || 'en')
  const [status, setStatus] = useState<'draft' | 'published'>(editPost?.status || 'draft')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isDragging, setIsDragging] = useState(false)

  const { image, preview, handleFileChange, clearImage, isLoading } = useMediaUpload(
    editPost?.imageData
  )
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editPost) {
      setTitle(editPost.title)
      setExcerpt(editPost.excerpt)
      setContent(editPost.content)
      setCategory(editPost.category)
      setAuthor(editPost.author)
      setLanguage(editPost.language)
      setStatus(editPost.status)
    }
  }, [editPost])

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!title.trim()) newErrors.title = 'Title is required'
    else if (title.length < 3) newErrors.title = 'Title must be at least 3 characters'

    if (!excerpt.trim()) newErrors.excerpt = 'Excerpt is required'
    else if (excerpt.length < 10) newErrors.excerpt = 'Excerpt must be at least 10 characters'

    if (!content.trim()) newErrors.content = 'Content is required'
    else if (content.length < 20) newErrors.content = 'Content must be at least 20 characters'

    if (!category) newErrors.category = 'Category is required'

    if (!author.trim()) newErrors.author = 'Author name is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onSave({
      title: title.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      category,
      imageData: image || undefined,
      author: author.trim(),
      status,
      language,
    })
  }

  const insertTag = useCallback(
    (openTag: string, closeTag: string = '') => {
      const el = contentRef.current
      if (!el) return
      const start = el.selectionStart || 0
      const end = el.selectionEnd || 0
      const selected = content.substring(start, end)
      const newContent =
        content.substring(0, start) + openTag + selected + closeTag + content.substring(end)
      setContent(newContent)
      setTimeout(() => {
        el.focus()
        const newCursor = start + openTag.length + selected.length
        el.setSelectionRange(newCursor, newCursor)
      }, 0)
    },
    [content]
  )

  const toolbarButtons = [
    { icon: Bold, action: () => insertTag('<strong>', '</strong>'), label: 'Bold' },
    { icon: Italic, action: () => insertTag('<em>', '</em>'), label: 'Italic' },
    { icon: Heading1, action: () => insertTag('<h2>', '</h2>'), label: 'Heading' },
    { icon: Heading2, action: () => insertTag('<h3>', '</h3>'), label: 'Subheading' },
    { icon: List, action: () => insertTag('<ul>\n  <li>', '</li>\n</ul>'), label: 'Bullet List' },
    {
      icon: ListOrdered,
      action: () => insertTag('<ol>\n  <li>', '</li>\n</ol>'),
      label: 'Numbered List',
    },
  ]

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        // We need to update the useMediaUpload state - use a synthetic event instead
        const syntheticEvent = {
          target: { files: [new File([file], file.name, { type: file.type })] },
        } as unknown as React.ChangeEvent<HTMLInputElement>
        handleFileChange(syntheticEvent)
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
      className="space-y-6"
    >
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-frost font-medium">
          Title <span className="text-red-400">*</span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (errors.title) setErrors((p) => ({ ...p, title: undefined }))
          }}
          placeholder="Enter post title..."
          className="h-11 bg-midnight border-slate text-frost placeholder:text-steel/60 focus-visible:border-saffron focus-visible:ring-saffron/30"
          aria-invalid={!!errors.title}
        />
        {errors.title && <p className="text-red-400 text-xs">{errors.title}</p>}
      </div>

      {/* Excerpt */}
      <div className="space-y-2">
        <Label htmlFor="excerpt" className="text-frost font-medium">
          Excerpt <span className="text-red-400">*</span>
        </Label>
        <Textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => {
            setExcerpt(e.target.value)
            if (errors.excerpt) setErrors((p) => ({ ...p, excerpt: undefined }))
          }}
          placeholder="2-3 sentence summary of the post..."
          rows={3}
          className="bg-midnight border-slate text-frost placeholder:text-steel/60 focus-visible:border-saffron focus-visible:ring-saffron/30 resize-none"
          aria-invalid={!!errors.excerpt}
        />
        {errors.excerpt && <p className="text-red-400 text-xs">{errors.excerpt}</p>}
        <p className="text-steel text-xs">{excerpt.length}/280 characters recommended</p>
      </div>

      {/* Content with Toolbar */}
      <div className="space-y-2">
        <Label htmlFor="content" className="text-frost font-medium">
          Content <span className="text-red-400">*</span>
        </Label>

        {/* Rich text toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 bg-midnight border border-slate border-b-0 rounded-t-lg">
          {toolbarButtons.map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={btn.action}
              title={btn.label}
              className="p-1.5 rounded text-steel hover:text-frost hover:bg-slate transition-colors"
            >
              <btn.icon size={16} />
            </button>
          ))}
        </div>

        <Textarea
          id="content"
          ref={contentRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            if (errors.content) setErrors((p) => ({ ...p, content: undefined }))
          }}
          placeholder="Write your post content. Use HTML tags for formatting..."
          rows={12}
          className="bg-midnight border-slate border-t-0 rounded-t-none text-frost placeholder:text-steel/60 focus-visible:border-saffron focus-visible:ring-saffron/30 font-mono text-sm resize-y leading-relaxed"
          aria-invalid={!!errors.content}
        />
        {errors.content && <p className="text-red-400 text-xs">{errors.content}</p>}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label className="text-frost font-medium">
          Category <span className="text-red-400">*</span>
        </Label>
        <Select
          value={category}
          onValueChange={(val) => {
            setCategory(val)
            if (errors.category) setErrors((p) => ({ ...p, category: undefined }))
          }}
        >
          <SelectTrigger
            className="h-11 bg-midnight border-slate text-frost focus:ring-saffron/30 [&>span]:text-steel data-[state=open]:border-saffron"
            aria-invalid={!!errors.category}
          >
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent className="bg-midnight border-slate">
            {CATEGORIES.map((cat) => (
              <SelectItem
                key={cat}
                value={cat}
                className="text-frost focus:bg-slate focus:text-frost"
              >
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-red-400 text-xs">{errors.category}</p>}
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label className="text-frost font-medium">Featured Image</Label>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {!preview ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-saffron bg-saffron/5'
                : 'border-slate hover:border-steel bg-midnight'
            }`}
          >
            {isLoading ? (
              <Loader2 size={32} className="mx-auto text-saffron animate-spin mb-2" />
            ) : (
              <ImagePlus
                size={32}
                className={`mx-auto mb-2 ${isDragging ? 'text-saffron' : 'text-steel'}`}
              />
            )}
            <p className="text-sm text-frost font-medium">
              {isDragging ? 'Drop image here' : 'Drag & drop an image here'}
            </p>
            <p className="text-xs text-steel mt-1">
              or click to browse (PNG, JPG, WebP up to 5MB)
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 border-slate text-frost hover:bg-slate"
            >
              <Upload size={14} className="mr-1" /> Select File
            </Button>
          </div>
        ) : (
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Preview"
              className="w-48 h-32 object-cover rounded-lg border border-slate"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Author */}
      <div className="space-y-2">
        <Label htmlFor="author" className="text-frost font-medium">
          Author <span className="text-red-400">*</span>
        </Label>
        <Input
          id="author"
          value={author}
          onChange={(e) => {
            setAuthor(e.target.value)
            if (errors.author) setErrors((p) => ({ ...p, author: undefined }))
          }}
          placeholder="Author name..."
          className="h-11 bg-midnight border-slate text-frost placeholder:text-steel/60 focus-visible:border-saffron focus-visible:ring-saffron/30"
          aria-invalid={!!errors.author}
        />
        {errors.author && <p className="text-red-400 text-xs">{errors.author}</p>}
      </div>

      {/* Language Toggle */}
      <div className="space-y-2">
        <Label className="text-frost font-medium">Language</Label>
        <div className="flex items-center gap-4 bg-midnight border border-slate rounded-lg p-3 w-fit">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              language === 'en'
                ? 'bg-saffron text-void'
                : 'text-steel hover:text-frost'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage('hi')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              language === 'hi'
                ? 'bg-saffron text-void'
                : 'text-steel hover:text-frost'
            }`}
          >
            Hindi
          </button>
        </div>
      </div>

      {/* Status Toggle */}
      <div className="flex items-center justify-between bg-midnight border border-slate rounded-lg p-4">
        <div>
          <p className="text-frost font-medium text-sm">Publish Status</p>
          <p className="text-steel text-xs mt-0.5">
            {status === 'published'
              ? 'Post will be visible to readers'
              : 'Post will be saved as a draft'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-medium ${
              status === 'draft' ? 'text-frost' : 'text-steel'
            }`}
          >
            Draft
          </span>
          <Switch
            checked={status === 'published'}
            onCheckedChange={(checked) => setStatus(checked ? 'published' : 'draft')}
            className="data-[state=checked]:bg-saffron data-[state=unchecked]:bg-steel"
          />
          <span
            className={`text-xs font-medium ${
              status === 'published' ? 'text-green-light' : 'text-steel'
            }`}
          >
            Published
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate">
        <Button
          type="button"
          onClick={handleSubmit}
          className="bg-saffron text-void font-semibold hover:bg-saffron-light px-6"
        >
          {isEditing ? 'Update Post' : 'Create Post'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-slate text-frost hover:bg-slate"
        >
          Cancel
        </Button>
      </div>
    </motion.div>
  )
}
