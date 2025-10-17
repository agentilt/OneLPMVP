'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun, Palette } from 'lucide-react'

const colorThemes = [
  { name: 'Blue', value: 'theme-blue', color: '#3b82f6' },
  { name: 'Green', value: 'theme-green', color: '#10b981' },
  { name: 'Purple', value: 'theme-purple', color: '#8b5cf6' },
  { name: 'Orange', value: 'theme-orange', color: '#f97316' },
]

export function ThemeSelector() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [colorTheme, setColorTheme] = useState('')

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const savedColorTheme = localStorage.getItem('colorTheme') || 'theme-blue'
    
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
      document.documentElement.classList.add('dark')
    }

    setColorTheme(savedColorTheme)
    // Remove all theme classes and add the saved/default one
    const classes = document.documentElement.className.split(' ')
    const filteredClasses = classes.filter(c => !c.startsWith('theme-'))
    filteredClasses.push(savedColorTheme)
    document.documentElement.className = filteredClasses.join(' ')
    
    // Save default if nothing was saved
    if (!localStorage.getItem('colorTheme')) {
      localStorage.setItem('colorTheme', 'theme-blue')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const selectColorTheme = (themeValue: string) => {
    setColorTheme(themeValue)
    localStorage.setItem('colorTheme', themeValue)
    
    // Remove all theme classes and add the new one
    const classes = document.documentElement.className.split(' ')
    const filteredClasses = classes.filter(c => !c.startsWith('theme-'))
    if (themeValue) {
      filteredClasses.push(themeValue)
    }
    document.documentElement.className = filteredClasses.join(' ')
  }

  return (
    <div className="space-y-6">
      {/* Dark/Light Mode Section */}
      <div>
        <label className="text-sm font-semibold text-foreground/70 mb-3 block">Display Mode</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              if (theme !== 'light') toggleTheme()
            }}
            className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              theme === 'light'
                ? 'border-accent bg-accent/5 shadow-lg shadow-accent/10'
                : 'border-slate-200 dark:border-slate-800 hover:border-accent/30 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              theme === 'light' 
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30' 
                : 'bg-slate-200 dark:bg-slate-700'
            }`}>
              <Sun className={`w-5 h-5 ${theme === 'light' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-sm">Light</p>
              <p className="text-xs text-foreground/60">Bright theme</p>
            </div>
            {theme === 'light' && (
              <div className="absolute top-2 right-2">
                <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>

          <button
            onClick={() => {
              if (theme !== 'dark') toggleTheme()
            }}
            className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              theme === 'dark'
                ? 'border-accent bg-accent/5 shadow-lg shadow-accent/10'
                : 'border-slate-200 dark:border-slate-800 hover:border-accent/30 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-500/30' 
                : 'bg-slate-200 dark:bg-slate-700'
            }`}>
              <Moon className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-sm">Dark</p>
              <p className="text-xs text-foreground/60">Dark theme</p>
            </div>
            {theme === 'dark' && (
              <div className="absolute top-2 right-2">
                <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Color Theme Section */}
      <div>
        <label className="text-sm font-semibold text-foreground/70 mb-3 block">Accent Color</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {colorThemes.map((ct) => (
            <button
              key={ct.value}
              onClick={() => selectColorTheme(ct.value)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                colorTheme === ct.value
                  ? 'border-accent bg-accent/5 shadow-lg shadow-accent/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-accent/30 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div
                className="w-10 h-10 rounded-lg shadow-lg transition-transform hover:scale-110"
                style={{ 
                  backgroundColor: ct.color,
                  boxShadow: `0 4px 14px 0 ${ct.color}30`
                }}
              />
              <span className="text-sm font-semibold">{ct.name}</span>
              {colorTheme === ct.value && (
                <div className="absolute top-2 right-2">
                  <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Preview Info */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground/90 mb-1">Theme Applied</p>
            <p className="text-xs text-foreground/60 leading-relaxed">
              Your theme preferences are saved automatically and will persist across sessions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

