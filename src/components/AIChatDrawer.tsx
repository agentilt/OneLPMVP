'use client'

import { useState } from 'react'
import { X, Send, Loader2 } from 'lucide-react'

interface AIChatDrawerProps {
  isOpen: boolean
  onClose: () => void
  fundId?: string
}

export function AIChatDrawer({ isOpen, onClose, fundId }: AIChatDrawerProps) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    if (!question.trim()) {
      setError('Please enter a question.')
      return
    }
    setLoading(true)
    setError(null)
    setAnswer(null)
    try {
      const res = await fetch(`/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, fundId }),
      })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setAnswer(json.answer || 'No answer returned.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat failed')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-white dark:bg-surface border-l border-border dark:border-slate-800 shadow-2xl flex flex-col">
        <div className="p-4 border-b border-border dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-semibold text-foreground/60">Chat with AI</p>
            <p className="text-sm text-foreground/70">Ask about your funds and docs</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {error && <p className="text-sm text-red-500">{error}</p>}
          {answer ? (
            <div className="text-sm text-foreground whitespace-pre-line border border-border dark:border-slate-800 rounded-lg p-3 bg-surface/50">
              {answer}
            </div>
          ) : (
            <p className="text-sm text-foreground/60">
              Ask about the OneLP platform, features, navigation, or your funds/documents.
            </p>
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
            onClick={handleSend}
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
