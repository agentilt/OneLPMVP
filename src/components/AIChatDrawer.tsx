'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Send, Loader2, Sparkles } from 'lucide-react'
import { sanitizeActionHref } from '@/lib/ai/suggestions'

interface AIChatDrawerProps {
  isOpen: boolean
  onClose: () => void
  variant?: 'drawer' | 'inline'
  initialQuestion?: string
  onClearInitial?: () => void
}

type ChatContext = {
  funds?: any[]
  directInvestments?: any[]
  capitalCalls?: any[]
  distributions?: any[]
}

type ChatMessage = {
  text: string
  actionHref?: string
  actionLabel?: string
}

export function AIChatDrawer({ isOpen, onClose, variant = 'drawer', initialQuestion, onClearInitial }: AIChatDrawerProps) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<ChatMessage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [context, setContext] = useState<ChatContext | null>(null)
  const suggestions = [
    'Summarize my top funds performance and IRR',
    'What capital calls are due in the next 30 days?',
    'Find tech funds in Europe with highest NAV',
    'Show recent distributions and DPI trends',
    'How do I export a report and where is the Analytics hub?',
  ]

  const shouldShowData = (q: string) => {
    const text = q.toLowerCase()
    const intents = [
      'capital call',
      'capital calls',
      'distribution',
      'distributions',
      'fund',
      'funds',
      'nav',
      'irr',
      'tvpi',
      'dpi',
      'performance',
      'top fund',
      'highest',
      'direct investment',
      'investments',
      'commitment',
      'paid in',
      'cash flow',
      'cashflow',
    ]
    return intents.some((k) => text.includes(k))
  }

  const handleSend = async (nextQuestion?: string) => {
    const q = (nextQuestion ?? question).trim()
    if (!q) {
      setError('Please enter a question.')
      return
    }
    setQuestion(q)
    setLoading(true)
    setError(null)
    setAnswer(null)
    setContext(null)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      if (json.message?.text) {
        const safeHref = sanitizeActionHref(json.message.actionHref)
        setAnswer({
          text: json.message.text,
          actionHref: safeHref,
          actionLabel: json.message.actionLabel || (safeHref ? 'Open' : undefined),
        })
      } else {
        setAnswer({ text: json.answer || 'No answer returned.' })
      }
      setContext(json.context || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialQuestion && isOpen && !loading) {
      handleSend(initialQuestion)
      onClearInitial?.()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion, isOpen])

  if (!isOpen) return null

  const baseContainerClasses =
    variant === 'inline'
      ? 'w-full max-w-4xl border border-border rounded-2xl shadow-[0_24px_90px_rgba(5,10,30,0.45)] flex flex-col backdrop-blur bg-[radial-gradient(circle_at_30%_20%,rgba(124,93,255,0.12),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(83,201,255,0.12),transparent_48%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]'
      : [
          'w-full max-w-lg border-l border-border shadow-[0_28px_90px_rgba(5,10,30,0.55)] flex flex-col backdrop-blur bg-[radial-gradient(circle_at_30%_20%,rgba(124,93,255,0.12),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(83,201,255,0.12),transparent_48%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]',
          'transition-all duration-300 ease-out transform',
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        ].join(' ')

  return (
    <div
      className={
        variant === 'inline'
          ? 'w-full flex justify-center'
          : 'fixed inset-0 z-50 flex'
      }
    >
      {variant === 'drawer' && (
        <div
          className="flex-1 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <div className={baseContainerClasses}>
        <div className="p-4 border-b border-border/60 flex items-center justify-between bg-gradient-to-r from-white/10 via-white/6 to-transparent backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[radial-gradient(circle_at_35%_35%,rgba(107,220,255,0.25),transparent_60%),linear-gradient(135deg,#7c5bff,#6bdcff)] text-white shadow-inner shadow-accent/25">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs uppercase font-semibold text-foreground/60">OneLP AI</p>
              <p className="text-sm text-foreground/70">Ask about funds, docs, capital calls, distributions</p>
            </div>
          </div>
          {variant === 'drawer' && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {error && <p className="text-sm text-red-500">{error}</p>}
          {answer && (
            <div className="space-y-4">
              <div className="text-sm text-foreground whitespace-pre-line border border-border rounded-2xl p-4 bg-gradient-to-br from-white/10 via-white/5 to-transparent shadow-lg shadow-black/20 backdrop-blur space-y-3">
                <div>{answer.text}</div>
                {answer.actionHref && (
                  <Link
                    href={answer.actionHref}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-hover"
                  >
                    {answer.actionLabel || 'Open'}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 17l9-9" />
                      <path d="M7 7h10v10" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          )}
          {!answer && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground/60">Try asking</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-xs px-3 py-2 rounded-full border border-border/70 hover:border-accent/40 hover:bg-white/5 transition shadow-sm backdrop-blur"
                    disabled={loading}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border/60 bg-white/5 backdrop-blur">
          <div className="flex gap-2">
            <textarea
              className="flex-1 border border-border rounded-xl p-3 text-sm bg-white/5 focus:outline-none focus:ring-2 focus:ring-accent/40 min-h-[80px] shadow-inner backdrop-blur"
              placeholder="Ask about performance, capital calls, distributions, documents..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading}
            />
          </div>
          <button
            onClick={() => handleSend()}
            disabled={loading}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-gradient-to-r from-accent to-accent-hover text-white text-sm font-semibold hover:brightness-110 disabled:opacity-50 shadow-lg shadow-accent/25 ring-1 ring-white/10"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Thinking...' : 'Ask OneLP AI'}
          </button>
          <div className="mt-2 text-[11px] text-foreground/50 flex items-center justify-between">
            <span>Answers cite available data; no invented numbers.</span>
            <span className="text-foreground/60">Model: Gemini 2.5 Flash</span>
          </div>
        </div>
      </div>
    </div>
  )
}
