import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import api from '../services/api'
import { CheckCircle, ChevronRight, Loader2, BrainCircuit, Star } from 'lucide-react'
import toast from 'react-hot-toast'

const DIFF_COLOR = {
  easy: 'text-green-400 bg-green-400/10 border-green-400/20',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  hard: 'text-red-400 bg-red-400/10 border-red-400/20',
}

export default function InterviewPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [question, setQuestion] = useState(null)
  const [questionNum, setQuestionNum] = useState(1)
  const [totalQ, setTotalQ] = useState(5)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [phase, setPhase] = useState('loading') // loading | question | evaluating | feedback | done
  const textareaRef = useRef(null)

  const fetchNextQuestion = async () => {
    setPhase('loading')
    setAnswer('')
    setFeedback(null)
    try {
      const res = await api.get(`/sessions/${sessionId}/next-question`)
      setQuestion(res.data.question)
      setSession(res.data.session)
      setQuestionNum(res.data.question_number)
      setTotalQ(res.data.total_questions)
      setPhase('question')
      setTimeout(() => textareaRef.current?.focus(), 100)
    } catch (err) {
      if (err.response?.status === 410) {
        // Session complete
        setPhase('done')
      } else {
        toast.error('Failed to load question')
        navigate('/dashboard')
      }
    }
  }

  useEffect(() => {
    fetchNextQuestion()
  }, [])

  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast.error('Please write an answer before submitting')
      return
    }
    setPhase('evaluating')
    try {
      const res = await api.post(`/sessions/${sessionId}/answers`, {
        question_id: question.id,
        answer_text: answer,
      })
      setFeedback(res.data.feedback)
      setSession(res.data.session)
      setPhase('feedback')
    } catch {
      toast.error('Failed to submit answer')
      setPhase('question')
    }
  }

  const handleNext = () => {
    if (session?.completed_questions >= totalQ) {
      setPhase('done')
    } else {
      fetchNextQuestion()
    }
  }

  const scoreColor = (score) => {
    if (score >= 7) return 'text-green-400'
    if (score >= 4) return 'text-yellow-400'
    return 'text-red-400'
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-400">Loading your question…</p>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">Interview Complete!</h1>
          <p className="text-gray-400 mb-8">Great work finishing all {totalQ} questions. Check your detailed report below.</p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => navigate('/dashboard')} className="btn-secondary">
              Back to Dashboard
            </button>
            <button onClick={() => navigate(`/report/${sessionId}`)} className="btn-primary">
              View Full Report
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Progress */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-400" />
            <span className="text-sm text-gray-400">
              {session?.category} · <span className="capitalize">{session?.difficulty}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">
              Question {questionNum} of {totalQ}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: totalQ }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-8 rounded-full transition-all ${
                    i < (session?.completed_questions || 0)
                      ? 'bg-green-500'
                      : i === questionNum - 1
                      ? 'bg-indigo-500'
                      : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Question Card */}
        {question && (
          <div className="card mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className={`badge border ${DIFF_COLOR[question.difficulty]}`}>
                {question.difficulty}
              </span>
              <span className="text-xs text-gray-500">{question.category}</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-100 mb-1">{question.title}</h2>
            <p className="text-gray-300 leading-relaxed">{question.content}</p>
          </div>
        )}

        {/* Answer or Feedback */}
        {(phase === 'question' || phase === 'evaluating') && (
          <div className="card">
            <label className="block text-sm font-medium text-gray-400 mb-2">Your Answer</label>
            <textarea
              ref={textareaRef}
              className="input min-h-[160px] resize-none font-mono text-sm"
              placeholder="Write your answer here. Be thorough — cover the concept, give examples, and mention edge cases…"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={phase === 'evaluating'}
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-600">{answer.length} chars</span>
              <button
                onClick={handleSubmit}
                disabled={phase === 'evaluating' || !answer.trim()}
                className="btn-primary flex items-center gap-2"
              >
                {phase === 'evaluating' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI is evaluating…
                  </>
                ) : (
                  <>Submit Answer</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Feedback */}
        {phase === 'feedback' && feedback && (
          <div className="space-y-4">
            {/* Score */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100">AI Evaluation</h3>
                  <p className="text-sm text-gray-400 mt-0.5">Powered by Gemini</p>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${scoreColor(feedback.score)}`}>
                    {feedback.score.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">out of 10</p>
                </div>
              </div>
              {/* Score bar */}
              <div className="mt-3 bg-gray-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    feedback.score >= 7 ? 'bg-green-500' : feedback.score >= 4 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${feedback.score * 10}%` }}
                />
              </div>
            </div>

            {/* Your Answer */}
            <div className="card">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Your Answer</h4>
              <p className="text-gray-300 text-sm leading-relaxed font-mono bg-gray-800 p-3 rounded-lg">{answer}</p>
            </div>

            {/* Technical + Communication */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="card">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Technical Accuracy</h4>
                <p className="text-sm text-gray-400 leading-relaxed">{feedback.technical_accuracy}</p>
              </div>
              <div className="card">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Communication Quality</h4>
                <p className="text-sm text-gray-400 leading-relaxed">{feedback.communication_quality}</p>
              </div>
            </div>

            {/* Strengths + Weaknesses */}
            <div className="grid md:grid-cols-2 gap-4">
              {feedback.strengths?.length > 0 && (
                <div className="card border-green-900/40">
                  <h4 className="text-sm font-semibold text-green-400 mb-2">Strengths</h4>
                  <ul className="space-y-1">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-gray-300 flex gap-2">
                        <span className="text-green-400 shrink-0">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {feedback.weaknesses?.length > 0 && (
                <div className="card border-red-900/40">
                  <h4 className="text-sm font-semibold text-red-400 mb-2">Weaknesses</h4>
                  <ul className="space-y-1">
                    {feedback.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-gray-300 flex gap-2">
                        <span className="text-red-400 shrink-0">✗</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Missing Concepts */}
            {feedback.missing_concepts?.length > 0 && (
              <div className="card border-yellow-900/40">
                <h4 className="text-sm font-semibold text-yellow-400 mb-2">Missing Concepts</h4>
                <div className="flex flex-wrap gap-2">
                  {feedback.missing_concepts.map((c, i) => (
                    <span key={i} className="badge text-yellow-300 bg-yellow-400/10 border border-yellow-400/20">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Ideal Answer */}
            <div className="card">
              <h4 className="text-sm font-semibold text-indigo-400 mb-2 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" /> Ideal Answer
              </h4>
              <p className="text-sm text-gray-300 leading-relaxed">{feedback.ideal_answer}</p>
            </div>

            {/* Topics to Study */}
            {feedback.topics_to_study?.length > 0 && (
              <div className="card">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Topics to Study Next</h4>
                <div className="flex flex-wrap gap-2">
                  {feedback.topics_to_study.map((t, i) => (
                    <span key={i} className="badge text-indigo-300 bg-indigo-400/10 border border-indigo-400/20">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Improvements */}
            <div className="card">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Suggested Improvements</h4>
              <p className="text-sm text-gray-400 leading-relaxed">{feedback.suggested_improvements}</p>
            </div>

            {/* Next */}
            <div className="flex justify-end">
              <button onClick={handleNext} className="btn-primary flex items-center gap-2">
                {session?.completed_questions >= totalQ ? 'View Final Report' : 'Next Question'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
