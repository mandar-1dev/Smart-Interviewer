import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import api from '../services/api'
import { BrainCircuit, Loader2, ArrowLeft, ChevronRight } from 'lucide-react'

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

export default function HistoryPage() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const LIMIT = 15

  const fetchSessions = async (p = 0) => {
    setLoading(true)
    try {
      const res = await api.get(`/sessions?skip=${p * LIMIT}&limit=${LIMIT}`)
      if (p === 0) setSessions(res.data)
      else setSessions((prev) => [...prev, ...res.data])
      setHasMore(res.data.length === LIMIT)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSessions(0) }, [])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchSessions(next)
  }

  const scoreColor = (score) => {
    if (!score) return 'text-gray-500'
    if (score >= 7) return 'text-green-400'
    if (score >= 4) return 'text-yellow-400'
    return 'text-red-400'
  }

  const formatDate = (dt) =>
    new Date(dt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </button>

        <h1 className="text-2xl font-bold text-gray-100 mb-6">Interview History</h1>

        {loading && sessions.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="card text-center py-16">
            <BrainCircuit className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400">No interview sessions yet.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => navigate(`/report/${s.id}`)}
                  className="card flex items-center justify-between cursor-pointer hover:border-gray-600 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center shrink-0">
                      <BrainCircuit className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-100">{s.category}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`badge text-xs ${DIFF_COLOR[s.difficulty]}`}>{s.difficulty}</span>
                        <span className={`badge text-xs ${STATUS_COLOR[s.status]}`}>
                          {s.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-600">{formatDate(s.started_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {s.average_score != null ? (
                        <p className={`text-lg font-bold ${scoreColor(s.average_score)}`}>
                          {s.average_score.toFixed(1)}
                          <span className="text-xs text-gray-500 font-normal">/10</span>
                        </p>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                      <p className="text-xs text-gray-600">{s.completed_questions}/{s.total_questions} Qs</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-6">
                <button onClick={loadMore} disabled={loading} className="btn-secondary">
                  {loading ? 'Loading…' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
