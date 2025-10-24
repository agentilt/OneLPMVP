'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { AdminSidebar } from '@/components/AdminSidebar'
import { DataManagerSidebar } from '@/components/DataManagerSidebar'
import { ThemeSelector } from '@/components/ThemeSelector'
import { User, Mail, Calendar, Shield, Key, Smartphone, Eye, Lock, AlertTriangle, CheckCircle, Clock, Trash2, Download, Settings } from 'lucide-react'

interface UserInfo {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  name: string | null
  role: string
  createdAt: Date
}

interface SettingsClientProps {
  user: UserInfo
}

interface MFASettings {
  enabled: boolean
  secret?: string
  backupCodes?: string[]
  lastUsed?: Date
}

interface SecurityEvent {
  id: string
  eventType: string
  description: string
  severity: string
  createdAt: Date
}

interface UserSession {
  id: string
  deviceInfo?: any
  ipAddress?: string
  lastActivity: Date
  isActive: boolean
}

export function SettingsClient({ user }: SettingsClientProps) {
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'privacy'>('profile')
  
  // Security state
  const [mfaSettings, setMfaSettings] = useState<MFASettings | null>(null)
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [userSessions, setUserSessions] = useState<UserSession[]>([])
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaError, setMfaError] = useState('')
  const [showMfaSetup, setShowMfaSetup] = useState(false)
  const [mfaToken, setMfaToken] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  // Fetch security data on component mount
  useEffect(() => {
    fetchSecurityData()
  }, [])

  const fetchSecurityData = async () => {
    try {
      // Fetch MFA settings
      const mfaResponse = await fetch('/api/auth/mfa')
      if (mfaResponse.ok) {
        const mfaData = await mfaResponse.json()
        setMfaSettings(mfaData)
      }

      // Fetch security events (last 10)
      const eventsResponse = await fetch('/api/admin/security?type=events&limit=10')
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        setSecurityEvents(eventsData.events || [])
      }

      // Fetch user sessions
      const sessionsResponse = await fetch('/api/admin/security?type=sessions')
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json()
        setUserSessions(sessionsData.sessions || [])
      }
    } catch (error) {
      console.error('Error fetching security data:', error)
    }
  }

  const handlePasswordResetRequest = async () => {
    setLoading(true)
    setError('')
    setResetEmailSent(false)

    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      })

      if (response.ok) {
        setResetEmailSent(true)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to send reset email')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEnableMFA = async () => {
    setMfaLoading(true)
    setMfaError('')

    try {
      const response = await fetch('/api/auth/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      if (response.ok) {
        const data = await response.json()
        setQrCodeUrl(data.qrCodeUrl)
        setBackupCodes(data.backupCodes)
        setShowMfaSetup(true)
      } else {
        const errorData = await response.json()
        setMfaError(errorData.error || 'Failed to enable MFA')
      }
    } catch (err) {
      setMfaError('An error occurred. Please try again.')
    } finally {
      setMfaLoading(false)
    }
  }

  const handleVerifyMFA = async () => {
    setMfaLoading(true)
    setMfaError('')

    try {
      const response = await fetch('/api/auth/mfa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, token: mfaToken }),
      })

      if (response.ok) {
        setShowMfaSetup(false)
        setMfaToken('')
        await fetchSecurityData() // Refresh data
      } else {
        const errorData = await response.json()
        setMfaError(errorData.error || 'Invalid MFA token')
      }
    } catch (err) {
      setMfaError('An error occurred. Please try again.')
    } finally {
      setMfaLoading(false)
    }
  }

  const handleDisableMFA = async () => {
    setMfaLoading(true)
    setMfaError('')

    try {
      const response = await fetch('/api/auth/mfa', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, password: prompt('Enter your password to disable MFA:') }),
      })

      if (response.ok) {
        await fetchSecurityData() // Refresh data
      } else {
        const errorData = await response.json()
        setMfaError(errorData.error || 'Failed to disable MFA')
      }
    } catch (err) {
      setMfaError('An error occurred. Please try again.')
    } finally {
      setMfaLoading(false)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/admin/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke_session', sessionId }),
      })

      if (response.ok) {
        await fetchSecurityData() // Refresh data
      }
    } catch (error) {
      console.error('Error revoking session:', error)
    }
  }

  // Render the appropriate sidebar based on user role
  const renderSidebar = () => {
    switch (user.role) {
      case 'ADMIN':
        return <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      case 'DATA_MANAGER':
        return <DataManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      default:
        return <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        {renderSidebar()}
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg shadow-accent/20">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                    Account Settings
                  </h1>
                  <p className="text-sm text-foreground/60 mt-0.5">
                    Manage your profile, security, and privacy preferences
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-8">
              <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                    activeTab === 'profile'
                      ? 'bg-white dark:bg-slate-700 text-foreground shadow-sm'
                      : 'text-foreground/60 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                    activeTab === 'security'
                      ? 'bg-white dark:bg-slate-700 text-foreground shadow-sm'
                      : 'text-foreground/60 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4" />
                    Security & Privacy
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                    activeTab === 'privacy'
                      ? 'bg-white dark:bg-slate-700 text-foreground shadow-sm'
                      : 'text-foreground/60 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" />
                    Data & Privacy
                  </div>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Profile & Theme */}
                <div className="lg:col-span-2 space-y-6">
                  {/* User Information Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
                    <div className="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent p-6 border-b border-slate-200/60 dark:border-slate-800/60">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg shadow-accent/20">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-foreground">Profile Information</h2>
                          <p className="text-sm text-foreground/60">Your account details and role</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-5">
                      {/* Name Field */}
                      <div className="group">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60 transition-all hover:border-accent/30 hover:bg-slate-100/50 dark:hover:bg-slate-800/80">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-0.5">Full Name</p>
                            <p className="text-base font-semibold text-foreground truncate">
                              {user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user.name || 'Not set'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Email Field */}
                      <div className="group">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60 transition-all hover:border-accent/30 hover:bg-slate-100/50 dark:hover:bg-slate-800/80">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Mail className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-0.5">Email Address</p>
                            <p className="text-base font-semibold text-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Member Since Field */}
                      <div className="group">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60 transition-all hover:border-accent/30 hover:bg-slate-100/50 dark:hover:bg-slate-800/80">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-0.5">Member Since</p>
                            <p className="text-base font-semibold text-foreground">
                              {new Date(user.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Theme Settings Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent p-6 border-b border-slate-200/60 dark:border-slate-800/60">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-foreground">Appearance</h2>
                          <p className="text-sm text-foreground/60">Customize your dashboard theme</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <ThemeSelector />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security & Privacy Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Security Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Account Security</h3>
                        <p className="text-sm text-foreground/60">Overall status</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-sm font-medium text-foreground">Secure</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Smartphone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">MFA Status</h3>
                        <p className="text-sm text-foreground/60">Two-factor auth</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {mfaSettings?.enabled ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-foreground">Enabled</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium text-foreground">Disabled</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Active Sessions</h3>
                        <p className="text-sm text-foreground/60">Current devices</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {userSessions.filter(s => s.isActive).length}
                    </div>
                  </div>
                </div>

                {/* MFA Management */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent p-6 border-b border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Smartphone className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">Multi-Factor Authentication</h2>
                        <p className="text-sm text-foreground/60">Add an extra layer of security to your account</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {!mfaSettings?.enabled ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                          <div>
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">MFA Not Enabled</p>
                            <p className="text-xs text-yellow-600 dark:text-yellow-400">Enable two-factor authentication for enhanced security</p>
                          </div>
                        </div>

                        {mfaError && (
                          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{mfaError}</p>
                          </div>
                        )}

                        {!showMfaSetup ? (
                          <button
                            onClick={handleEnableMFA}
                            disabled={mfaLoading}
                            className="w-full px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                          >
                            {mfaLoading ? (
                              <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Setting up...</span>
                              </>
                            ) : (
                              <>
                                <Smartphone className="w-5 h-5" />
                                <span>Enable MFA</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="space-y-4">
                            <div className="text-center">
                              <h3 className="text-lg font-semibold text-foreground mb-2">Scan QR Code</h3>
                              <p className="text-sm text-foreground/60 mb-4">
                                Use your authenticator app to scan this QR code
                              </p>
                              {qrCodeUrl && (
                                <div className="inline-block p-4 bg-white rounded-xl border-2 border-slate-200">
                                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`} alt="MFA QR Code" className="w-48 h-48" />
                                </div>
                              )}
                            </div>

                            <div className="space-y-3">
                              <label className="block text-sm font-semibold text-foreground">
                                Enter verification code
                              </label>
                              <input
                                type="text"
                                value={mfaToken}
                                onChange={(e) => setMfaToken(e.target.value)}
                                placeholder="000000"
                                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center text-lg tracking-widest"
                                maxLength={6}
                              />
                              <button
                                onClick={handleVerifyMFA}
                                disabled={mfaLoading || mfaToken.length !== 6}
                                className="w-full px-5 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold shadow-lg shadow-green-500/25 hover:shadow-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                              >
                                {mfaLoading ? (
                                  <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Verifying...</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Verify & Enable</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {backupCodes.length > 0 && (
                              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <h4 className="font-semibold text-foreground mb-2">Backup Codes</h4>
                                <p className="text-sm text-foreground/60 mb-3">
                                  Save these codes in a safe place. Each can only be used once.
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  {backupCodes.map((code, index) => (
                                    <div key={index} className="p-2 bg-white dark:bg-slate-700 rounded-lg font-mono text-sm text-center">
                                      {code}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">MFA Enabled</p>
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Last used: {mfaSettings.lastUsed ? new Date(mfaSettings.lastUsed).toLocaleDateString() : 'Never'}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={handleDisableMFA}
                            disabled={mfaLoading}
                            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            {mfaLoading ? (
                              <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Disabling...</span>
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4" />
                                <span>Disable MFA</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Password Management */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
                  <div className="bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent p-6 border-b border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                        <Key className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">Password Management</h2>
                        <p className="text-sm text-foreground/60">Reset your password and manage security</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <p className="text-sm font-medium text-foreground">Password Secured</p>
                      </div>
                      <p className="text-sm text-foreground/60 leading-relaxed">
                        Reset your password to maintain account security. A secure link will be sent to your email.
                      </p>
                    </div>

                    {error && (
                      <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                        </div>
                      </div>
                    )}

                    {resetEmailSent && (
                      <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl backdrop-blur-sm">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">Email Sent Successfully</p>
                            <p className="text-xs text-green-600/80 dark:text-green-400/80">
                              Check {user.email} for reset instructions
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handlePasswordResetRequest}
                      disabled={loading || resetEmailSent}
                      className="w-full px-5 py-3 bg-gradient-to-r from-accent to-accent/90 hover:from-accent-hover hover:to-accent text-white rounded-xl font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Sending...</span>
                        </>
                      ) : resetEmailSent ? (
                        <>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Email Sent</span>
                        </>
                      ) : (
                        <>
                          <Key className="w-5 h-5" />
                          <span>Request Password Reset</span>
                        </>
                      )}
                    </button>

                    <p className="text-xs text-foreground/50 text-center mt-4">
                      The reset link will expire in 1 hour
                    </p>
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent p-6 border-b border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">Active Sessions</h2>
                        <p className="text-sm text-foreground/60">Manage your logged-in devices</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {userSessions.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                        <p className="text-foreground/60">No active sessions found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {userSessions.map((session) => (
                          <div key={session.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Smartphone className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">
                                  {session.deviceInfo?.device || 'Unknown Device'}
                                </p>
                                <p className="text-sm text-foreground/60">
                                  {session.ipAddress} • {new Date(session.lastActivity).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {session.isActive && (
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                              )}
                              <button
                                onClick={() => handleRevokeSession(session.id)}
                                className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                              >
                                Revoke
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Security Events */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent p-6 border-b border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <AlertTriangle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">Recent Security Events</h2>
                        <p className="text-sm text-foreground/60">Monitor your account activity</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {securityEvents.length === 0 ? (
                      <div className="text-center py-8">
                        <AlertTriangle className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                        <p className="text-foreground/60">No security events found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {securityEvents.map((event) => (
                          <div key={event.id} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                            <div className={`w-2 h-2 rounded-full ${
                              event.severity === 'HIGH' ? 'bg-red-500' :
                              event.severity === 'MEDIUM' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}></div>
                            <div className="flex-1">
                              <p className="font-semibold text-foreground">{event.description}</p>
                              <p className="text-sm text-foreground/60">
                                {new Date(event.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              event.severity === 'HIGH' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                              event.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                              'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            }`}>
                              {event.severity}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent p-6 border-b border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">Data & Privacy</h2>
                        <p className="text-sm text-foreground/60">Manage your data and privacy preferences</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div className="text-center py-12">
                      <Eye className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">Privacy Settings</h3>
                      <p className="text-foreground/60 mb-6">
                        Privacy and data management features will be available soon.
                      </p>
                      <div className="flex gap-3 justify-center">
                        <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-foreground rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                          <Download className="w-4 h-4 mr-2 inline" />
                          Export Data
                        </button>
                        <button className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-semibold hover:bg-red-200 dark:hover:bg-red-900/30 transition-all">
                          <Trash2 className="w-4 h-4 mr-2 inline" />
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

