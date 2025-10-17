'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { DataManagerSidebar } from '@/components/DataManagerSidebar'
import { formatCurrency, formatMultiple, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Edit2, Trash2, X, Upload, FileText, Download } from 'lucide-react'
import Link from 'next/link'

interface Document {
  id: string
  type: string
  title: string
  url: string
  uploadDate: Date
  dueDate: Date | null
  callAmount: number | null
  paymentStatus: string | null
  investmentValue: number | null
}

interface Fund {
  id: string
  name: string
  domicile: string
  vintage: number
  manager: string
  commitment: number
  paidIn: number
  nav: number
  tvpi: number
  dpi: number
  lastReportDate: Date
}

interface User {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: Date
  funds: Fund[]
}

interface DataManagerUserFundsClientProps {
  user: User
}

export function DataManagerUserFundsClient({ user: initialUser }: DataManagerUserFundsClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingFund, setEditingFund] = useState<Fund | null>(null)
  const [loading, setLoading] = useState(false)
  const [funds, setFunds] = useState(initialUser.funds)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    domicile: '',
    vintage: new Date().getFullYear(),
    manager: '',
    commitment: '',
    paidIn: '',
    nav: '',
    tvpi: '',
    dpi: '',
  })

  const [docFormData, setDocFormData] = useState({
    type: 'QUARTERLY_REPORT',
    title: '',
    dueDate: '',
    callAmount: '',
    paymentStatus: 'PENDING',
    investmentValue: '',
  })

  const resetForm = () => {
    setFormData({
      name: '',
      domicile: '',
      vintage: new Date().getFullYear(),
      manager: '',
      commitment: '',
      paidIn: '',
      nav: '',
      tvpi: '',
      dpi: '',
    })
    setEditingFund(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setShowModal(true)
  }

  const handleOpenEdit = (fund: Fund) => {
    setEditingFund(fund)
    setFormData({
      name: fund.name,
      domicile: fund.domicile,
      vintage: fund.vintage,
      manager: fund.manager,
      commitment: fund.commitment.toString(),
      paidIn: fund.paidIn.toString(),
      nav: fund.nav.toString(),
      tvpi: fund.tvpi.toString(),
      dpi: fund.dpi.toString(),
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingFund
        ? `/api/data-manager/users/${initialUser.id}/funds/${editingFund.id}`
        : `/api/data-manager/users/${initialUser.id}/funds`

      const method = editingFund ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: initialUser.id,
          ...formData,
          commitment: parseFloat(formData.commitment),
          paidIn: parseFloat(formData.paidIn),
          nav: parseFloat(formData.nav),
          tvpi: parseFloat(formData.tvpi),
          dpi: parseFloat(formData.dpi),
          vintage: parseInt(String(formData.vintage)),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save fund')
      }

      toast.success(editingFund ? 'Fund updated successfully' : 'Fund created successfully')
      setShowModal(false)
      resetForm()

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save fund')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (fundId: string) => {
    if (!confirm('Are you sure you want to delete this fund? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/data-manager/users/${initialUser.id}/funds/${fundId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete fund')
      }

      toast.success('Fund deleted successfully')
      setFunds(funds.filter((f) => f.id !== fundId))
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete fund')
    }
  }

  const handleOpenDocuments = async (fund: Fund) => {
    setSelectedFund(fund)
    setShowDocumentModal(true)
    
    try {
      const response = await fetch(`/api/data-manager/users/${initialUser.id}/funds/${fund.id}/documents`)
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Failed to fetch documents:', error)
      toast.error('Failed to load documents')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFund || !selectedFile) return

    setUploadingFile(true)

    try {
      // First, upload the file
      const fileFormData = new FormData()
      fileFormData.append('file', selectedFile)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: fileFormData,
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        throw new Error(error.error || 'Failed to upload file')
      }

      const uploadData = await uploadResponse.json()

      // Then, create the document record
      const docResponse = await fetch(`/api/data-manager/users/${initialUser.id}/funds/${selectedFund.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: docFormData.type,
          title: docFormData.title,
          url: uploadData.url,
          dueDate: docFormData.dueDate || null,
          callAmount: docFormData.callAmount || null,
          paymentStatus: docFormData.type === 'CAPITAL_CALL' ? docFormData.paymentStatus : null,
          investmentValue: docFormData.investmentValue || null,
        }),
      })

      if (!docResponse.ok) {
        throw new Error('Failed to save document')
      }

      const docData = await docResponse.json()
      setDocuments([docData.document, ...documents])
      setSelectedFile(null)
      setDocFormData({
        type: 'QUARTERLY_REPORT',
        title: '',
        dueDate: '',
        callAmount: '',
        paymentStatus: 'PENDING',
        investmentValue: '',
      })
      toast.success('Document uploaded successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload document')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleDocumentDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    if (!selectedFund) return

    try {
      const response = await fetch(
        `/api/data-manager/users/${initialUser.id}/funds/${selectedFund.id}/documents?documentId=${documentId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error('Failed to delete document')
      }

      setDocuments(documents.filter((d) => d.id !== documentId))
      toast.success('Document deleted successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete document')
    }
  }

  const isCapitalCall = docFormData.type === 'CAPITAL_CALL'

  return (
    <div className="min-h-screen bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        <DataManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/data-manager/users"
              className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Users
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{initialUser.name || 'User'}</h1>
                <p className="text-foreground/60 mt-1">{initialUser.email}</p>
              </div>
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Add Fund
              </button>
            </div>
          </div>

          {/* User Info Card */}
          <div className="border rounded-lg p-6 mb-6">
            <h2 className="font-semibold mb-4">User Information</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-foreground/60">Role</div>
                <div className="font-medium">{initialUser.role}</div>
              </div>
              <div>
                <div className="text-sm text-foreground/60">Member Since</div>
                <div className="font-medium">{formatDate(initialUser.createdAt)}</div>
              </div>
              <div>
                <div className="text-sm text-foreground/60">Total Funds</div>
                <div className="font-medium">{funds.length}</div>
              </div>
            </div>
          </div>

          {/* Funds List */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-foreground/5 px-4 py-3 border-b">
              <h2 className="font-semibold">Funds ({funds.length})</h2>
            </div>

            {funds.length > 0 ? (
              <div className="divide-y">
                {funds.map((fund) => (
                  <div key={fund.id} className="p-4 hover:bg-black/5 dark:hover:bg-white/10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{fund.name}</h3>
                        <div className="text-sm text-foreground/60 mt-1">
                          {fund.domicile} • Vintage {fund.vintage} • {fund.manager}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenDocuments(fund)}
                          className="p-2 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                          title="Manage documents"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(fund)}
                          className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                          title="Edit fund"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(fund.id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                          title="Delete fund"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <div className="text-xs text-foreground/60">Commitment</div>
                        <div className="font-semibold">{formatCurrency(fund.commitment)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-foreground/60">Paid-in</div>
                        <div className="font-semibold">{formatCurrency(fund.paidIn)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-foreground/60">NAV</div>
                        <div className="font-semibold">{formatCurrency(fund.nav)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-foreground/60">TVPI</div>
                        <div className="font-semibold">{formatMultiple(fund.tvpi)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-foreground/60">DPI</div>
                        <div className="font-semibold">{formatMultiple(fund.dpi)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-foreground/60 mb-4">This user has no funds yet.</p>
                <button
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90"
                >
                  <Plus className="w-4 h-4" />
                  Add First Fund
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create/Edit Fund Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingFund ? 'Edit Fund' : 'Add New Fund'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Fund Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="European Ventures Fund I"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Domicile *</label>
                  <input
                    type="text"
                    value={formData.domicile}
                    onChange={(e) => setFormData({ ...formData, domicile: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="Luxembourg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Vintage Year *</label>
                  <input
                    type="number"
                    value={formData.vintage}
                    onChange={(e) => setFormData({ ...formData, vintage: parseInt(e.target.value) })}
                    required
                    min="2000"
                    max="2100"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Manager *</label>
                  <input
                    type="text"
                    value={formData.manager}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="EuroVC Partners"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Commitment (€) *</label>
                  <input
                    type="number"
                    value={formData.commitment}
                    onChange={(e) => setFormData({ ...formData, commitment: e.target.value })}
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="5000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Paid-in Capital (€) *</label>
                  <input
                    type="number"
                    value={formData.paidIn}
                    onChange={(e) => setFormData({ ...formData, paidIn: e.target.value })}
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="3500000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Current NAV (€) *</label>
                  <input
                    type="number"
                    value={formData.nav}
                    onChange={(e) => setFormData({ ...formData, nav: e.target.value })}
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="4200000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">TVPI (x) *</label>
                  <input
                    type="number"
                    value={formData.tvpi}
                    onChange={(e) => setFormData({ ...formData, tvpi: e.target.value })}
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="1.20"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">DPI (x) *</label>
                  <input
                    type="number"
                    value={formData.dpi}
                    onChange={(e) => setFormData({ ...formData, dpi: e.target.value })}
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="0.15"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {loading ? 'Saving...' : editingFund ? 'Update Fund' : 'Create Fund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {showDocumentModal && selectedFund && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Documents</h2>
                <p className="text-sm text-foreground/60 mt-1">{selectedFund.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowDocumentModal(false)
                  setSelectedFund(null)
                  setSelectedFile(null)
                }}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Upload Form */}
              <form onSubmit={handleDocumentSubmit} className="border rounded-lg p-6 bg-foreground/5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload New Document
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      File * (PDF, Excel, CSV - Max 10MB)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.xlsx,.xls,.csv,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                      onChange={handleFileSelect}
                      required
                      className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    />
                    {selectedFile && (
                      <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Document Type *</label>
                      <select
                        value={docFormData.type}
                        onChange={(e) => setDocFormData({ ...docFormData, type: e.target.value })}
                        required
                        className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                      >
                        <option value="CAPITAL_CALL">Capital Call</option>
                        <option value="QUARTERLY_REPORT">Quarterly Report</option>
                        <option value="ANNUAL_REPORT">Annual Report</option>
                        <option value="COMPLIANCE">Compliance/Regulatory</option>
                        <option value="KYC">KYC Document</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Title *</label>
                      <input
                        type="text"
                        value={docFormData.title}
                        onChange={(e) => setDocFormData({ ...docFormData, title: e.target.value })}
                        required
                        className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                        placeholder="Q4 2024 Report"
                      />
                    </div>
                  </div>

                  {isCapitalCall && (
                    <div className="grid md:grid-cols-3 gap-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div>
                        <label className="block text-sm font-medium mb-2">Due Date</label>
                        <input
                          type="date"
                          value={docFormData.dueDate}
                          onChange={(e) => setDocFormData({ ...docFormData, dueDate: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Call Amount (€)</label>
                        <input
                          type="number"
                          value={docFormData.callAmount}
                          onChange={(e) => setDocFormData({ ...docFormData, callAmount: e.target.value })}
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                          placeholder="500000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Payment Status</label>
                        <select
                          value={docFormData.paymentStatus}
                          onChange={(e) => setDocFormData({ ...docFormData, paymentStatus: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="PAID">Paid</option>
                          <option value="LATE">Late</option>
                          <option value="OVERDUE">Overdue</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">Investment Value (€)</label>
                    <input
                      type="number"
                      value={docFormData.investmentValue}
                      onChange={(e) => setDocFormData({ ...docFormData, investmentValue: e.target.value })}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                      placeholder="1000000"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={uploadingFile || !selectedFile}
                    className="w-full px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                  >
                    {uploadingFile ? (
                      <>
                        <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Document
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Documents List */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-foreground/5 px-4 py-3 border-b">
                  <h3 className="font-semibold">Uploaded Documents ({documents.length})</h3>
                </div>

                {documents.length > 0 ? (
                  <div className="divide-y">
                    {documents.map((doc) => (
                      <div key={doc.id} className="p-4 hover:bg-black/5 dark:hover:bg-white/10 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-4 h-4 text-foreground/60" />
                            <h4 className="font-medium">{doc.title}</h4>
                            <span className="px-2 py-0.5 text-xs bg-foreground/10 rounded">
                              {doc.type.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-sm text-foreground/60">
                            Uploaded: {formatDate(doc.uploadDate)}
                            {doc.dueDate && ` • Due: ${formatDate(doc.dueDate)}`}
                            {doc.callAmount && ` • Amount: ${formatCurrency(doc.callAmount)}`}
                            {doc.paymentStatus && ` • Status: ${doc.paymentStatus}`}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                            title="Download document"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDocumentDelete(doc.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                            title="Delete document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-foreground/60">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No documents uploaded yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

