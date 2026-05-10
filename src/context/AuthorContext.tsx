import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

export interface AuthorPost {
  id: string
  title: string
  excerpt: string
  content: string
  category: string
  imageData?: string
  author: string
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
  viewCount: number
  language: 'en' | 'hi'
}

interface AuthorContextType {
  posts: AuthorPost[]
  addPost: (post: Omit<AuthorPost, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>) => void
  updatePost: (id: string, updates: Partial<AuthorPost>) => void
  deletePost: (id: string) => void
  getPost: (id: string) => AuthorPost | undefined
  getPublishedPosts: () => AuthorPost[]
}

const AuthorContext = createContext<AuthorContextType | null>(null)

const STORAGE_KEY = 'ymi-author-posts'

const SAMPLE_POSTS: AuthorPost[] = [
  {
    id: 'ymi-post-001',
    title: 'ISRO Successfully Launches Chandrayaan-4 Mission',
    excerpt: 'India\'s space agency ISRO has successfully launched the Chandrayaan-4 mission, marking another milestone in lunar exploration with advanced rover capabilities.',
    content: '<h2>Historic Launch</h2><p>ISRO has once again made the nation proud with the successful launch of Chandrayaan-4. The mission aims to explore the lunar south pole with advanced scientific instruments.</p><h2>Key Objectives</h2><ul><li>Deploy next-generation rover for surface exploration</li><li>Analyze lunar soil samples for water ice deposits</li><li>Test in-situ resource utilization technologies</li></ul><p>The mission is expected to yield groundbreaking results for India\'s space program.</p>',
    category: 'Science',
    author: 'Priya Sharma',
    status: 'published',
    createdAt: '2025-04-15T08:30:00Z',
    updatedAt: '2025-04-15T10:00:00Z',
    viewCount: 12453,
    language: 'en',
  },
  {
    id: 'ymi-post-002',
    title: 'Delhi Elections 2025: Key Candidates and Predictions',
    excerpt: 'As Delhi gears up for the 2025 state elections, all eyes are on the key candidates and what the latest opinion polls suggest about the political landscape.',
    content: '<h2>Election Overview</h2><p>The Delhi state elections are poised to be a critical battleground. With major parties fielding their strongest candidates, voters are weighing their options carefully.</p><h2>What Polls Say</h2><p>Recent opinion polls indicate a tightly contested race, with issues like education, healthcare, and infrastructure dominating voter concerns.</p>',
    category: 'Politics',
    author: 'Ravi Kumar',
    status: 'published',
    createdAt: '2025-04-20T06:00:00Z',
    updatedAt: '2025-04-20T14:30:00Z',
    viewCount: 8921,
    language: 'en',
  },
  {
    id: 'ymi-post-003',
    title: 'Indian Cricket Team Announces Squad for World Cup',
    excerpt: 'BCCI has announced the 15-member squad for the upcoming ICC World Cup, with a mix of experienced veterans and exciting young talent.',
    content: '<h2>Squad Announcement</h2><p>The Board of Control for Cricket in India (BCCI) has revealed the squad that will represent the nation at the ICC World Cup. The selection committee has opted for a balanced team composition.</p><h2>Key Selections</h2><ul><li>Return of senior players from injury</li><li>Debut call-ups for top performers from domestic cricket</li><li>Specialist spinners included for subcontinent conditions</li></ul>',
    category: 'Sports',
    author: 'Arjun Patel',
    status: 'published',
    createdAt: '2025-04-28T09:00:00Z',
    updatedAt: '2025-04-28T11:15:00Z',
    viewCount: 15678,
    language: 'en',
  },
  {
    id: 'ymi-post-004',
    title: 'AI Revolution in Indian Healthcare: Startups Leading the Way',
    excerpt: 'A deep dive into how artificial intelligence is transforming healthcare delivery across India, from rural diagnostics to urban hospital management.',
    content: '<h2>The AI Healthcare Boom</h2><p>India is witnessing a surge in AI-powered healthcare startups. These companies are leveraging machine learning to address challenges unique to the Indian healthcare system.</p><h2>Key Innovations</h2><ul><li>AI-powered radiology for early disease detection</li><li>Telemedicine platforms connecting rural patients with specialists</li><li>Predictive analytics for epidemic management</li></ul>',
    category: 'Technology',
    author: 'Neha Gupta',
    status: 'draft',
    createdAt: '2025-05-01T12:00:00Z',
    updatedAt: '2025-05-01T16:45:00Z',
    viewCount: 0,
    language: 'en',
  },
  {
    id: 'ymi-post-005',
    title: 'Budget 2025: Tax Reforms and Economic Growth Projections',
    excerpt: 'Finance Minister outlines key tax reforms and GDP growth projections in the Union Budget, with focus on infrastructure and manufacturing sectors.',
    content: '<h2>Budget Highlights</h2><p>The Union Budget 2025 introduces significant tax reforms aimed at boosting the middle class and stimulating economic growth. Key announcements include revised tax slabs and increased infrastructure allocation.</p><h2>Sectoral Impact</h2><p>Manufacturing, IT, and agriculture sectors are set to receive major boosts through targeted policy measures and funding allocations.</p>',
    category: 'Business',
    author: 'Vikram Mehta',
    status: 'published',
    createdAt: '2025-02-01T05:00:00Z',
    updatedAt: '2025-02-01T08:00:00Z',
    viewCount: 22104,
    language: 'en',
  },
]

function loadPosts(): AuthorPost[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as AuthorPost[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // ignore parse errors
  }
  return SAMPLE_POSTS
}

function savePosts(posts: AuthorPost[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
  } catch {
    // ignore storage errors
  }
}

export function AuthorProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<AuthorPost[]>(loadPosts)

  useEffect(() => {
    savePosts(posts)
  }, [posts])

  const addPost = useCallback(
    (post: Omit<AuthorPost, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>) => {
      const now = new Date().toISOString()
      const newPost: AuthorPost = {
        ...post,
        id: `ymi-post-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        viewCount: 0,
      }
      setPosts((prev) => [newPost, ...prev])
    },
    []
  )

  const updatePost = useCallback((id: string, updates: Partial<AuthorPost>) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      )
    )
  }, [])

  const deletePost = useCallback((id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const getPost = useCallback(
    (id: string) => {
      return posts.find((p) => p.id === id)
    },
    [posts]
  )

  const getPublishedPosts = useCallback(() => {
    return posts.filter((p) => p.status === 'published')
  }, [posts])

  return (
    <AuthorContext.Provider
      value={{ posts, addPost, updatePost, deletePost, getPost, getPublishedPosts }}
    >
      {children}
    </AuthorContext.Provider>
  )
}

export function useAuthor() {
  const ctx = useContext(AuthorContext)
  if (!ctx) throw new Error('useAuthor must be used within an AuthorProvider')
  return ctx
}
