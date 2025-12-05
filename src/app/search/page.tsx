'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

interface SearchResult {
  id: string
  type: string
  title: string
  subtitle?: string
  url: string
  metadata?: Record<string, any>
}

export default function AdvancedSearchPage() {
  const [query, setQuery] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [geographies, setGeographies] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async () => {
    setIsLoading(true)
    try {
      const geos = geographies
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean)

      const payload: any = {
        query,
        filters: {
          minAmount: minAmount ? Number(minAmount) : undefined,
          maxAmount: maxAmount ? Number(maxAmount) : undefined,
          geographies: geos,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      }

      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const json = await res.json()
        setResults(json.results || [])
      } else {
        setResults([])
      }
    } catch (err) {
      console.error('Advanced search error', err)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center gap-3">
        <Search className="w-6 h-6 text-accent" />
        <div>
          <p className="text-xs uppercase font-semibold text-foreground/60">Advanced Search</p>
          <h1 className="text-2xl font-bold text-foreground">Search with filters</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-surface border border-border dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="md:col-span-3">
          <label className="block text-xs font-semibold text-foreground/60 mb-1">Query</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g., "tech funds in europe with nav > 50m"'
            className="w-full rounded-lg border border-border dark:border-slate-800 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground/60 mb-1">Min Amount</label>
          <input
            type="number"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            className="w-full rounded-lg border border-border dark:border-slate-800 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground/60 mb-1">Max Amount</label>
          <input
            type="number"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            className="w-full rounded-lg border border-border dark:border-slate-800 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            placeholder="Any"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground/60 mb-1">Geographies (comma separated)</label>
          <input
            type="text"
            value={geographies}
            onChange={(e) => setGeographies(e.target.value)}
            className="w-full rounded-lg border border-border dark:border-slate-800 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            placeholder="e.g., US, Germany"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground/60 mb-1">Start Date (for docs)</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-border dark:border-slate-800 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground/60 mb-1">End Date (for docs)</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-border dark:border-slate-800 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
        <div className="md:col-span-3 flex justify-end">
          <button
            onClick={handleSearch}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:brightness-110 transition"
          >
            Search
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-surface border border-border dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Results</h2>
        {isLoading && <p className="text-sm text-foreground/60">Searching...</p>}
        {!isLoading && results.length === 0 && <p className="text-sm text-foreground/60">No results.</p>}
        <div className="space-y-2">
          {results.map((r) => (
            <div
              key={`${r.type}-${r.id}`}
              className="p-3 rounded-xl border border-border dark:border-slate-800 hover:border-accent/40 transition"
            >
              <p className="text-sm font-semibold text-foreground">{r.title}</p>
              {r.subtitle && <p className="text-xs text-foreground/60">{r.subtitle}</p>}
              <p className="text-[11px] uppercase text-foreground/50 mt-1">{r.type}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
