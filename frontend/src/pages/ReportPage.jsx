import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import api from '../services/api'
import {
  Trophy, Star, ChevronDown, ChevronUp,
  BrainCircuit, Loader2, ArrowLeft, Target,
} from 'lucide-react'

const DIFF_COLOR = {
  easy: 'text-green-400 bg-green-400/10',
  medium: 'text-yellow-400 bg-yellow-400/10',
  hard: 'text-red-400 bg-red-400/10',
}

function ScoreRing({ score }) {
  const color = score >= 7 ? '#22c55e' : score >= 4 ? '#eab308' : '#ef4444'
  const pct = (score / 10) * 100
  const r = 36
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
      <circle cx="44" cy="44" r={r} strokeWidth="8" stroke="#1f2937" fill="none" />
      <circle
        cx="44" cy="44" r={r} strokeWidth="8" stroke={color} fill="none"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
    </svg>
  )
}

function AnswerCard({ answer, index }) {
  const [open, setOpen] = useState(index === 0)
  const fb = answer.feedback
  const scoreColor = !fb ? 'text-gray-400' : fb.score >= 7 ? 'text-green-400' : fb.score >= 4 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="card mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600/20 text-indigo-400 text-sm font-bold">
            {index + 1}
          </span>
          <div>
            <p className="font-medium text-gray-100">{answer.question?.title}</p>
            <span className={`badge text-xs ${DIFF_COLOR[answer.question?.difficulty]}`}>
              {answer.question?.difficulty}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {fb && (
            <span className={`text-xl font-bold ${scoreColor}`}>
              {fb.score.toFixed(1)}<span className="text-xs text-gray-500 font-normal">/10</span>
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </button>

      {open && fb && (
        <div className="mt-5 space-y-4 border-t border-gray-800 pt-5">
          {/* Your answer */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Your Answer</p>
            <p className="text-sm text-gray-300 bg-gray-800 rounded-lg p-3 font-mono leading-relaxed">
              {answer.answer_text}
            </p>
          </div>

          {/* Score bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Score</span><span className={scoreColor}>{fb.score.toFixed(1)} / 10</span>
            </div>
            <div className="bg-gray-800 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${fb.score >= 7 ? 'bg-green-500' : fb.score >= 4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${fb.score * 10}%` }}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Technical Accuracy</p>
              <p className="text-sm text-gray-300">{fb.technical_accuracy}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Communication</p>
              <p className="text-sm text-gray-300">{fb.communication_quality}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {fb.strengths?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-500 mb-1 uppercase tracking-wide">Strengths</p>
                <ul className="space-y-1">
                  {fb.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-gray-300 flex gap-2">
                      <span className="text-green-400 shrink-0">✓</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {fb.weaknesses?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-500 mb-1 uppercase tracking-wide">Weaknesses</p>
                <ul className="space-y-1">
                  {fb.weaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-gray-300 flex gap-2">
                      <span className="text-red-400 shrink-0">✗</span>{w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {fb.missing_concepts?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-yellow-500 mb-1.5 uppercase tracking-wide">Missing Concepts</p>
              <div className="flex flex-wrap gap-2">
                {fb.missing_concepts.map((c, i) => (
                  <span key={i} className="badge text-yellow-300 bg-yellow-400/10 border border-yellow-400/20">{c}</span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-lg p-3">
            <p className="text-xs font-medium text-indigo-400 mb-1.5 flex items-center gap-1">
              <Star className="w-3 h-3" /> Ideal Answer
            </p>
            <p className="text-sm text-gray-300 leading-relaxed">{fb.ideal_answer}</p>
          </div>

          {fb.topics_to_study?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Study These Topics</p>
              <div className="flex flex-wrap gap-2">
                {fb.topics_to_study.map((t, i) => (
                  <span key={i} className="badge text-indigo-300 bg-indigo-400/10 border border-indigo-400/20">{t}</span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Suggested Improvements</p>
            <p className="text-sm text-gray-400">{fb.suggested_improvements}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ReportPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/sessions/${sessionId}`)
      .then((r) => setSession(r.data))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      </div>
    )
  }

  if (!session) return null

  const avg = session.average_score
  const scoreColor = !avg ? 'text-gray-400' : avg >= 7 ? 'text-green-400' : avg >= 4 ? 'text-yellow-400' : 'text-red-400'
  const grade = !avg ? 'N/A' : avg >= 9 ? 'A+' : avg >= 8 ? 'A' : avg >= 7 ? 'B+' : avg >= 6 ? 'B' : avg >= 5 ? 'C' : 'D'

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Summary Card */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative shrink-0">
              {avg != null ? (
                <>
                  <ScoreRing score={avg} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-bold ${scoreColor}`}>{avg.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">/ 10</span>
                  </div>
                </>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center">
                  <Target className="w-8 h-8 text-gray-600" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h1 className="text-xl font-bold text-gray-100">Interview Report</h1>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                {session.category} · <span className="capitalize">{session.difficulty}</span>
              </p>

              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                <div className="text-center bg-gray-800 rounded-lg px-4 py-2">
                  <p className="text-lg font-bold text-gray-100">{session.completed_questions}</p>
                  <p className="text-xs text-gray-500">Questions</p>
                </div>
                <div className="text-center bg-gray-800 rounded-lg px-4 py-2">
                  <p className={`text-lg font-bold ${scoreColor}`}>{grade}</p>
                  <p className="text-xs text-gray-500">Grade</p>
                </div>
                <div className="text-center bg-gray-800 rounded-lg px-4 py-2">
                  <p className="text-lg font-bold text-gray-100 capitalize">{session.status.replace('_', ' ')}</p>
                  <p className="text-xs text-gray-500">Status</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Answers */}
        <h2 className="text-base font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-indigo-400" />
          Detailed Feedback ({session.answers?.length} answers)
        </h2>

        {session.answers?.length ? (
          session.answers.map((ans, i) => (
            <AnswerCard key={ans.id} answer={ans} index={i} />
          ))
        ) : (
          <div className="card text-center py-10">
            <p className="text-gray-400">No answers recorded for this session.</p>
          </div>
        )}

        <div className="flex justify-center mt-6">
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
