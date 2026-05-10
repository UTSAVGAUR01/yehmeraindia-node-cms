import { Navigate, useLocation } from 'react-router'
import { useAuth, type UserRole } from '@/context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isAuthor } = useAuth()
  const location = useLocation()

  // Not authenticated → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // Role check:
  // - admin required → only admins
  // - author required → authors AND admins both pass
  // - no requiredRole → any authenticated user
  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/" replace />
  }

  if (requiredRole === 'author' && !isAuthor) {
    return <Navigate to="/" replace />
  }

  // Role guard passed
  return <>{children}</>
}
