import { useAuth } from '../../hooks/useAuth'
import { Navigate } from 'react-router-dom'

export function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()

  // Show nothing while auto-login is in progress
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  // Admin check
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  // Everyone (including guest) can access — no login redirect
  return children
}
