'use client'

import { useEffect, useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { AIChatDrawer } from './AIChatDrawer'

type FundOption = { id: string; name: string }

export function GlobalAIChatLauncher() {
  const [open, setOpen] = useState(false)
  const [funds, setFunds] = useState<FundOption[]>([])
  const [loadingFunds, setLoadingFunds] = useState(false)

  useEffect(() => {
    if (!open || funds.length > 0 || loadingFunds) return
    const loadFunds = async () => {
      try {
        setLoadingFunds(true)
        const res = await fetch('/api/ai/funds')
        if (!res.ok) return
        const json = await res.json()
        setFunds(json.funds || [])
      } finally {
        setLoadingFunds(false)
      }
    }
    loadFunds()
  }, [open, funds.length, loadingFunds])

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
        {open ? (
          <button
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-800 text-white shadow-lg hover:brightness-110 transition"
          >
            <X className="w-4 h-4" />
            Close AI
          </button>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-accent text-white shadow-xl hover:brightness-110 transition"
          >
            <MessageCircle className="w-5 h-5" />
            Chat with AI
          </button>
        )}
      </div>
      <AIChatDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        funds={funds}
        mode="global"
        showFundSelector
      />
    </>
  )
}
