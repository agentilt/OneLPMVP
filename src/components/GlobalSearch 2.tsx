'use client'

import { useState, useEffect, useCallback, Fragment, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, Transition } from '@headlessui/react'
import {
  Search,
  Briefcase,
  Building2,
  FileText,
  TrendingUp,
  Clock,
  Command,
  Users,
  Mail,
  Coins,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface SearchResult {
  id: string
  type: 'fund' | 'direct-investment' | 'report' | 'document' | 'user' | 'invitation' | 'distribution'
  title: string
  subtitle?: string
  url: string
  metadata?: {
    amount?: number
    date?: string
    status?: string
    [key: string]: any
  }
}

const ENTITY_OPTIONS = [
  { id: 'fund', label: 'Funds' },
  { id: 'direct-investment', label: 'Direct Investments' },
  { id: 'report', label: 'Reports' },
  { id: 'document', label: 'Documents' },
  { id: 'distribution', label: 'Distributions' },
  { id: 'user', label: 'Users (Admin)' },
  { id: 'invitation', label: 'Invitations (Admin)' },
]

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    'fund',
    'direct-investment',
    'report',
    'document',
    'distribution',
  ])
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [geographyFilter, setGeographyFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
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

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = localStorage.getItem('recentSearches')
    if (recent) {
      setRecentSearches(JSON.parse(recent))
    }
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        })
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.suggestions || [])
        }
      } catch (error) {
        if ((error as any).name !== 'AbortError') {
          console.error('Suggestion error:', error)
        }
      }
    }, 250)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [query])

  // Save recent search
  const saveRecentSearch = useCallback((searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }, [recentSearches])

  const filters = useMemo(() => {
    const geographies = geographyFilter
      .split(',')
      .map((geo) => geo.trim())
      .filter(Boolean)

    return {
      entityTypes: selectedTypes,
      minAmount: minAmount ? Number(minAmount) : undefined,
      maxAmount: maxAmount ? Number(maxAmount) : undefined,
      geographies,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }
  }, [selectedTypes, minAmount, maxAmount, geographyFilter, startDate, endDate])

  // Perform search
  const performSearch = useCallback(
    async (searchQuery: string, nextFilters = filters) => {
      if (!searchQuery.trim()) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery, filters: nextFilters }),
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
    [filters]
  )

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, filters)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, filters, performSearch])

  const toggleEntityType = (type: string) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((item) => item !== type)
      }
      return [...prev, type]
    })
  }

  const clearFilters = () => {
    setMinAmount('')
    setMaxAmount('')
    setGeographyFilter('')
    setStartDate('')
    setEndDate('')
    setSelectedTypes(['fund', 'direct-investment', 'report', 'document', 'distribution'])
  }

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
                <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search funds, investments, users..."
                      className="flex-1 bg-transparent text-foreground placeholder:text-slate-400 outline-none text-lg"
                      autoFocus
                    />
                    <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
                      ESC
                    </kbd>
                  </div>

                  {suggestions.length > 0 && query && (
                    <div>
                      <p className="text-[11px] uppercase font-semibold text-slate-400 mb-1">Suggestions</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => setQuery(suggestion)}
                            className="px-2.5 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] uppercase font-semibold text-slate-400 mb-2">Entity Types</p>
                      <div className="flex flex-wrap gap-2">
                        {ENTITY_OPTIONS.map((entity) => (
                          <button
                            key={entity.id}
                            onClick={() => toggleEntityType(entity.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              selectedTypes.includes(entity.id)
                                ? 'bg-accent text-white border-accent'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600'
                            }`}
                          >
                            {entity.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] uppercase font-semibold text-slate-400 mb-1 block">Min Amount</label>
                        <input
                          type="number"
                          value={minAmount}
                          onChange={(e) => setMinAmount(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] uppercase font-semibold text-slate-400 mb-1 block">Max Amount</label>
                        <input
                          type="number"
                          value={maxAmount}
                          onChange={(e) => setMaxAmount(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                          placeholder="Any"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] uppercase font-semibold text-slate-400 mb-1 block">Geographies</label>
                        <input
                          type="text"
                          value={geographyFilter}
                          onChange={(e) => setGeographyFilter(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                          placeholder="EU, UK, US..."
                        />
                      </div>
                      <div className="flex items-end justify-end">
                        <button
                          onClick={clearFilters}
                          className="text-xs text-accent underline-offset-2 hover:underline"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] uppercase font-semibold text-slate-400 mb-1 block">Start Date</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] uppercase font-semibold text-slate-400 mb-1 block">End Date</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                        />
                      </div>
                    </div>
                  </div>
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
                            <div className="text-right text-xs text-slate-500 flex flex-col gap-1 items-end">
                              {typeof result.metadata?.amount === 'number' && (
                                <span className="text-sm font-semibold text-foreground">
                                  {formatCurrency(result.metadata.amount)}
                                </span>
                              )}
                              {result.metadata?.status && (
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                                  {result.metadata.status}
                                </span>
                              )}
                              {result.metadata?.date && (
                                <span>{new Date(result.metadata.date).toLocaleDateString()}</span>
                              )}
                            </div>
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
