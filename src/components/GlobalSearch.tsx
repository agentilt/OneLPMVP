'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, Transition } from '@headlessui/react'
import { Search, Command, Briefcase, Building2, FileText, Users, Mail, Coins } from 'lucide-react'

interface SearchResult {
  id: string
  type: 'fund' | 'direct-investment' | 'report' | 'document' | 'user' | 'invitation' | 'distribution'
  title: string
  subtitle?: string
  url: string
  metadata?: {
    status?: string
    [key: string]: any
  }
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    const handleOpenEvent = () => setIsOpen(true)
    window.addEventListener('open-global-search', handleOpenEvent as EventListener)
    ;(window as any).__ONE_LP_OPEN_SEARCH__ = handleOpenEvent
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-global-search', handleOpenEvent as EventListener)
      if ((window as any).__ONE_LP_OPEN_SEARCH__ === handleOpenEvent) {
        delete (window as any).__ONE_LP_OPEN_SEARCH__
      }
    }
  }, [])

  useEffect(() => {
    const recent = localStorage.getItem('recentSearches')
    if (recent) {
      setRecentSearches(JSON.parse(recent))
    }
  }, [])

  const saveRecentSearch = useCallback((searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }, [recentSearches])

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([])
        return
      }
      setIsLoading(true)
      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery }),
        })
        if (response.ok) {
          const data = await response.json()
          setResults(data.results || [])
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, performSearch])

  const handleSelect = (result: SearchResult) => {
    saveRecentSearch(query)
    setIsOpen(false)
    setQuery('')
    router.push(result.url)
  }

  const handleClose = () => {
    setIsOpen(false)
    setQuery('')
    setResults([])
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'fund':
        return Briefcase
      case 'direct-investment':
        return Building2
      case 'report':
      case 'document':
        return FileText
      case 'user':
        return Users
      case 'invitation':
        return Mail
      case 'distribution':
        return Coins
      default:
        return Search
    }
  }

  return (
    <Transition.Root appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 pt-[15vh]">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl transition-all border border-slate-200 dark:border-slate-800">
                <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search across OneLP with natural language..."
                      className="flex-1 bg-transparent text-foreground placeholder:text-slate-400 outline-none text-lg"
                      autoFocus
                    />
                    <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
                      ESC
                    </kbd>
                  </div>
                  {recentSearches.length > 0 && !query && (
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((term) => (
                        <button
                          key={term}
                          onClick={() => {
                            setQuery(term)
                            performSearch(term)
                          }}
                          className="px-3 py-1 rounded-full border border-border dark:border-slate-800 text-xs text-foreground hover:border-accent/40 transition"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  {isLoading && <p className="text-sm text-slate-500">Searching...</p>}
                  {!isLoading && results.length === 0 && query && (
                    <p className="text-sm text-slate-500">No results found.</p>
                  )}
                  {!isLoading && !query && (
                    <p className="text-sm text-slate-500">
                      Type a natural language query, e.g. "highest nav in europe" or "documents about capital calls".
                    </p>
                  )}
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {results.map((result) => {
                      const Icon = getIcon(result.type)
                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleSelect(result)}
                          className="w-full text-left"
                        >
                          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-accent/40 transition flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-slate-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-foreground">{result.title}</p>
                              {result.subtitle && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">{result.subtitle}</p>
                              )}
                            </div>
                            {result.metadata?.status && (
                              <span className="text-xs font-semibold text-foreground/70">
                                {result.metadata.status}
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
