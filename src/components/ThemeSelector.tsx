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
  const [showColorPicker, setShowColorPicker] = useState(false)

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
    
    setShowColorPicker(false)
  }

  return (
    <div className="flex items-center gap-2">
      {/* Dark/Light Toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </button>

      {/* Color Theme Picker */}
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Choose color theme"
        >
          <Palette className="w-5 h-5" />
        </button>

        {showColorPicker && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowColorPicker(false)}
            />
            
            {/* Color picker dropdown */}
            <div className="absolute right-0 mt-2 p-3 bg-background border rounded-lg shadow-lg z-50 min-w-[180px]">
              <p className="text-xs font-medium mb-2 text-foreground/60">Accent Color</p>
              <div className="grid grid-cols-2 gap-2">
                {colorThemes.map((ct) => (
                  <button
                    key={ct.value}
                    onClick={() => selectColorTheme(ct.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${
                      colorTheme === ct.value ? 'ring-2 ring-offset-2 ring-current' : ''
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: ct.color }}
                    />
                    <span className="text-sm">{ct.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

