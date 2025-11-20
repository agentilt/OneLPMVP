'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, Transition } from '@headlessui/react'
import { Search, Briefcase, Building2, FileText, TrendingUp, Clock, Command } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface SearchResult {
  id: string
  type: 'fund' | 'direct-investment' | 'report' | 'document'
  title: string
  subtitle?: string
  url: string
  metadata?: {
    amount?: number
    date?: string
    status?: string
  }
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const router = useRouter()

  // Open modal with Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = localStorage.getItem('recentSearches')
    if (recent) {
      setRecentSearches(JSON.parse(recent))
    }
  }, [])

  // Save recent search
  const saveRecentSearch = useCallback((searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }, [recentSearches])

  // Perform search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
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
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, performSearch])

  // Handle result selection
  const handleSelect = (result: SearchResult) => {
    saveRecentSearch(query)
    setIsOpen(false)
    setQuery('')
    router.push(result.url)
  }

  // Close modal
  const handleClose = () => {
    setIsOpen(false)
    setQuery('')
    setResults([])
  }

  // Get icon for result type
  const getIcon = (type: string) => {
    switch (type) {
      case 'fund':
        return Briefcase
      case 'direct-investment':
        return Building2
      case 'report':
        return FileText
      case 'document':
        return FileText
      default:
        return Search
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200 dark:border-slate-800">
                  <Search className="w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search funds, investments, reports..."
                    className="flex-1 bg-transparent text-foreground placeholder:text-slate-400 outline-none text-lg"
                    autoFocus
                  />
                  <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
                    ESC
                  </kbd>
                </div>

                {/* Results or Recent Searches */}
                <div className="max-h-[60vh] overflow-y-auto">
                  {!query && recentSearches.length > 0 && (
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        <Clock className="w-4 h-4" />
                        Recent Searches
                      </div>
                      <div className="space-y-1">
                        {recentSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => setQuery(search)}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            {search}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {query && !isLoading && results.length === 0 && (
                    <div className="p-12 text-center">
                      <Search className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                      <p className="text-sm text-slate-500">No results found for "{query}"</p>
                    </div>
                  )}

                  {query && isLoading && (
                    <div className="p-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4" />
                      <p className="text-sm text-slate-500">Searching...</p>
                    </div>
                  )}

                  {results.length > 0 && (
                    <div className="p-2">
                      {results.map((result) => {
                        const Icon = getIcon(result.type)
                        return (
                          <button
                            key={result.id}
                            onClick={() => handleSelect(result)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                              {result.subtitle && (
                                <p className="text-xs text-slate-500 truncate">{result.subtitle}</p>
                              )}
                            </div>
                            {result.metadata?.amount && (
                              <div className="text-sm font-semibold text-foreground">
                                {formatCurrency(result.metadata.amount)}
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {!query && recentSearches.length === 0 && (
                    <div className="p-12 text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4">
                        <Command className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        <span className="text-sm font-semibold text-foreground">+ K</span>
                      </div>
                      <p className="text-sm text-slate-500">Start typing to search across your portfolio</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs">↑</kbd>
                        <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs">↓</kbd>
                        <span>navigate</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs">↵</kbd>
                        <span>select</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs">ESC</kbd>
                      <span>close</span>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

