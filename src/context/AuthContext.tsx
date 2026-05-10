import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'author' | 'user'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  createdAt: string
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  isAuthor: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<boolean>
  logout: () => void
  users: User[]
  deleteUser: (id: string) => void
  updateUserRole: (id: string, role: UserRole) => void
  activityLog: ActivityEntry[]
}

export interface ActivityEntry {
  id: string
  action: string
  user: string
  timestamp: string
  type: 'login' | 'register' | 'post' | 'role_change' | 'delete'
}

// ─── Demo Users ──────────────────────────────────────────────────────────────

const DEMO_USERS: User[] = [
  {
    id: '1',
    email: 'admin@yehmeraindia.com',
    name: 'Admin User',
    role: 'admin',
    avatar: '/indian-anchor-hero.png',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    email: 'author@yehmeraindia.com',
    name: 'Demo Author',
    role: 'author',
    avatar: '/anchor-hero.png',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    email: 'user@yehmeraindia.com',
    name: 'Demo User',
    role: 'user',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

const DEMO_PASSWORDS: Record<string, string> = {
  'admin@yehmeraindia.com': 'admin123',
  'author@yehmeraindia.com': 'author123',
  'user@yehmeraindia.com': 'user123',
}

// ─── Password Hashing (backend-ready: swap for bcrypt) ──────────────────────

function hashPassword(password: string): string {
  return btoa(password + '_ymi_salt_2024')
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

// ─── Storage Keys ────────────────────────────────────────────────────────────

const STORAGE_KEY_USERS = 'ymi_users'
const STORAGE_KEY_PASSWORDS = 'ymi_passwords'
const STORAGE_KEY_TOKEN = 'ymi_auth_token'
const STORAGE_KEY_LOG = 'ymi_activity_log'

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_USERS)
    if (stored) return JSON.parse(stored)
    return DEMO_USERS
  })
  const [passwords, setPasswords] = useState<Record<string, string>>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_PASSWORDS)
    if (stored) return JSON.parse(stored)
    const hashed: Record<string, string> = {}
    Object.entries(DEMO_PASSWORDS).forEach(([email, pwd]) => {
      hashed[email] = hashPassword(pwd)
    })
    return hashed
  })
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_LOG)
    if (stored) return JSON.parse(stored)
    return [
      {
        id: 'log-1',
        action: 'System initialized with demo accounts',
        user: 'System',
        timestamp: new Date().toISOString(),
        type: 'login',
      },
    ]
  })

  // Persist users & passwords
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users))
  }, [users])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PASSWORDS, JSON.stringify(passwords))
  }, [passwords])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LOG, JSON.stringify(activityLog))
  }, [activityLog])

  // Auto-login on page refresh
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN)
    if (token) {
      try {
        const payload = JSON.parse(atob(token))
        const found = users.find((u) => u.id === payload.userId)
        if (found) setUser(found)
      } catch {
        localStorage.removeItem(STORAGE_KEY_TOKEN)
      }
    }
  }, [users])

  const addActivity = useCallback(
    (action: string, userName: string, type: ActivityEntry['type']) => {
      const entry: ActivityEntry = {
        id: `log-${Date.now()}`,
        action,
        user: userName,
        timestamp: new Date().toISOString(),
        type,
      }
      setActivityLog((prev) => [entry, ...prev].slice(0, 100))
    },
    [],
  )

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      await new Promise((r) => setTimeout(r, 800)) // Simulate network

      const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
      if (!found) return false

      const hash = passwords[found.email]
      if (!hash || !verifyPassword(password, hash)) return false

      // JWT-style token (demo: simple object; backend-ready: real JWT)
      const tokenPayload = { userId: found.id, email: found.email, role: found.role }
      const token = btoa(JSON.stringify(tokenPayload))
      localStorage.setItem(STORAGE_KEY_TOKEN, token)

      setUser(found)
      addActivity(`User logged in`, found.name, 'login')
      return true
    },
    [users, passwords, addActivity],
  )

  const register = useCallback(
    async (name: string, email: string, password: string, role: UserRole = 'user'): Promise<boolean> => {
      await new Promise((r) => setTimeout(r, 600)) // Simulate network

      if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        return false
      }

      const newUser: User = {
        id: `user-${Date.now()}`,
        email: email.toLowerCase(),
        name,
        role,
        createdAt: new Date().toISOString(),
      }

      setUsers((prev) => [...prev, newUser])
      setPasswords((prev) => ({ ...prev, [newUser.email]: hashPassword(password) }))

      // Auto-login after registration
      const tokenPayload = { userId: newUser.id, email: newUser.email, role: newUser.role }
      const token = btoa(JSON.stringify(tokenPayload))
      localStorage.setItem(STORAGE_KEY_TOKEN, token)

      setUser(newUser)
      addActivity(`New account registered`, newUser.name, 'register')
      return true
    },
    [users, addActivity],
  )

  const logout = useCallback(() => {
    if (user) {
      addActivity(`User logged out`, user.name, 'login')
    }
    setUser(null)
    localStorage.removeItem(STORAGE_KEY_TOKEN)
  }, [user, addActivity])

  const deleteUser = useCallback(
    (id: string) => {
      setUsers((prev) => prev.filter((u) => u.id !== id))
      addActivity(`User deleted (ID: ${id})`, user?.name ?? 'Admin', 'delete')
    },
    [addActivity, user],
  )

  const updateUserRole = useCallback(
    (id: string, role: UserRole) => {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
      addActivity(`Role changed to ${role} (ID: ${id})`, user?.name ?? 'Admin', 'role_change')
    },
    [addActivity, user],
  )

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isAuthor: user?.role === 'author' || user?.role === 'admin',
    login,
    register,
    logout,
    users,
    deleteUser,
    updateUserRole,
    activityLog,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
