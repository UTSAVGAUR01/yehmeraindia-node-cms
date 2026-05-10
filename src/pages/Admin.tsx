import { useState, useMemo } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Users,
  PenTool,
  FileText,
  Eye,
  ChevronUp,
  ChevronDown,
  Trash2,
  ShieldCheck,
  UserCheck,
  Clock,
  LogIn,
  UserPlus,
  Award,
  BarChart3,
  Activity,
  ArrowLeft,
  Crown,
  User,
} from 'lucide-react'
import { useAuth, type UserRole } from '@/context/AuthContext'
import type { User as UserType } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function roleIcon(role: UserRole) {
  switch (role) {
    case 'admin': return <Crown size={14} />
    case 'author': return <PenTool size={14} />
    default: return <User size={14} />
  }
}

function roleColor(role: UserRole): { bg: string; text: string; border: string } {
  switch (role) {
    case 'admin': return { bg: 'rgba(232,93,4,0.1)', text: '#E85D04', border: 'rgba(232,93,4,0.3)' }
    case 'author': return { bg: 'rgba(29,53,87,0.1)', text: '#1D3557', border: 'rgba(29,53,87,0.3)' }
    default: return { bg: 'rgba(45,106,79,0.1)', text: '#2D6A4F', border: 'rgba(45,106,79,0.3)' }
  }
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  title, value, icon, color, delay,
}: {
  title: string; value: string | number; icon: React.ReactNode; color: string; delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
      style={{ borderColor: '#E5E7EB' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: '#6B7280' }}>{title}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#2B2D42' }}>{value}</p>
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Admin Page ─────────────────────────────────────────────────────────

export default function Admin() {
  const { users, activityLog, deleteUser, updateUserRole, user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [userSort, setUserSort] = useState<{ key: 'name' | 'role' | 'createdAt'; asc: boolean }>({
    key: 'createdAt',
    asc: false,
  })

  // Computed stats
  const totalUsers = users.length
  const totalAuthors = users.filter((u) => u.role === 'author').length
  
  // Demo posts data
  const posts = useMemo(() => {
    const titles = [
      'Farmers Protest Enters Day 45 at Delhi Borders',
      'ISRO Successfully Launches Chandrayaan-4 Mission',
      'Bollywood Blockbuster Breaks All Records',
      'Supreme Court Ruling on Digital Privacy',
      'Startup India: Unicorn Valuations Soar',
      'IPL 2025: New Champions Crowned',
      'Ayushman Bharat Expansion Announced',
      'Make in India: Manufacturing Boom',
      'Diwali Celebrations Across the Nation',
      'Tech Giants Invest $10B in India',
    ]
    return titles.map((title, i) => ({
      id: `post-${i + 1}`,
      title,
      author: users[i % users.length]?.name ?? 'Unknown',
      views: Math.floor(Math.random() * 50000) + 1000,
      status: i < 7 ? 'published' : 'pending',
      date: new Date(Date.now() - i * 86400000).toISOString(),
    }))
  }, [users])

  const totalPosts = posts.length
  const totalViews = posts.reduce((acc, p) => acc + p.views, 0)

  // Sorted users
  const sortedUsers = useMemo(() => {
    const sorted = [...users].sort((a, b) => {
      const aVal = a[userSort.key]
      const bVal = b[userSort.key]
      if (aVal < bVal) return userSort.asc ? -1 : 1
      if (aVal > bVal) return userSort.asc ? 1 : -1
      return 0
    })
    return sorted
  }, [users, userSort])

  // Analytics: views per day (CSS bar chart)
  const analyticsDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const analyticsViews = [12400, 18900, 15600, 22100, 19800, 28700, 24500]
  const maxViews = Math.max(...analyticsViews)

  const toggleSort = (key: 'name' | 'role' | 'createdAt') => {
    setUserSort((prev) => ({
      key,
      asc: prev.key === key ? !prev.asc : true,
    }))
  }

  const SortIcon = ({ col }: { col: 'name' | 'role' | 'createdAt' }) => {
    if (userSort.key !== col) return <span className="opacity-20"><ChevronUp size={12} /></span>
    return userSort.asc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
  }

  const handlePromote = (u: UserType) => {
    const newRole: UserRole = u.role === 'user' ? 'author' : 'admin'
    updateUserRole(u.id, newRole)
    toast.success(`Promoted ${u.name} to ${newRole}`)
  }

  const handleDemote = (u: UserType) => {
    const newRole: UserRole = u.role === 'admin' ? 'author' : 'user'
    updateUserRole(u.id, newRole)
    toast.success(`Demoted ${u.name} to ${newRole}`)
  }

  const handleDelete = (u: UserType) => {
    if (u.id === currentUser?.id) {
      toast.error('Cannot delete yourself!')
      return
    }
    deleteUser(u.id)
    toast.success(`Deleted user ${u.name}`)
  }

  return (
    <div className="min-h-[100dvh] pt-16" style={{ backgroundColor: '#FFF8F0' }}>
      {/* Warli pattern overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'url(/pattern-warli.png)',
          backgroundSize: '200px',
          backgroundRepeat: 'repeat',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="flex items-center gap-1 text-sm font-medium hover:underline"
                style={{ color: '#6B7280' }}
              >
                <ArrowLeft size={16} /> Home
              </Link>
              <span style={{ color: '#D1D5DB' }}>/</span>
              <span className="text-sm font-medium" style={{ color: '#2B2D42' }}>Admin Dashboard</span>
            </div>
            <h1 className="text-3xl font-bold mt-2" style={{ color: '#2B2D42' }}>
              Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
              Manage users, authors, and monitor platform activity.
            </p>
          </div>
          <Badge
            variant="outline"
            className="w-fit gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full"
            style={{ borderColor: 'rgba(232,93,4,0.3)', color: '#E85D04', backgroundColor: 'rgba(232,93,4,0.08)' }}
          >
            <ShieldCheck size={14} />
            Admin Access
          </Badge>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Users" value={totalUsers} icon={<Users size={20} />} color="#1D3557" delay={0} />
          <StatCard title="Total Authors" value={totalAuthors} icon={<PenTool size={20} />} color="#E85D04" delay={0.1} />
          <StatCard title="Total Posts" value={totalPosts} icon={<FileText size={20} />} color="#2D6A4F" delay={0.2} />
          <StatCard title="Total Views" value={totalViews.toLocaleString('en-IN')} icon={<Eye size={20} />} color="#BC4749" delay={0.3} />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6" style={{ backgroundColor: '#F3F4F6' }}>
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'posts', label: 'Posts', icon: FileText },
              { id: 'activity', label: 'Activity Log', icon: Activity },
            ].map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="gap-1.5 data-[state=active]:bg-white"
                style={{ color: '#6B7280' }}
              >
                <t.icon size={14} />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Analytics Bar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border bg-white p-6 shadow-sm"
              style={{ borderColor: '#E5E7EB' }}
            >
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 size={18} style={{ color: '#E85D04' }} />
                <h2 className="text-lg font-semibold" style={{ color: '#2B2D42' }}>
                  Views — Last 7 Days
                </h2>
              </div>

              <div className="flex items-end gap-3 h-48">
                {analyticsDays.map((day, i) => {
                  const height = (analyticsViews[i] / maxViews) * 100
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs font-medium" style={{ color: '#6B7280' }}>
                        {(analyticsViews[i] / 1000).toFixed(1)}k
                      </span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: 0.2 + i * 0.08, duration: 0.5, ease: 'easeOut' }}
                        className="w-full rounded-t-md relative group cursor-pointer"
                        style={{
                          backgroundColor: i === analyticsDays.length - 1 ? '#E85D04' : '#1D3557',
                          opacity: i === analyticsDays.length - 1 ? 1 : 0.7 + (i * 0.05),
                        }}
                      >
                        <div
                          className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
                          style={{ backgroundColor: '#2B2D42' }}
                        >
                          {analyticsViews[i].toLocaleString('en-IN')} views
                        </div>
                      </motion.div>
                      <span className="text-xs font-medium" style={{ color: '#6B7280' }}>{day}</span>
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* Quick Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border bg-white p-6 shadow-sm"
              style={{ borderColor: '#E5E7EB' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Activity size={18} style={{ color: '#2D6A4F' }} />
                <h2 className="text-lg font-semibold" style={{ color: '#2B2D42' }}>Recent Activity</h2>
              </div>
              <div className="space-y-3">
                {activityLog.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: '#F9FAFB' }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: log.type === 'login' ? 'rgba(232,93,4,0.1)' :
                          log.type === 'register' ? 'rgba(45,106,79,0.1)' :
                          log.type === 'delete' ? 'rgba(188,71,73,0.1)' :
                          'rgba(29,53,87,0.1)',
                        color: log.type === 'login' ? '#E85D04' :
                          log.type === 'register' ? '#2D6A4F' :
                          log.type === 'delete' ? '#BC4749' : '#1D3557',
                      }}
                    >
                      {log.type === 'login' && <LogIn size={14} />}
                      {log.type === 'register' && <UserPlus size={14} />}
                      {log.type === 'delete' && <Trash2 size={14} />}
                      {log.type === 'role_change' && <Award size={14} />}
                      {log.type === 'post' && <FileText size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#2B2D42' }}>{log.action}</p>
                      <p className="text-xs" style={{ color: '#6B7280' }}>by {log.user}</p>
                    </div>
                    <span className="text-xs shrink-0" style={{ color: '#9CA3AF' }}>{timeAgo(log.timestamp)}</span>
                  </div>
                ))}
                {activityLog.length === 0 && (
                  <p className="text-sm text-center py-4" style={{ color: '#9CA3AF' }}>No activity yet</p>
                )}
              </div>
            </motion.div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border bg-white shadow-sm overflow-hidden"
              style={{ borderColor: '#E5E7EB' }}
            >
              <div className="p-6 border-b" style={{ borderColor: '#F3F4F6' }}>
                <div className="flex items-center gap-2">
                  <Users size={18} style={{ color: '#1D3557' }} />
                  <h2 className="text-lg font-semibold" style={{ color: '#2B2D42' }}>All Users</h2>
                  <Badge variant="secondary" className="ml-2 text-xs" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
                    {totalUsers}
                  </Badge>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow style={{ borderColor: '#F3F4F6' }}>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('name')} style={{ color: '#6B7280' }}>
                        <span className="flex items-center gap-1">Name <SortIcon col="name" /></span>
                      </TableHead>
                      <TableHead style={{ color: '#6B7280' }}>Email</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('role')} style={{ color: '#6B7280' }}>
                        <span className="flex items-center gap-1">Role <SortIcon col="role" /></span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('createdAt')} style={{ color: '#6B7280' }}>
                        <span className="flex items-center gap-1">Joined <SortIcon col="createdAt" /></span>
                      </TableHead>
                      <TableHead className="text-right" style={{ color: '#6B7280' }}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUsers.map((u) => {
                      const rc = roleColor(u.role)
                      return (
                        <TableRow key={u.id} style={{ borderColor: '#F3F4F6' }}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {u.avatar ? (
                                <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                  style={{ backgroundColor: rc.bg, color: rc.text }}
                                >
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="font-medium text-sm" style={{ color: '#2B2D42' }}>{u.name}</span>
                              {u.id === currentUser?.id && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ borderColor: '#D1D5DB', color: '#9CA3AF' }}>
                                  You
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm" style={{ color: '#4B5563' }}>{u.email}</TableCell>
                          <TableCell>
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border"
                              style={{ backgroundColor: rc.bg, color: rc.text, borderColor: rc.border }}
                            >
                              {roleIcon(u.role)}
                              {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm" style={{ color: '#6B7280' }}>{formatDate(u.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              {u.role !== 'admin' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 rounded-lg"
                                  onClick={() => handlePromote(u)}
                                  title="Promote"
                                >
                                  <ChevronUp size={16} style={{ color: '#2D6A4F' }} />
                                </Button>
                              )}
                              {u.role !== 'user' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 rounded-lg"
                                  onClick={() => handleDemote(u)}
                                  title="Demote"
                                >
                                  <ChevronDown size={16} style={{ color: '#E85D04' }} />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-lg hover:bg-red-50"
                                onClick={() => handleDelete(u)}
                                title="Delete"
                              >
                                <Trash2 size={16} style={{ color: '#BC4749' }} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border bg-white shadow-sm overflow-hidden"
              style={{ borderColor: '#E5E7EB' }}
            >
              <div className="p-6 border-b" style={{ borderColor: '#F3F4F6' }}>
                <div className="flex items-center gap-2">
                  <FileText size={18} style={{ color: '#2D6A4F' }} />
                  <h2 className="text-lg font-semibold" style={{ color: '#2B2D42' }}>Posts Overview</h2>
                  <Badge variant="secondary" className="ml-2 text-xs" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
                    {totalPosts}
                  </Badge>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow style={{ borderColor: '#F3F4F6' }}>
                      <TableHead style={{ color: '#6B7280' }}>Title</TableHead>
                      <TableHead style={{ color: '#6B7280' }}>Author</TableHead>
                      <TableHead style={{ color: '#6B7280' }}>Views</TableHead>
                      <TableHead style={{ color: '#6B7280' }}>Status</TableHead>
                      <TableHead style={{ color: '#6B7280' }}>Date</TableHead>
                      <TableHead className="text-right" style={{ color: '#6B7280' }}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id} style={{ borderColor: '#F3F4F6' }}>
                        <TableCell>
                          <span className="text-sm font-medium line-clamp-1 max-w-[300px]" style={{ color: '#2B2D42' }}>
                            {post.title}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm" style={{ color: '#4B5563' }}>{post.author}</TableCell>
                        <TableCell className="text-sm font-medium" style={{ color: '#1D3557' }}>
                          {post.views.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: post.status === 'published' ? 'rgba(45,106,79,0.1)' : 'rgba(232,93,4,0.1)',
                              color: post.status === 'published' ? '#2D6A4F' : '#E85D04',
                            }}
                          >
                            {post.status === 'published' ? <ShieldCheck size={12} /> : <Clock size={12} />}
                            {post.status === 'published' ? 'Published' : 'Pending'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm" style={{ color: '#6B7280' }}>{formatDate(post.date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="size-8 rounded-lg" title="Approve">
                              <UserCheck size={16} style={{ color: '#2D6A4F' }} />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-red-50" title="Delete">
                              <Trash2 size={16} style={{ color: '#BC4749' }} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border bg-white shadow-sm overflow-hidden"
              style={{ borderColor: '#E5E7EB' }}
            >
              <div className="p-6 border-b" style={{ borderColor: '#F3F4F6' }}>
                <div className="flex items-center gap-2">
                  <Activity size={18} style={{ color: '#BC4749' }} />
                  <h2 className="text-lg font-semibold" style={{ color: '#2B2D42' }}>Activity Log</h2>
                  <Badge variant="secondary" className="ml-2 text-xs" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
                    {activityLog.length}
                  </Badge>
                </div>
              </div>

              <div className="divide-y" style={{ borderColor: '#F3F4F6' }}>
                {activityLog.map((log, i) => {
                  const typeColors: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
                    login: { icon: <LogIn size={14} />, bg: 'rgba(232,93,4,0.08)', color: '#E85D04' },
                    register: { icon: <UserPlus size={14} />, bg: 'rgba(45,106,79,0.08)', color: '#2D6A4F' },
                    post: { icon: <FileText size={14} />, bg: 'rgba(29,53,87,0.08)', color: '#1D3557' },
                    role_change: { icon: <Award size={14} />, bg: 'rgba(232,93,4,0.08)', color: '#E85D04' },
                    delete: { icon: <Trash2 size={14} />, bg: 'rgba(188,71,73,0.08)', color: '#BC4749' },
                  }
                  const tc = typeColors[log.type] || typeColors.login

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: tc.bg, color: tc.color }}
                      >
                        {tc.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: '#2B2D42' }}>{log.action}</p>
                        <p className="text-xs" style={{ color: '#6B7280' }}>by {log.user}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>{timeAgo(log.timestamp)}</p>
                        <p className="text-[10px]" style={{ color: '#D1D5DB' }}>{formatDate(log.timestamp)}</p>
                      </div>
                    </motion.div>
                  )
                })}
                {activityLog.length === 0 && (
                  <p className="text-sm text-center py-8" style={{ color: '#9CA3AF' }}>No activity recorded</p>
                )}
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
