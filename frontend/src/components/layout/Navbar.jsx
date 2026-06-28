import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { BrainCircuit, LayoutDashboard, Shield, History, User } from 'lucide-react'

export function Navbar() {
  const { user, isAdmin, isGuest } = useAuth()

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2 text-indigo-400 font-bold text-lg">
            <BrainCircuit className="w-6 h-6" />
            InterviewAI
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-100 transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>

            <Link to="/history" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-100 transition-colors">
              <History className="w-4 h-4" />
              History
            </Link>

            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors">
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}

            {user && (
              <div className="flex items-center gap-2 pl-4 border-l border-gray-700">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-400">
                  {isGuest ? 'Guest' : user.full_name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
