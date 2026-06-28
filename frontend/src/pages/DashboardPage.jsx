import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Navbar } from '../components/layout/Navbar'
import api from '../services/api'
import {
  BrainCircuit, PlayCircle, Trophy, Target,
  BookOpen, ChevronRight, TrendingUp,
} from 'lucide-react'

const CATEGORIES = [
  'Data Structures & Algorithms',
  'Object-Oriented Programming',
  'DBMS',
  'Operating Systems',
  'Computer Networks',
  'Python',
  'Java',
  'C++',
  'Behavioral Interview',
]

const DIFFICULTIES = ['easy', 'medium', 'hard']

const DIFF_COLOR = {
  easy: 'text-green-400 bg-green-400/10',
  medium: 'text-yellow-400 bg-yellow-400/10',
  hard: 'text-red-400 bg-red-400/10',
}

const STATUS_COLOR = {
  completed: 'text-green-400 bg-green-400/10',
  in_progress: 'text-blue-400 bg-blue-400/10',
  abandoned: 'text-gray-400 bg-gray-400/10',
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showStartModal, setShowStartModal] = useState(false)
  const [newSession, setNewSession] = useState({ category: CATEGORIES[0], difficulty: 'medium' })
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    api.get('/dashboard/stats').then((r) => setStats(r.data)).finally(() => setLoading(false))
  }, [])

  const handleStartInterview = async () => {
    setStarting(true)
    try {
      const res = await api.post('/sessions', newSession)
      navigate(`/interview/${res.data.id}`)
    } catch {
      setStarting(false)
    }
  }

  const scoreColor = (score) => {
    if (!score) return 'text-gray-400'
    if (score >= 7) return 'text-green-400'
    if (score >= 4) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Interview Practice</h1>
            <p className="text-gray-400 mt-1">Select a category and start practicing</p>
          </div>
          <button onClick={() => setShowStartModal(true)} className="btn-primary flex items-center gap-2">
            <PlayCircle className="w-4 h-4" />
            Start Interview
          </button>
        </div>

        {/* Stats Cards */}
        {!loading && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Sessions', value: stats.total_sessions, icon: BookOpen, color: 'text-indigo-400' },
              { label: 'Completed', value: stats.completed_sessions, icon: Trophy, color: 'text-green-400' },
              { label: 'Avg Score', value: stats.average_score ? `${stats.average_score}/10` : '—', icon: Target, color: 'text-yellow-400' },
              { label: 'Answers Given', value: stats.total_answers, icon: TrendingUp, color: 'text-blue-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-800">
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-100">{value}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Category Quick Start Cards */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-gray-300 mb-4">Quick Start by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setNewSession({ category: cat, difficulty: 'medium' })
                  setShowStartModal(true)
                }}
                className="card text-left hover:border-indigo-600 hover:bg-indigo-950/20 transition-all group cursor-pointer p-4"
              >
                <BrainCircuit className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-gray-200">{cat}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-100">Recent Sessions</h2>
            <Link to="/history" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : stats?.recent_sessions?.length ? (
            <div className="space-y-3">
              {stats.recent_sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => navigate(`/report/${s.id}`)}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-750 cursor-pointer transition-colors border border-gray-700 hover:border-gray-600"
                >
                  <div className="flex items-center gap-3">
                    <BrainCircuit className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-200">{s.category}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`badge text-xs ${DIFF_COLOR[s.difficulty]}`}>{s.difficulty}</span>
                        <span className={`badge text-xs ${STATUS_COLOR[s.status]}`}>
                          {s.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {s.average_score != null ? (
                      <p className={`text-lg font-bold ${scoreColor(s.average_score)}`}>
                        {s.average_score.toFixed(1)}
                        <span className="text-xs text-gray-500 font-normal">/10</span>
                      </p>
                    ) : (
                      <span className="text-sm text-gray-500">In progress</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BrainCircuit className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400">No sessions yet. Start your first interview!</p>
              <button
                onClick={() => setShowStartModal(true)}
                className="btn-primary mt-4 inline-flex items-center gap-2"
              >
                <PlayCircle className="w-4 h-4" /> Start Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Start Interview Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          onClick={() => setShowStartModal(false)}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-100 mb-5">Configure Interview</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Category</label>
                <select
                  className="input"
                  value={newSession.category}
                  onChange={(e) => setNewSession({ ...newSession, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Difficulty</label>
                <div className="flex gap-3">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      onClick={() => setNewSession({ ...newSession, difficulty: d })}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium capitalize transition-all ${
                        newSession.difficulty === d
                          ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                          : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-500">
                You'll answer 5 questions. Each answer is evaluated by AI in real time.
              </p>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowStartModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button onClick={handleStartInterview} disabled={starting} className="btn-primary flex-1">
                  {starting ? 'Starting…' : 'Start Interview'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
