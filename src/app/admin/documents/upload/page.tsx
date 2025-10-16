'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/Topbar'
import { AdminSidebar } from '@/components/AdminSidebar'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'

export default function DocumentUploadPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [funds, setFunds] = useState<{ id: string; name: string }[]>([])
  
  const [formData, setFormData] = useState({
    fundId: '',
    type: 'QUARTERLY_REPORT',
    title: '',
    uploadDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    callAmount: '',
    paymentStatus: 'PENDING',
    url: '',
    parsedData: '',
  })

  useEffect(() => {
    // Fetch funds
    fetch('/api/admin/funds/list')
      .then((res) => res.json())
      .then((data) => setFunds(data.funds || []))
      .catch((err) => console.error('Failed to fetch funds:', err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const parsedDataObj = formData.parsedData 
        ? JSON.parse(formData.parsedData)
        : null

      const response = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fundId: formData.fundId,
          type: formData.type,
          title: formData.title,
          uploadDate: new Date(formData.uploadDate),
          dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
          callAmount: formData.callAmount ? parseFloat(formData.callAmount) : null,
          paymentStatus: formData.type === 'CAPITAL_CALL' ? formData.paymentStatus : null,
          url: formData.url || `/assets/documents/${Date.now()}.pdf`,
          parsedData: parsedDataObj,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload document')
      }

      toast.success('Document uploaded successfully')
      router.push('/admin/documents')
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload document')
    } finally {
      setLoading(false)
    }
  }

  const isCapitalCall = formData.type === 'CAPITAL_CALL'

  return (
    <div className="min-h-screen bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold mb-6">Upload Document</h1>

          <form onSubmit={handleSubmit} className="max-w-2xl">
            <div className="border rounded-lg p-6 space-y-6">
              <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">Manual Document Entry</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Fill in document details manually. File upload can be added later.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Fund *
                </label>
                <select
                  value={formData.fundId}
                  onChange={(e) => setFormData({ ...formData, fundId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                >
                  <option value="">Select a fund</option>
                  {funds.map((fund) => (
                    <option key={fund.id} value={fund.id}>
                      {fund.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Document Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                >
                  <option value="CAPITAL_CALL">Capital Call</option>
                  <option value="QUARTERLY_REPORT">Quarterly Report</option>
                  <option value="ANNUAL_REPORT">Annual Report</option>
                  <option value="KYC">KYC Document</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  placeholder="Q4 2024 Capital Call"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Upload Date *
                  </label>
                  <input
                    type="date"
                    value={formData.uploadDate}
                    onChange={(e) => setFormData({ ...formData, uploadDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                {isCapitalCall && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    />
                  </div>
                )}
              </div>

              {isCapitalCall && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Call Amount (€)
                    </label>
                    <input
                      type="number"
                      value={formData.callAmount}
                      onChange={(e) => setFormData({ ...formData, callAmount: e.target.value })}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                      placeholder="500000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Payment Status
                    </label>
                    <select
                      value={formData.paymentStatus}
                      onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PAID">Paid</option>
                      <option value="LATE">Late</option>
                      <option value="OVERDUE">Overdue</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Document URL
                </label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  placeholder="/assets/documents/document.pdf"
                />
                <p className="mt-1 text-xs text-foreground/60">
                  Optional: Direct link to PDF file
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Parsed Data (JSON)
                </label>
                <textarea
                  value={formData.parsedData}
                  onChange={(e) => setFormData({ ...formData, parsedData: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20 font-mono text-sm"
                  placeholder='{"notice": "Capital call details", "amount": 500000}'
                />
                <p className="mt-1 text-xs text-foreground/60">
                  Optional: Additional structured data as JSON
                </p>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {loading ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}

