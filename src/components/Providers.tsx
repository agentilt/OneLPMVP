'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import { useEffect } from 'react'
import { useMotionShell } from '@/hooks/useMotionShell'

function ThemeProvider({ children }: { children: React.ReactNode }) {
  useMotionShell({ enableTilt: true, enableScrollReveal: true, enableScrollGradient: true })

  useEffect(() => {
    // Initialize theme on app load
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const savedColorTheme = localStorage.getItem('colorTheme') || 'theme-blue'
    
    // Apply dark/light mode
    if (savedTheme) {
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      localStorage.setItem('theme', 'light')
    }

    // Apply color theme with ai-shell
    const classes = document.documentElement.className.split(' ').filter(Boolean)
    const filteredClasses = classes.filter(c => !c.startsWith('theme-') && c !== 'ai-shell')
    filteredClasses.push('ai-shell', savedColorTheme)
    document.documentElement.className = filteredClasses.join(' ')
    
    // Save default color theme if not set
    if (!localStorage.getItem('colorTheme')) {
      localStorage.setItem('colorTheme', 'theme-blue')
    }
  }, [])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <Toaster position="top-right" />
      </ThemeProvider>
    </SessionProvider>
  )
}

