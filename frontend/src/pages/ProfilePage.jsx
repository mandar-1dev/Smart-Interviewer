import { useState } from 'react'
import { Navbar } from '../components/layout/Navbar'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import { User, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user } = useAuth()
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [show, setShow] = useState({ current: false, new: false })
  const [loading, setLoading] = useState(false)

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (form.new_password !== form.confirm) {
      toast.error('New passwords do not match')
      return
    }
    setLoading(true)
    try {
      await api.put('/auth/change-password', {
        current_password: form.current_password,
        new_password: form.new_password,
      })
      toast.success('Password changed successfully!')
      setForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-100 mb-6">Profile</h1>

        {/* User Info */}
        <div className="card mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-indigo-600/20 rounded-full flex items-center justify-center">
              <User className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-100">{user?.full_name}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-3 border-t border-gray-800">
            <span className={`badge text-xs ${user?.role === 'admin' ? 'text-amber-400 bg-amber-400/10' : 'text-indigo-400 bg-indigo-400/10'}`}>
              {user?.role}
            </span>
            <span className="badge text-xs text-green-400 bg-green-400/10 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Active
            </span>
          </div>
        </div>

        {/* Change Password */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <Lock className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-semibold text-gray-100">Change Password</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={show.current ? 'text' : 'password'}
                  className="input pr-10"
                  value={form.current_password}
                  onChange={(e) => setForm({ ...form, current_password: e.target.value })}
                  required
                />
                <button type="button" onClick={() => setShow({ ...show, current: !show.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {show.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={show.new ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  value={form.new_password}
                  onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                  required
                />
                <button type="button" onClick={() => setShow({ ...show, new: !show.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {show.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                className="input"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
