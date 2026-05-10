import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Pencil,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  ImageOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import type { AuthorPost } from '@/context/AuthorContext'

type SortField = 'title' | 'category' | 'author' | 'status' | 'createdAt' | 'viewCount'
type SortDir = 'asc' | 'desc'

interface PostsTableProps {
  posts: AuthorPost[]
  onEdit: (post: AuthorPost) => void
  onDelete: (id: string) => void
  onView: (post: AuthorPost) => void
}

export default function PostsTable({ posts, onEdit, onDelete, onView }: PostsTableProps) {
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; post: AuthorPost | null }>({
    open: false,
    post: null,
  })

  const perPage = 10

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
    setPage(1)
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={13} className="text-steel" />
    return sortDir === 'asc' ? (
      <ArrowUp size={13} className="text-saffron" />
    ) : (
      <ArrowDown size={13} className="text-saffron" />
    )
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    let data = [...posts]
    if (q) {
      data = data.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q)
      )
    }
    data.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'title':
          cmp = a.title.localeCompare(b.title)
          break
        case 'category':
          cmp = a.category.localeCompare(b.category)
          break
        case 'author':
          cmp = a.author.localeCompare(b.author)
          break
        case 'status':
          cmp = a.status.localeCompare(b.status)
          break
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'viewCount':
          cmp = a.viewCount - b.viewCount
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return data
  }, [posts, search, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const currentPage = Math.min(page, totalPages)
  const pageData = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  const confirmDelete = (post: AuthorPost) => {
    setDeleteDialog({ open: true, post })
  }

  const handleDeleteConfirm = () => {
    if (deleteDialog.post) {
      onDelete(deleteDialog.post.id)
      setDeleteDialog({ open: false, post: null })
    }
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatViews = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return String(n)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
      className="space-y-4"
    >
      {/* Search bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-steel" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search posts by title, category, or author..."
            className="pl-9 h-10 bg-midnight border-slate text-frost placeholder:text-steel/60 focus-visible:border-saffron focus-visible:ring-saffron/30"
          />
        </div>
        <span className="text-steel text-sm whitespace-nowrap">
          {filtered.length} post{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate bg-midnight hover:bg-midnight">
              <TableHead className="w-[60px] text-steel font-medium">Image</TableHead>
              <TableHead
                className="text-steel font-medium cursor-pointer select-none"
                onClick={() => toggleSort('title')}
              >
                <span className="flex items-center gap-1">
                  Title <SortIcon field="title" />
                </span>
              </TableHead>
              <TableHead
                className="text-steel font-medium cursor-pointer select-none"
                onClick={() => toggleSort('category')}
              >
                <span className="flex items-center gap-1">
                  Category <SortIcon field="category" />
                </span>
              </TableHead>
              <TableHead
                className="text-steel font-medium cursor-pointer select-none"
                onClick={() => toggleSort('author')}
              >
                <span className="flex items-center gap-1">
                  Author <SortIcon field="author" />
                </span>
              </TableHead>
              <TableHead
                className="text-steel font-medium cursor-pointer select-none"
                onClick={() => toggleSort('status')}
              >
                <span className="flex items-center gap-1">
                  Status <SortIcon field="status" />
                </span>
              </TableHead>
              <TableHead
                className="text-steel font-medium cursor-pointer select-none"
                onClick={() => toggleSort('createdAt')}
              >
                <span className="flex items-center gap-1">
                  Date <SortIcon field="createdAt" />
                </span>
              </TableHead>
              <TableHead
                className="text-steel font-medium cursor-pointer select-none"
                onClick={() => toggleSort('viewCount')}
              >
                <span className="flex items-center gap-1">
                  Views <SortIcon field="viewCount" />
                </span>
              </TableHead>
              <TableHead className="text-steel font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.length === 0 ? (
              <TableRow className="border-slate">
                <TableCell colSpan={8} className="text-center py-12 text-steel">
                  <ImageOff size={40} className="mx-auto mb-3 opacity-40" />
                  <p className="text-lg font-medium text-frost">No posts found</p>
                  <p className="text-sm">
                    {search ? 'Try a different search term' : 'Create your first post to get started'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              pageData.map((post) => (
                <TableRow
                  key={post.id}
                  className="border-slate hover:bg-midnight/80 transition-colors"
                >
                  <TableCell>
                    {post.imageData ? (
                      <img
                        src={post.imageData}
                        alt=""
                        className="w-10 h-10 object-cover rounded-md border border-slate"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md border border-slate bg-void flex items-center justify-center">
                        <ImageOff size={14} className="text-steel" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-frost font-medium line-clamp-1 max-w-[200px]">
                      {post.title}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-frost/80">{post.category}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-frost/80">{post.author}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        post.status === 'published'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-slate/60 text-steel border-slate'
                      }`}
                    >
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-frost/70">{formatDate(post.createdAt)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-frost/70 tabular-nums">
                      {formatViews(post.viewCount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onView(post)}
                        title="View post"
                        className="text-steel hover:text-frost hover:bg-slate size-8"
                      >
                        <Eye size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(post)}
                        title="Edit post"
                        className="text-steel hover:text-saffron hover:bg-saffron/10 size-8"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(post)}
                        title="Delete post"
                        className="text-steel hover:text-red-400 hover:bg-red-500/10 size-8"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-steel text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border-slate text-frost hover:bg-slate disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPage(p)}
                className={`min-w-[36px] ${
                  p === currentPage
                    ? 'bg-saffron text-void hover:bg-saffron-light'
                    : 'border-slate text-frost hover:bg-slate'
                }`}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="border-slate text-frost hover:bg-slate disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, post: null })}>
        <DialogContent className="bg-midnight border-slate text-frost max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-frost">
              <AlertTriangle size={20} className="text-red-400" />
              Delete Post
            </DialogTitle>
            <DialogDescription className="text-steel">
              Are you sure you want to delete &ldquo;{deleteDialog.post?.title}&rdquo;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, post: null })}
              className="border-slate text-frost hover:bg-slate"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600"
            >
              <Trash2 size={14} className="mr-1" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
