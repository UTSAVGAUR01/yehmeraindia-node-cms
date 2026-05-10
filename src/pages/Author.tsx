import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  CheckCircle,
  Edit3,
  Eye,
  PlusCircle,
  LayoutDashboard,
  ChevronRight,
} from 'lucide-react'
import { useAuthor } from '@/context/AuthorContext'
import type { AuthorPost } from '@/context/AuthorContext'
import PostsTable from '@/components/PostsTable'
import PostEditor from '@/components/PostEditor'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

type TabMode = 'list' | 'create' | 'edit'

/* ─── Stats Card ─── */
function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  delay,
}: {
  icon: typeof FileText
  label: string
  value: number
  accent: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
      className="bg-white border border-gold/20 rounded-xl p-5 flex items-center gap-4 shadow-warm hover:shadow-warm-lg transition-shadow"
    >
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${accent}18` }}
      >
        <Icon size={22} style={{ color: accent }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-indigo leading-none">{value.toLocaleString()}</p>
        <p className="text-charcoal-light text-sm mt-1">{label}</p>
      </div>
    </motion.div>
  )
}

/* ─── Breadcrumb ─── */
function Breadcrumb({
  items,
  onNavigate,
}: {
  items: { label: string; mode?: TabMode }[]
  onNavigate: (mode: TabMode) => void
}) {
  return (
    <nav className="flex items-center gap-2 text-sm mb-6">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <ChevronRight size={14} className="text-charcoal-light" />}
          {item.mode ? (
            <button
              onClick={() => onNavigate(item.mode!)}
              className="text-charcoal-light hover:text-indigo transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-indigo font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

/* ─── Main Author Dashboard ─── */
export default function Author() {
  const { posts, addPost, updatePost, deletePost } = useAuthor()
  const [mode, setMode] = useState<TabMode>('list')
  const [editPost, setEditPost] = useState<AuthorPost | null>(null)
  const [viewPost, setViewPost] = useState<AuthorPost | null>(null)

  const totalPosts = posts.length
  const publishedPosts = posts.filter((p) => p.status === 'published').length
  const draftPosts = posts.filter((p) => p.status === 'draft').length
  const totalViews = posts.reduce((sum, p) => sum + p.viewCount, 0)

  const handleEdit = useCallback((post: AuthorPost) => {
    setEditPost(post)
    setMode('edit')
  }, [])

  const handleSave = useCallback(
    (data: {
      title: string
      excerpt: string
      content: string
      category: string
      imageData?: string
      author: string
      status: 'draft' | 'published'
      language: 'en' | 'hi'
    }) => {
      if (mode === 'edit' && editPost) {
        updatePost(editPost.id, data)
      } else {
        addPost(data)
      }
      setMode('list')
      setEditPost(null)
    },
    [mode, editPost, addPost, updatePost]
  )

  const handleCancel = useCallback(() => {
    setMode('list')
    setEditPost(null)
  }, [])

  const handleDelete = useCallback(
    (id: string) => {
      deletePost(id)
    },
    [deletePost]
  )

  const handleView = useCallback((post: AuthorPost) => {
    setViewPost(post)
  }, [])

  const getBreadcrumb = () => {
    const items: { label: string; mode?: TabMode }[] = [
      { label: 'Dashboard', mode: 'list' },
    ]
    if (mode === 'create') items.push({ label: 'Create Post' })
    if (mode === 'edit') items.push({ label: 'Edit Post' })
    return items
  }

  return (
    <div className="min-h-[100dvh] bg-cream pt-24 pb-16 relative">
      {/* Subtle background warmth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(232,93,4,0.02) 0%, transparent 40%)' }}
      />

      <div className="relative z-10 max-w-container mx-auto px-6 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-display font-bold text-h2 gradient-text-saffron">
              Author Dashboard
            </h1>
            <Button
              onClick={() => {
                setEditPost(null)
                setMode('create')
              }}
              className="bg-saffron text-white font-semibold hover:bg-saffron-light gap-2 hidden sm:inline-flex shadow-warm hover:shadow-warm-lg"
            >
              <PlusCircle size={16} /> New Post
            </Button>
          </div>
          <p className="text-charcoal-light font-body">
            Create, manage, and publish news posts for Yeh Mera India
          </p>
        </motion.div>

        {/* Stats Cards */}
        {mode === 'list' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={FileText} label="Total Posts" value={totalPosts} accent="#E85D04" delay={0} />
            <StatCard
              icon={CheckCircle}
              label="Published"
              value={publishedPosts}
              accent="#2D6A4F"
              delay={0.05}
            />
            <StatCard icon={Edit3} label="Drafts" value={draftPosts} accent="#457B9D" delay={0.1} />
            <StatCard icon={Eye} label="Total Views" value={totalViews} accent="#1D3557" delay={0.15} />
          </div>
        )}

        {/* Breadcrumb (for create/edit) */}
        {mode !== 'list' && <Breadcrumb items={getBreadcrumb()} onNavigate={setMode} />}

        {/* Mobile FAB */}
        {mode === 'list' && (
          <div className="sm:hidden fixed bottom-6 right-6 z-30">
            <Button
              onClick={() => {
                setEditPost(null)
                setMode('create')
              }}
              size="lg"
              className="bg-saffron text-white rounded-full shadow-warm-lg hover:bg-saffron-light h-14 px-6"
            >
              <PlusCircle size={18} className="mr-1" /> New Post
            </Button>
          </div>
        )}

        {/* Content area */}
        <AnimatePresence mode="wait">
          {mode === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Tabs */}
              <div className="flex items-center gap-1 mb-6 bg-white border border-gold/20 rounded-lg p-1 w-fit shadow-warm">
                <button
                  onClick={() => setMode('list')}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors bg-saffron text-white"
                >
                  <LayoutDashboard size={15} /> All Posts
                </button>
              </div>

              <PostsTable
                posts={posts}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
              />
            </motion.div>
          )}

          {(mode === 'create' || mode === 'edit') && (
            <motion.div
              key={mode === 'create' ? 'create' : 'edit'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="bg-white border border-gold/20 rounded-xl p-6 lg:p-8 shadow-warm">
                <h2 className="font-display font-bold text-xl text-indigo mb-6">
                  {mode === 'create' ? 'Create New Post' : 'Edit Post'}
                </h2>
                <PostEditor
                  editPost={editPost}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* View Post Dialog */}
      <Dialog open={!!viewPost} onOpenChange={() => setViewPost(null)}>
        <DialogContent className="bg-white border-gold/20 text-indigo max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            {viewPost?.imageData && (
              <img
                src={viewPost.imageData}
                alt={viewPost.title}
                className="w-full h-48 object-cover rounded-lg border border-gold/20 mb-4"
              />
            )}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-saffron/10 text-saffron border border-saffron/20">
                {viewPost?.category}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                  viewPost?.status === 'published'
                    ? 'bg-green/10 text-green border-green/20'
                    : 'bg-cream-dark text-charcoal-light border-gold/20'
                }`}
              >
                {viewPost?.status}
              </span>
              <span className="text-xs text-charcoal-light ml-auto">
                {viewPost?.language === 'hi' ? 'Hindi' : 'English'}
              </span>
            </div>
            <DialogTitle className="text-xl text-indigo">{viewPost?.title}</DialogTitle>
            <DialogDescription className="text-charcoal-light">
              by {viewPost?.author} &middot;{' '}
              {viewPost && new Date(viewPost.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}{' '}
              &middot; {viewPost?.viewCount.toLocaleString()} views
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <p className="text-indigo/80 italic bg-cream/50 p-4 rounded-lg border border-gold/15 text-sm leading-relaxed">
              {viewPost?.excerpt}
            </p>
            <div
              className="prose max-w-none text-indigo/70 leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-indigo [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-indigo [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1 [&_strong]:text-indigo"
              dangerouslySetInnerHTML={{ __html: viewPost?.content || '' }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
