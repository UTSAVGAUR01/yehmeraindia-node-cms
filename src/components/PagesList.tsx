import { useState } from 'react'
import { Plus, Search, Edit, Trash2, Copy, FileCode, ShieldCheck, Clock } from 'lucide-react'
import type { CustomPage } from '@/context/PageBuilderContext'
import { usePageBuilder } from '@/context/PageBuilderContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import HtmlEditor from '@/components/HtmlEditor'

interface PagesListProps {
  onEditPage: (page: CustomPage) => void
  onCreatePage: () => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function PagesList({ onEditPage, onCreatePage }: PagesListProps) {
  const { pages, deletePage, duplicatePage } = usePageBuilder()
  const [searchQuery, setSearchQuery] = useState('')
  const [htmlEditorPage, setHtmlEditorPage] = useState<CustomPage | null>(null)

  const filteredPages = pages.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (htmlEditorPage) {
    return (
      <HtmlEditor
        page={htmlEditorPage}
        onBack={() => setHtmlEditorPage(null)}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: '#9CA3AF' }}
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pages..."
              className="pl-9 text-sm"
              style={{ backgroundColor: '#FFFFFF' }}
            />
          </div>
        </div>
        <Button
          onClick={onCreatePage}
          className="gap-1.5 text-sm"
          style={{ backgroundColor: '#E85D04', color: '#FFFFFF' }}
        >
          <Plus size={16} />
          Create New Page
        </Button>
      </div>

      {/* Table */}
      <div
        className="rounded-xl border bg-white shadow-sm overflow-hidden"
        style={{ borderColor: '#E5E7EB' }}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: '#F3F4F6' }}>
                <TableHead style={{ color: '#6B7280' }}>Title</TableHead>
                <TableHead style={{ color: '#6B7280' }}>Slug</TableHead>
                <TableHead style={{ color: '#6B7280' }} className="text-center">Blocks</TableHead>
                <TableHead style={{ color: '#6B7280' }}>Status</TableHead>
                <TableHead style={{ color: '#6B7280' }}>Last Updated</TableHead>
                <TableHead className="text-right" style={{ color: '#6B7280' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPages.map((page) => (
                <TableRow key={page.id} style={{ borderColor: '#F3F4F6' }}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span
                        className="text-sm font-medium cursor-pointer hover:underline"
                        style={{ color: '#2B2D42' }}
                        onClick={() => onEditPage(page)}
                      >
                        {page.title}
                      </span>
                      {page.description && (
                        <span
                          className="text-xs truncate max-w-[200px]"
                          style={{ color: '#9CA3AF' }}
                        >
                          {page.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
                    >
                      /{page.slug}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm font-medium" style={{ color: '#1D3557' }}>
                      {page.blocks.length}
                    </span>
                  </TableCell>
                  <TableCell>
                    {page.isPublished ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: 'rgba(45,106,79,0.1)',
                          color: '#2D6A4F',
                        }}
                      >
                        <ShieldCheck size={12} />
                        Published
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: 'rgba(232,93,4,0.1)',
                          color: '#E85D04',
                        }}
                      >
                        <Clock size={12} />
                        Draft
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm" style={{ color: '#6B7280' }}>
                      {formatDate(page.updatedAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg"
                        onClick={() => onEditPage(page)}
                        title="Edit"
                      >
                        <Edit size={16} style={{ color: '#1D3557' }} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg"
                        onClick={() => setHtmlEditorPage(page)}
                        title="HTML Editor"
                      >
                        <FileCode size={16} style={{ color: '#2D6A4F' }} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg"
                        onClick={() => duplicatePage(page.id)}
                        title="Duplicate"
                      >
                        <Copy size={16} style={{ color: '#6B7280' }} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg hover:bg-red-50"
                        onClick={() => {
                          if (window.confirm(`Delete "${page.title}"?`)) {
                            deletePage(page.id)
                          }
                        }}
                        title="Delete"
                      >
                        <Trash2 size={16} style={{ color: '#BC4749' }} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-sm" style={{ color: '#9CA3AF' }}>
                      {searchQuery
                        ? 'No pages match your search'
                        : 'No pages yet. Create your first page!'}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
