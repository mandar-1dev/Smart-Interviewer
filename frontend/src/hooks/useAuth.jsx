import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  // On app load — auto login as guest if no user session exists
  useEffect(() => {
    const autoLogin = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        try {
          const res = await api.post('/auth/guest-login')
          const { access_token, user: userData } = res.data
          localStorage.setItem('token', access_token)
          localStorage.setItem('user', JSON.stringify(userData))
          setUser(userData)
        } catch (err) {
          console.error('Guest auto-login failed:', err)
        }
      }
      setLoading(false)
    }
    autoLogin()
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { access_token, user: userData } = res.data
    localStorage.setItem('token', access_token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const register = async (full_name, email, password) => {
    const res = await api.post('/auth/register', { full_name, email, password })
    return res.data
  }

  const logout = async () => {
    // On logout, re-login as guest automatically
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    try {
      const res = await api.post('/auth/guest-login')
      const { access_token, user: userData } = res.data
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
    } catch {
      setUser(null)
    }
  }

  const isAdmin = user?.role === 'admin'
  const isGuest = user?.email === 'guest@interviewai.com'

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, isGuest }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
