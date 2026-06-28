import { useState, useEffect } from 'react'
import { Navbar } from '../components/layout/Navbar'
import api from '../services/api'
import {
  Users, BookOpen, BarChart3, Plus, Pencil, Trash2,
  Loader2, Shield, X, Check,
} from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = [
  'Data Structures & Algorithms', 'Object-Oriented Programming', 'DBMS',
  'Operating Systems', 'Computer Networks', 'Python', 'Java', 'C++', 'Behavioral Interview',
]
const DIFFICULTIES = ['easy', 'medium', 'hard']

const TABS = [
  { id: 'stats', label: 'Overview', icon: BarChart3 },
  { id: 'questions', label: 'Questions', icon: BookOpen },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'sessions', label: 'Sessions', icon: BarChart3 },
]

const emptyQuestion = { title: '', content: '', category: CATEGORIES[0], difficulty: 'easy', sample_answer: '' }

export default function AdminPage() {
  const [tab, setTab] = useState('stats')
  const [stats, setStats] = useState(null)
  const [questions, setQuestions] = useState([])
  const [users, setUsers] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null) // null | 'add' | 'edit'
  const [editingQ, setEditingQ] = useState(null)
  const [qForm, setQForm] = useState(emptyQuestion)
  const [saving, setSaving] = useState(false)

  const load = async (t) => {
    setLoading(true)
    try {
      if (t === 'stats') {
        const r = await api.get('/admin/stats')
        setStats(r.data)
      } else if (t === 'questions') {
        const r = await api.get('/questions?limit=100')
        setQuestions(r.data)
      } else if (t === 'users') {
        const r = await api.get('/admin/users')
        setUsers(r.data)
      } else if (t === 'sessions') {
        const r = await api.get('/admin/sessions')
        setSessions(r.data)
      }
    } catch (e) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(tab) }, [tab])

  const openAdd = () => { setQForm(emptyQuestion); setEditingQ(null); setModal('add') }
  const openEdit = (q) => {
    setQForm({ title: q.title, content: q.content, category: q.category, difficulty: q.difficulty, sample_answer: q.sample_answer || '' })
    setEditingQ(q)
    setModal('edit')
  }

  const saveQuestion = async () => {
    if (!qForm.title.trim() || !qForm.content.trim()) {
      toast.error('Title and content are required')
      return
    }
    setSaving(true)
    try {
      if (modal === 'add') {
        await api.post('/questions', qForm)
        toast.success('Question added!')
      } else {
        await api.put(`/questions/${editingQ.id}`, qForm)
        toast.success('Question updated!')
      }
      setModal(null)
      load('questions')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const deleteQuestion = async (id) => {
    if (!confirm('Delete this question?')) return
    try {
      await api.delete(`/questions/${id}`)
      toast.success('Deleted')
      setQuestions((prev) => prev.filter((q) => q.id !== id))
    } catch {
      toast.error('Failed to delete')
    }
  }

  const deactivateUser = async (id) => {
    if (!confirm('Deactivate this user?')) return
    try {
      await api.put(`/admin/users/${id}/deactivate`)
      toast.success('User deactivated')
      load('users')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed')
    }
  }

  const DIFF_COLOR = {
    easy: 'text-green-400 bg-green-400/10',
    medium: 'text-yellow-400 bg-yellow-400/10',
    hard: 'text-red-400 bg-red-400/10',
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-bold text-gray-100">Admin Panel</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats Tab */}
            {tab === 'stats' && stats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: stats.total_users, color: 'text-indigo-400' },
                  { label: 'Total Sessions', value: stats.total_sessions, color: 'text-blue-400' },
                  { label: 'Completed Sessions', value: stats.completed_sessions, color: 'text-green-400' },
                  { label: 'Platform Avg Score', value: `${stats.platform_average_score}/10`, color: 'text-yellow-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="card">
                    <p className={`text-3xl font-bold ${color} mb-1`}>{value}</p>
                    <p className="text-sm text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Questions Tab */}
            {tab === 'questions' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-gray-400">{questions.length} questions</p>
                  <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 text-sm">
                    <Plus className="w-4 h-4" /> Add Question
                  </button>
                </div>
                <div className="space-y-2">
                  {questions.map((q) => (
                    <div key={q.id} className="card flex items-start justify-between gap-4 py-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-100 truncate">{q.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{q.category}</span>
                          <span className={`badge text-xs ${DIFF_COLOR[q.difficulty]}`}>{q.difficulty}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => openEdit(q)} className="p-1.5 text-gray-400 hover:text-indigo-400 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteQuestion(q.id)} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {tab === 'users' && (
              <div className="space-y-2">
                {users.map((u) => (
                  <div key={u.id} className="card flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium text-gray-100">{u.full_name}</p>
                      <p className="text-sm text-gray-400">{u.email}</p>
                      <div className="flex gap-2 mt-1">
                        <span className={`badge text-xs ${u.role === 'admin' ? 'text-amber-400 bg-amber-400/10' : 'text-indigo-400 bg-indigo-400/10'}`}>
                          {u.role}
                        </span>
                        <span className={`badge text-xs ${u.is_active ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    {u.is_active && u.role !== 'admin' && (
                      <button
                        onClick={() => deactivateUser(u.id)}
                        className="text-xs text-red-400 hover:text-red-300 border border-red-400/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Sessions Tab */}
            {tab === 'sessions' && (
              <div className="space-y-2">
                {sessions.map((s) => (
                  <div key={s.id} className="card flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium text-gray-100">{s.category}</p>
                      <div className="flex gap-2 mt-1">
                        <span className={`badge text-xs ${DIFF_COLOR[s.difficulty]}`}>{s.difficulty}</span>
                        <span className="text-xs text-gray-500">User #{s.user_id}</span>
                        <span className="text-xs text-gray-600">
                          {new Date(s.started_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${s.average_score >= 7 ? 'text-green-400' : s.average_score >= 4 ? 'text-yellow-400' : s.average_score ? 'text-red-400' : 'text-gray-500'}`}>
                        {s.average_score != null ? `${s.average_score.toFixed(1)}/10` : '—'}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{s.status.replace('_', ' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Question Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setModal(null)}>
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-100">
                {modal === 'add' ? 'Add Question' : 'Edit Question'}
              </h2>
              <button onClick={() => setModal(null)} className="text-gray-500 hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Title</label>
                <input className="input" value={qForm.title} onChange={(e) => setQForm({ ...qForm, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Question Content</label>
                <textarea
                  className="input min-h-[100px] resize-none"
                  value={qForm.content}
                  onChange={(e) => setQForm({ ...qForm, content: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Category</label>
                  <select className="input" value={qForm.category} onChange={(e) => setQForm({ ...qForm, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Difficulty</label>
                  <select className="input" value={qForm.difficulty} onChange={(e) => setQForm({ ...qForm, difficulty: e.target.value })}>
                    {DIFFICULTIES.map((d) => <option key={d} value={d} className="capitalize">{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Sample Answer (optional)</label>
                <textarea
                  className="input min-h-[80px] resize-none text-sm"
                  value={qForm.sample_answer}
                  onChange={(e) => setQForm({ ...qForm, sample_answer: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={saveQuestion} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
