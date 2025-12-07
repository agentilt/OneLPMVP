'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { MessageCircle, X } from 'lucide-react'
import { AIChatDrawer } from './AIChatDrawer'

export function GlobalAIChatLauncher() {
  const [open, setOpen] = useState(false)
  const { status } = useSession()
  const pathname = usePathname()

  const isAuthRoute = pathname?.startsWith('/login')
  const isAuthenticated = status === 'authenticated'

  if (!isAuthenticated || isAuthRoute) return null

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
        {open ? (
          <button
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-800 text-white shadow-xl hover:brightness-110 transition border border-white/10 backdrop-blur-sm"
          >
            <X className="w-4 h-4" />
            Close AI
          </button>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-slate-900 via-indigo-700 to-blue-600 text-white shadow-2xl hover:brightness-110 transition border border-white/15 backdrop-blur-md"
          >
            <MessageCircle className="w-5 h-5" />
            Chat with AI
          </button>
        )}
      </div>
      <AIChatDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
