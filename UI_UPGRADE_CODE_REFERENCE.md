# UI Upgrade: Code Reference Guide

Quick reference for the key code patterns and changes made during the enterprise UI upgrade.

---

## 1. Typography Pattern

### Font Import (layout.tsx)
```tsx
import { Inter } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

// In JSX:
<body className={inter.className}>
```

### CSS Application (globals.css)
```css
body {
  font-family: var(--font-inter, 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

---

## 2. Color System

### CSS Variables (globals.css)
```css
:root {
  --background: #ffffff;
  --foreground: #1e293b;
  --accent-color: #4b6c9c;
  --accent-hover: #3d5a7f;
  --border-color: #e2e8f0;
  --surface: #f8fafc;
  --surface-hover: #f1f5f9;
}

.dark {
  --background: #0f172a;
  --foreground: #e2e8f0;
  --border-color: #1e293b;
  --surface: #1e293b;
  --surface-hover: #334155;
}
```

### Tailwind Integration (tailwind.config.ts)
```typescript
colors: {
  background: 'var(--background)',
  foreground: 'var(--foreground)',
  accent: 'var(--accent-color, #4b6c9c)',
  'accent-hover': 'var(--accent-hover, #3d5a7f)',
  border: 'var(--border-color, #e2e8f0)',
  surface: 'var(--surface, #f8fafc)',
  'surface-hover': 'var(--surface-hover, #f1f5f9)',
}
```

---

## 3. Component Styling Patterns

### Card Component Pattern
```tsx
// BEFORE
<div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-200">

// AFTER  
<div className="bg-white dark:bg-surface rounded-lg shadow-sm border border-border dark:border-slate-800 p-5 hover:shadow-md hover:border-accent/40 transition-all duration-150">
```

### Summary Card Pattern
```tsx
<div className="bg-white dark:bg-surface rounded-lg shadow-sm border border-border dark:border-slate-800 p-5 hover:shadow-md hover:border-accent/40 transition-all duration-150">
  <div className="flex items-start justify-between mb-3">
    <div className="w-10 h-10 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
      <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
    </div>
  </div>
  <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1">
    Total Commitments
  </div>
  <div className="text-2xl font-semibold">
    {formatCurrency(value)}
  </div>
</div>
```

### Button Patterns

#### Primary Button
```tsx
<button className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-all duration-150 shadow-sm hover:shadow-md">
  <Icon className="w-4 h-4" />
  Button Text
</button>
```

#### Secondary Button
```tsx
<button className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface border border-border dark:border-slate-800 rounded-lg text-sm font-medium text-foreground hover:bg-surface-hover dark:hover:bg-slate-800/50 transition-all duration-150 shadow-sm hover:shadow-md">
  <Icon className="w-4 h-4" />
  Button Text
</button>
```

---

## 4. AG Grid Implementation

### FundsTable Component Structure
```tsx
'use client'

import { useMemo, useCallback, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, ValueFormatterParams } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import '@/styles/ag-grid-custom.css'

export function FundsTable({ funds }: FundsTableProps) {
  const gridRef = useRef<AgGridReact>(null)

  // Column definitions
  const columnDefs: ColDef[] = useMemo(() => [
    {
      field: 'name',
      headerName: 'Fund Name',
      flex: 2,
      minWidth: 200,
      cellRenderer: CustomCellRenderer,
      sortable: true,
      filter: 'agTextColumnFilter',
      pinned: 'left',
    },
    // ... more columns
  ], [])

  // Default column properties
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  // Export functions
  const exportToCSV = useCallback(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.exportDataAsCsv({
        fileName: `funds-export-${new Date().toISOString().split('T')[0]}.csv`,
        columnKeys: ['name', 'manager', 'domicile', 'vintage', 'commitment', 'paidIn', 'nav', 'tvpi', 'dpi'],
      })
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Export Buttons */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-foreground/60">
          {funds.length} funds • {gridRef.current?.api?.getDisplayedRowCount() || funds.length} displayed
        </div>
        <div className="flex gap-2">
          <button onClick={exportToCSV} className="...">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="ag-theme-quartz ag-theme-custom" style={{ height: 600, width: '100%' }}>
        <AgGridReact
          ref={gridRef}
          rowData={funds}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          animateRows={true}
          pagination={true}
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          rowSelection="multiple"
          enableCellTextSelection={true}
        />
      </div>
    </div>
  )
}
```

### Custom Cell Renderer
```tsx
const FundNameCellRenderer = (props: any) => {
  return (
    <Link 
      href={`/funds/${props.data.id}`}
      className="text-accent hover:text-accent-hover font-semibold transition-colors"
    >
      {props.value}
    </Link>
  )
}
```

### AG Grid Custom Styling (ag-grid-custom.css)
```css
.ag-theme-custom {
  --ag-background-color: var(--background);
  --ag-foreground-color: var(--foreground);
  --ag-border-color: var(--border-color);
  --ag-header-background-color: var(--surface);
  --ag-font-family: var(--font-inter), 'Inter', sans-serif;
  --ag-font-size: 13px;
  --ag-cell-horizontal-padding: 16px;
  --ag-row-height: 44px;
  --ag-header-height: 42px;
  --ag-border-radius: 8px;
}

.ag-theme-custom .ag-header {
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.ag-theme-custom .ag-row-hover {
  background-color: var(--surface-hover) !important;
}
```

---

## 5. Navigation Components

### Topbar Pattern
```tsx
<header className="h-16 bg-white dark:bg-surface border-b border-border dark:border-slate-800 sticky top-0 z-40 shadow-sm">
  <div className="h-full px-6 lg:px-8 flex items-center justify-between">
    {/* Logo */}
    <div className="flex items-center gap-4">
      <Image src="/onelp-logo.png" alt="Logo" width={48} height={48} />
    </div>
    
    {/* User Menu */}
    <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface dark:bg-slate-800 border border-border">
      <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </div>
      <span className="text-sm font-medium">{userName}</span>
    </button>
  </div>
</header>
```

### Sidebar Pattern
```tsx
<aside className="fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-surface border-r border-border dark:border-slate-800 shadow-sm">
  <nav className="flex-1 px-4 py-6 space-y-1">
    {navigation.map((item) => (
      <Link
        href={item.href}
        className={cn(
          'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          isActive
            ? 'bg-accent text-white shadow-sm'
            : 'text-foreground hover:bg-surface-hover dark:hover:bg-slate-800/50'
        )}
      >
        <div className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center',
          isActive ? 'bg-white/15' : 'bg-slate-500/10 dark:bg-slate-500/20'
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <span>{item.name}</span>
      </Link>
    ))}
  </nav>
</aside>
```

---

## 6. Layout Patterns

### Page Wrapper
```tsx
<div className="min-h-screen bg-surface dark:bg-background">
  <Topbar />
  <div className="flex">
    <Sidebar />
    <main className="flex-1 p-6 lg:p-8">
      {/* Content */}
    </main>
  </div>
</div>
```

### Section Spacing
```tsx
// Consistent spacing pattern
<div className="mb-8">  {/* Section */}
  <h2 className="text-2xl font-bold mb-6">Section Title</h2>  {/* Title */}
  <div className="grid grid-cols-4 gap-4">  {/* Content */}
    {/* Items */}
  </div>
</div>
```

---

## 7. Motion/Animation Patterns

### Page Entry Animation
```tsx
<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, ease: "easeOut" }}
>
  {/* Content */}
</motion.div>
```

### Card Hover Animation
```tsx
<motion.div
  whileHover={{ scale: 1.01, y: -2 }}
  transition={{ duration: 0.15 }}
  className="..."
>
  {/* Card content */}
</motion.div>
```

### Staggered List Animation
```tsx
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
  >
    {/* Item */}
  </motion.div>
))}
```

---

## 8. Responsive Patterns

### Grid Responsiveness
```tsx
// Mobile → Tablet → Desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// Alternative pattern
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
```

### Padding Responsiveness
```tsx
<main className="flex-1 p-6 lg:p-8">
```

### Typography Responsiveness
```tsx
<h1 className="text-3xl sm:text-4xl font-bold">
```

---

## 9. Utility Functions

### Currency Formatting
```typescript
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
```

### Multiple Formatting
```typescript
const formatMultiple = (value: number) => {
  return value.toFixed(2) + 'x'
}
```

### Date Formatting
```typescript
const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
```

---

## 10. Common Class Combinations

### Card
```
bg-white dark:bg-surface rounded-lg shadow-sm border border-border dark:border-slate-800 p-5
```

### Button (Primary)
```
bg-accent hover:bg-accent-hover text-white rounded-lg px-4 py-2 font-medium transition-all duration-150
```

### Button (Secondary)
```
bg-surface dark:bg-slate-800 border border-border hover:bg-surface-hover rounded-lg px-4 py-2
```

### Input/Select
```
w-full px-3 py-2 border border-border dark:border-slate-800 rounded-lg bg-surface dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-accent
```

### Badge (Positive)
```
bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-md text-xs font-medium
```

### Badge (Negative)
```
bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-md text-xs font-medium
```

---

## Quick Find & Replace Patterns

If you need to update existing components:

### Update Border Radius
Find: `rounded-2xl` or `rounded-xl`
Replace: `rounded-lg`

### Update Shadows
Find: `shadow-xl shadow-black/5`
Replace: `shadow-sm`

### Update Padding
Find: `p-6`
Replace: `p-5`

### Update Background
Find: `bg-white dark:bg-slate-900`
Replace: `bg-white dark:bg-surface`

### Update Borders
Find: `border-slate-200/60 dark:border-slate-800/60`
Replace: `border border-border dark:border-slate-800`

---

**Last Updated:** November 17, 2024

