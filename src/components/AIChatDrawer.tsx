'use client'

import { useState } from 'react'
import { X, Send, Loader2 } from 'lucide-react'
import { AIResultCards } from './AIResultCards'

interface AIChatDrawerProps {
  isOpen: boolean
  onClose: () => void
  variant?: 'drawer' | 'inline'
}

type ChatContext = {
  funds?: any[]
  directInvestments?: any[]
  capitalCalls?: any[]
  distributions?: any[]
}

export function AIChatDrawer({ isOpen, onClose, variant = 'drawer' }: AIChatDrawerProps) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
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
      setAnswer(json.answer || 'No answer returned.')
      setContext(json.context || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat failed')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const baseContainerClasses =
    variant === 'inline'
      ? 'w-full max-w-4xl bg-white dark:bg-surface border border-border dark:border-slate-800 rounded-2xl shadow-lg flex flex-col'
      : 'w-full max-w-md bg-white dark:bg-surface border-l border-border dark:border-slate-800 shadow-2xl flex flex-col'

  return (
    <div
      className={
        variant === 'inline'
          ? 'w-full flex justify-center'
          : 'fixed inset-0 z-50 flex'
      }
    >
      {variant === 'drawer' && <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />}
      <div className={baseContainerClasses}>
        <div className="p-4 border-b border-border dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-semibold text-foreground/60">Ask OneLP AI</p>
            <p className="text-sm text-foreground/70">Ask about funds, docs, capital calls, distributions</p>
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
            <div className="space-y-3">
              <div className="text-sm text-foreground whitespace-pre-line border border-border dark:border-slate-800 rounded-lg p-3 bg-surface/50">
                {answer}
              </div>
              <AIResultCards
                funds={context?.funds}
                directs={context?.directInvestments}
                capitalCalls={context?.capitalCalls}
                distributions={context?.distributions}
              />
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
                    className="text-xs px-3 py-2 rounded-full border border-border dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    disabled={loading}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border dark:border-slate-800">
          <div className="flex gap-2">
            <textarea
              className="flex-1 border border-border dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-accent/40 min-h-[80px]"
              placeholder="Type your question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading}
            />
          </div>
          <button
            onClick={() => handleSend()}
            disabled={loading}
            className="mt-2 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:brightness-110 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Thinking...' : 'Ask'}
          </button>
        </div>
      </div>
    </div>
  )
}
