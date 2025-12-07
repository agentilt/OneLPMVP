'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { AdminSidebar } from '@/components/AdminSidebar'
import { DataManagerSidebar } from '@/components/DataManagerSidebar'
import { ThemeSelector } from '@/components/ThemeSelector'
import { 
  User, Mail, Calendar, Shield, Key, Smartphone, Eye, AlertTriangle, 
  CheckCircle, Clock, Trash2, Download, Settings, ChevronRight, 
  Bell, Lock, Monitor, Activity, Database, FileText, LogOut, Target
} from 'lucide-react'

interface UserInfo {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  name: string | null
  role: string
  createdAt: Date
  emailWeeklyReports: boolean
  emailMonthlyReports: boolean
}

interface SettingsClientProps {
  user: UserInfo
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

type SettingsTab = 'profile' | 'security' | 'privacy' | 'notifications' | 'preferences' | 'policies'

export function SettingsClient({ user }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Email preferences state
  const [emailWeeklyReports, setEmailWeeklyReports] = useState(user.emailWeeklyReports)
  const [emailMonthlyReports, setEmailMonthlyReports] = useState(user.emailMonthlyReports)
  const [savingEmailPrefs, setSavingEmailPrefs] = useState(false)
  const [emailPrefsSaved, setEmailPrefsSaved] = useState(false)
  
  // Security state
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [userSessions, setUserSessions] = useState<UserSession[]>([])
  
  // Policy state
  const [policy, setPolicy] = useState<any>(null)
  const [violations, setViolations] = useState<any[]>([])
  const [loadingPolicy, setLoadingPolicy] = useState(false)
  const [savingPolicy, setSavingPolicy] = useState(false)

  // Fetch security data on component mount
  useEffect(() => {
    if (activeTab === 'security') {
      fetchSecurityData()
    }
  }, [activeTab, user.id])
  
  // Fetch policy data on component mount
  useEffect(() => {
    if (activeTab === 'policies') {
      fetchPolicyData()
    }
  }, [activeTab])

  const fetchSecurityData = async () => {
    try {
      // Fetch security events (last 10) for current user
      const eventsResponse = await fetch(`/api/admin/security?type=events&userId=${user.id}&limit=10`)
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        setSecurityEvents(eventsData.events || [])
      }

      // Fetch user sessions for current user
      const sessionsResponse = await fetch(`/api/admin/security?type=sessions&userId=${user.id}`)
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json()
        setUserSessions(sessionsData.sessions || [])
      }
    } catch (error) {
      console.error('Error fetching security data:', error)
    }
  }
  
  const fetchPolicyData = async () => {
    try {
      setLoadingPolicy(true)
      
      // Fetch policy
      const policyResponse = await fetch('/api/policies')
      if (policyResponse.ok) {
        const policyData = await policyResponse.json()
        setPolicy(policyData.policy)
      }
      
      // Fetch violations
      const violationsResponse = await fetch('/api/policies/violations')
      if (violationsResponse.ok) {
        const violationsData = await violationsResponse.json()
        setViolations(violationsData.violations || [])
      }
    } catch (error) {
      console.error('Error fetching policy data:', error)
    } finally {
      setLoadingPolicy(false)
    }
  }
  
  const handleSavePolicy = async (updatedPolicy: any) => {
    try {
      setSavingPolicy(true)
      
      const response = await fetch('/api/policies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPolicy),
      })
      
      if (response.ok) {
        const data = await response.json()
        setPolicy(data.policy)
        // Refresh violations
        await fetchPolicyData()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save policy')
      }
    } catch (error) {
      console.error('Error saving policy:', error)
      alert('Failed to save policy')
    } finally {
      setSavingPolicy(false)
    }
  }

  const handlePasswordResetRequest = async () => {
    setLoading(true)
    setPasswordError('')
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
        setPasswordError(data.error || 'Failed to send reset email')
      }
    } catch (err) {
      setPasswordError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
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

  const handleSaveEmailPreferences = async () => {
    setSavingEmailPrefs(true)
    setEmailPrefsSaved(false)
    setEmailError('')

    try {
      const response = await fetch('/api/settings/email-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailWeeklyReports,
          emailMonthlyReports,
        }),
      })

      if (response.ok) {
        setEmailPrefsSaved(true)
        setTimeout(() => setEmailPrefsSaved(false), 3000)
      } else {
        const data = await response.json()
        setEmailError(data.error || 'Failed to save email preferences')
      }
    } catch (err) {
      setEmailError('An error occurred. Please try again.')
    } finally {
      setSavingEmailPrefs(false)
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

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'Profile', icon: User },
    { id: 'security' as SettingsTab, label: 'Security', icon: Shield },
    { id: 'privacy' as SettingsTab, label: 'Privacy & Data', icon: Eye },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
    { id: 'preferences' as SettingsTab, label: 'Preferences', icon: Settings },
    { id: 'policies' as SettingsTab, label: 'Investment Policies', icon: Target },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        {renderSidebar()}
        
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8" data-animate>
              <h1 className="text-2xl font-semibold text-foreground mb-1">Settings</h1>
              <p className="text-sm text-foreground/60">
                Manage your account settings and preferences
              </p>
            </div>

            {/* Settings Layout */}
            <div className="flex gap-6">
              {/* Sidebar Navigation */}
              <div className="w-64 flex-shrink-0">
                <div data-animate data-tilt className="bg-white/80 dark:bg-slate-900/80 border border-border rounded-xl overflow-hidden sticky top-6 backdrop-blur shadow-[0_18px_55px_rgba(5,10,30,0.28)]">
                  <div className="p-4 border-b border-border/70">
                    <h2 className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">
                      Settings Menu
                    </h2>
                  </div>
                  <nav className="p-2">
                    {tabs.map((tab) => {
                      const Icon = tab.icon
                      const isActive = activeTab === tab.id
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                            isActive
                              ? 'bg-accent text-white shadow-sm'
                              : 'text-foreground/70 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-foreground'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="flex-1 text-left">{tab.label}</span>
                          {isActive && <ChevronRight className="w-4 h-4" />}
                        </button>
                      )
                    })}
                  </nav>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 min-w-0">
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    {/* Profile Information */}
                    <div data-animate data-tilt className="bg-white/80 dark:bg-slate-900/80 border border-border rounded-xl shadow-[0_18px_55px_rgba(5,10,30,0.28)] backdrop-blur">
                      <div className="p-6 border-b border-border/70">
                        <h2 className="text-lg font-semibold text-foreground">Profile Information</h2>
                        <p className="text-sm text-foreground/60 mt-1">
                          Your account details and personal information
                        </p>
                      </div>
                      <div className="p-6 space-y-6">
                        {/* Name */}
                        <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                          <div>
                            <div className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1">
                              Full Name
                            </div>
                            <div className="text-sm font-medium text-foreground">
                              {user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user.name || 'Not set'}
                            </div>
                          </div>
                        </div>

                        {/* Email */}
                        <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                          <div>
                            <div className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1">
                              Email Address
                            </div>
                            <div className="text-sm font-medium text-foreground">{user.email}</div>
                          </div>
                        </div>

                        {/* Role */}
                        <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                          <div>
                            <div className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1">
                              Account Role
                            </div>
                            <div className="text-sm font-medium text-foreground">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                {user.role}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Member Since */}
                        <div className="flex items-center justify-between py-3">
                          <div>
                            <div className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1">
                              Member Since
                            </div>
                            <div className="text-sm font-medium text-foreground">
                              {new Date(user.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                    {/* Password Section */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                        <h2 className="text-lg font-semibold text-foreground">Password</h2>
                        <p className="text-sm text-foreground/60 mt-1">
                          Manage your password and authentication settings
                        </p>
                      </div>
                      <div className="p-6">
                        {passwordError && (
                          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                            <p className="text-sm text-red-800 dark:text-red-200">{passwordError}</p>
                          </div>
                        )}

                        {resetEmailSent && (
                          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                            <p className="text-sm text-green-800 dark:text-green-200">
                              Password reset email sent. Please check your inbox.
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-foreground mb-1">Change Password</div>
                            <div className="text-xs text-foreground/60">
                              Reset your password via email verification
                            </div>
                          </div>
                          <button
                            onClick={handlePasswordResetRequest}
                            disabled={loading}
                            className="px-4 py-2 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {loading ? 'Sending...' : 'Reset Password'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Active Sessions */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-lg font-semibold text-foreground">Active Sessions</h2>
                            <p className="text-sm text-foreground/60 mt-1">
                              Manage your active sessions across devices
                            </p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            {userSessions.filter(s => s.isActive).length} Active
                          </span>
                        </div>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {userSessions.length === 0 ? (
                          <div className="p-6 text-center text-sm text-foreground/60">
                            No active sessions found
                          </div>
                        ) : (
                          userSessions.map((session) => (
                            <div key={session.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <Monitor className="w-5 h-5 text-foreground/60" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-foreground mb-1">
                                      {session.deviceInfo?.device || 'Unknown Device'}
                                    </div>
                                    <div className="text-xs text-foreground/60 space-y-0.5">
                                      <div>IP: {session.ipAddress || 'Unknown'}</div>
                                      <div>
                                        Last active: {new Date(session.lastActivity).toLocaleString()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRevokeSession(session.id)}
                                  className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                >
                                  Revoke
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Security Activity */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                        <h2 className="text-lg font-semibold text-foreground">Recent Security Activity</h2>
                        <p className="text-sm text-foreground/60 mt-1">
                          Recent security events on your account
                        </p>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {securityEvents.length === 0 ? (
                          <div className="p-6 text-center text-sm text-foreground/60">
                            No recent security events
                          </div>
                        ) : (
                          securityEvents.map((event) => (
                            <div key={event.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  event.severity === 'CRITICAL' || event.severity === 'ERROR'
                                    ? 'bg-red-100 dark:bg-red-900/30'
                                    : event.severity === 'WARNING'
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30'
                                    : 'bg-blue-100 dark:bg-blue-900/30'
                                }`}>
                                  <Activity className={`w-4 h-4 ${
                                    event.severity === 'CRITICAL' || event.severity === 'ERROR'
                                      ? 'text-red-600 dark:text-red-400'
                                      : event.severity === 'WARNING'
                                      ? 'text-yellow-600 dark:text-yellow-400'
                                      : 'text-blue-600 dark:text-blue-400'
                                  }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-foreground mb-1">
                                    {event.description}
                                  </div>
                                  <div className="text-xs text-foreground/60">
                                    {new Date(event.createdAt).toLocaleString()}
                                  </div>
                                </div>
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                  event.severity === 'CRITICAL' || event.severity === 'ERROR'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                    : event.severity === 'WARNING'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                }`}>
                                  {event.severity}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'privacy' && (
                  <div className="space-y-6">
                    {/* Data & Privacy */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                        <h2 className="text-lg font-semibold text-foreground">Data & Privacy</h2>
                        <p className="text-sm text-foreground/60 mt-1">
                          Manage your personal data and privacy settings
                        </p>
                      </div>
                      <div className="p-6 space-y-6">
                        {/* Export Data */}
                        <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-foreground mb-1">
                                Download Your Data
                              </div>
                              <div className="text-xs text-foreground/60">
                                Export all your personal data in JSON format
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => window.location.href = '/api/user/export-data'}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            Export Data
                          </button>
                        </div>

                        {/* Delete Account */}
                        <div className="flex items-center justify-between py-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-foreground mb-1">
                                Delete Account
                              </div>
                              <div className="text-xs text-foreground/60">
                                Permanently delete your account and all data
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => window.location.href = '/settings/delete-account'}
                            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                          >
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Privacy Information */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-2">Your Privacy Rights</h3>
                          <ul className="text-xs text-foreground/70 space-y-1.5">
                            <li>• Right to access your personal data</li>
                            <li>• Right to rectify inaccurate data</li>
                            <li>• Right to erasure (delete your account)</li>
                            <li>• Right to data portability (export your data)</li>
                            <li>• Right to object to data processing</li>
                          </ul>
                          <div className="mt-4">
                            <a
                              href="/legal/privacy"
                              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Read our Privacy Policy →
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    {/* Email Notifications */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                        <h2 className="text-lg font-semibold text-foreground">Email Notifications</h2>
                        <p className="text-sm text-foreground/60 mt-1">
                          Configure which emails you want to receive
                        </p>
                      </div>
                      <div className="p-6 space-y-4">
                        {emailError && (
                          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md mb-4">
                            <p className="text-sm text-red-800 dark:text-red-200">{emailError}</p>
                          </div>
                        )}

                        {emailPrefsSaved && (
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md mb-4">
                            <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Email preferences saved successfully
                            </p>
                          </div>
                        )}

                        <div className="space-y-4">
                          {/* Weekly Reports */}
                          <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                              <div className="text-sm font-medium text-foreground mb-1">
                                Weekly Portfolio Reports
                              </div>
                              <div className="text-xs text-foreground/60">
                                Receive weekly summaries of your portfolio performance
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={emailWeeklyReports}
                                onChange={(e) => setEmailWeeklyReports(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent/50 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-accent"></div>
                            </label>
                          </div>

                          {/* Monthly Reports */}
                          <div className="flex items-center justify-between py-3">
                            <div>
                              <div className="text-sm font-medium text-foreground mb-1">
                                Monthly Performance Reports
                              </div>
                              <div className="text-xs text-foreground/60">
                                Receive detailed monthly performance analytics
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={emailMonthlyReports}
                                onChange={(e) => setEmailMonthlyReports(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent/50 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-accent"></div>
                            </label>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={handleSaveEmailPreferences}
                            disabled={savingEmailPrefs}
                            className="w-full px-4 py-2 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {savingEmailPrefs ? 'Saving...' : 'Save Preferences'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    {/* Appearance */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                        <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
                        <p className="text-sm text-foreground/60 mt-1">
                          Customize how OneLP looks on your device
                        </p>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-foreground mb-1">Theme</div>
                            <div className="text-xs text-foreground/60">
                              Select your preferred color scheme
                            </div>
                          </div>
                          <ThemeSelector />
                        </div>
                      </div>
                    </div>

                    {/* Regional Settings */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                        <h2 className="text-lg font-semibold text-foreground">Regional Settings</h2>
                        <p className="text-sm text-foreground/60 mt-1">
                          Configure language, timezone, and date formats
                        </p>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                          <div>
                            <div className="text-sm font-medium text-foreground mb-1">Language</div>
                            <div className="text-xs text-foreground/60">English (US)</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                          <div>
                            <div className="text-sm font-medium text-foreground mb-1">Timezone</div>
                            <div className="text-xs text-foreground/60">
                              {Intl.DateTimeFormat().resolvedOptions().timeZone}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between py-3">
                          <div>
                            <div className="text-sm font-medium text-foreground mb-1">Date Format</div>
                            <div className="text-xs text-foreground/60">MM/DD/YYYY</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'policies' && (
                  <div className="space-y-6">
                    {/* Policy Violations Alert */}
                    {violations.length > 0 && (
                      <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 dark:from-red-500/20 dark:to-red-600/10 rounded-xl border border-red-200/60 dark:border-red-800/60 p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
                              Policy Violations Detected
                            </h4>
                            <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                              Your current portfolio has {violations.length} violation{violations.length > 1 ? 's' : ''}.
                            </p>
                            <div className="space-y-2">
                              {violations.slice(0, 3).map((violation: any, index: number) => (
                                <div key={index} className="flex items-center justify-between text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                  <span className="text-red-800 dark:text-red-200">{violation.message}</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    violation.severity === 'high' 
                                      ? 'bg-red-600 text-white' 
                                      : violation.severity === 'medium'
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-blue-600 text-white'
                                  }`}>
                                    {violation.severity.toUpperCase()}
                                  </span>
                                </div>
                              ))}
                              {violations.length > 3 && (
                                <p className="text-xs text-red-700 dark:text-red-300">
                                  +{violations.length - 3} more violations
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {loadingPolicy ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                      </div>
                    ) : policy ? (
                      <>
                        {/* Concentration Limits */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="text-lg font-semibold text-foreground">Concentration Limits</h2>
                            <p className="text-sm text-foreground/60 mt-1">
                              Set maximum exposure limits for portfolio concentration
                            </p>
                          </div>
                          <div className="p-6 space-y-4">
                            {[
                              { key: 'maxSingleFundExposure', label: 'Max Single Fund Exposure', suffix: '%' },
                              { key: 'maxGeographyExposure', label: 'Max Geography Exposure', suffix: '%' },
                              { key: 'maxSectorExposure', label: 'Max Sector Exposure', suffix: '%' },
                              { key: 'maxVintageExposure', label: 'Max Vintage Exposure', suffix: '%' },
                              { key: 'maxManagerExposure', label: 'Max Manager Exposure', suffix: '%' },
                            ].map(({ key, label, suffix }) => (
                              <div key={key} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                <label htmlFor={key} className="text-sm font-medium text-foreground">
                                  {label}
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    id={key}
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={policy[key]}
                                    onChange={(e) => setPolicy({ ...policy, [key]: parseFloat(e.target.value) })}
                                    className="w-20 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                  />
                                  <span className="text-sm text-foreground/60">{suffix}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Liquidity Constraints */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="text-lg font-semibold text-foreground">Liquidity Constraints</h2>
                            <p className="text-sm text-foreground/60 mt-1">
                              Manage liquidity requirements and unfunded commitments
                            </p>
                          </div>
                          <div className="p-6 space-y-4">
                            {[
                              { key: 'maxUnfundedCommitments', label: 'Max Unfunded Commitments', suffix: '%' },
                              { key: 'minLiquidityReserve', label: 'Min Liquidity Reserve', suffix: '%' },
                            ].map(({ key, label, suffix }) => (
                              <div key={key} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                <label htmlFor={key} className="text-sm font-medium text-foreground">
                                  {label}
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    id={key}
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={policy[key]}
                                    onChange={(e) => setPolicy({ ...policy, [key]: parseFloat(e.target.value) })}
                                    className="w-20 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                  />
                                  <span className="text-sm text-foreground/60">{suffix}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Diversification Targets */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="text-lg font-semibold text-foreground">Diversification Targets</h2>
                            <p className="text-sm text-foreground/60 mt-1">
                              Set minimum diversification requirements for your portfolio
                            </p>
                          </div>
                          <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                              <label htmlFor="minNumberOfFunds" className="text-sm font-medium text-foreground">
                                Minimum Number of Funds
                              </label>
                              <input
                                type="number"
                                id="minNumberOfFunds"
                                min="1"
                                step="1"
                                value={policy.minNumberOfFunds}
                                onChange={(e) => setPolicy({ ...policy, minNumberOfFunds: parseInt(e.target.value) })}
                                className="w-20 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                              />
                            </div>
                            <div className="flex items-center justify-between py-3">
                              <label htmlFor="targetDiversificationScore" className="text-sm font-medium text-foreground">
                                Target Diversification Score (0-1)
                              </label>
                              <input
                                type="number"
                                id="targetDiversificationScore"
                                min="0"
                                max="1"
                                step="0.1"
                                value={policy.targetDiversificationScore}
                                onChange={(e) => setPolicy({ ...policy, targetDiversificationScore: parseFloat(e.target.value) })}
                                className="w-20 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Performance Thresholds */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="text-lg font-semibold text-foreground">Performance Thresholds</h2>
                            <p className="text-sm text-foreground/60 mt-1">
                              Set minimum acceptable performance metrics
                            </p>
                          </div>
                          <div className="p-6 space-y-4">
                            {[
                              { key: 'minAcceptableTVPI', label: 'Min Acceptable TVPI', suffix: 'x' },
                              { key: 'minAcceptableDPI', label: 'Min Acceptable DPI', suffix: 'x' },
                              { key: 'minAcceptableIRR', label: 'Min Acceptable IRR', suffix: '%' },
                            ].map(({ key, label, suffix }) => (
                              <div key={key} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                <label htmlFor={key} className="text-sm font-medium text-foreground">
                                  {label}
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    id={key}
                                    min="0"
                                    step="0.1"
                                    value={policy[key]}
                                    onChange={(e) => setPolicy({ ...policy, [key]: parseFloat(e.target.value) })}
                                    className="w-20 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                  />
                                  <span className="text-sm text-foreground/60">{suffix}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Alert Preferences */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="text-lg font-semibold text-foreground">Alert Preferences</h2>
                            <p className="text-sm text-foreground/60 mt-1">
                              Configure notifications for policy violations
                            </p>
                          </div>
                          <div className="p-6 space-y-4">
                            {[
                              { key: 'enablePolicyViolationAlerts', label: 'Policy Violation Alerts', description: 'Get notified when concentration or diversification limits are breached' },
                              { key: 'enablePerformanceAlerts', label: 'Performance Alerts', description: 'Get notified when funds fall below performance thresholds' },
                              { key: 'enableLiquidityAlerts', label: 'Liquidity Alerts', description: 'Get notified about liquidity concerns and unfunded commitments' },
                            ].map(({ key, label, description }) => (
                              <div key={key} className="flex items-start justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-foreground mb-1">{label}</div>
                                  <div className="text-xs text-foreground/60">{description}</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={policy[key]}
                                    onChange={(e) => setPolicy({ ...policy, [key]: e.target.checked })}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/20 dark:peer-focus:ring-accent/40 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-accent"></div>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => fetchPolicyData()}
                            className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            Reset
                          </button>
                          <button
                            onClick={() => handleSavePolicy(policy)}
                            disabled={savingPolicy}
                            className="px-6 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {savingPolicy ? 'Saving...' : 'Save Policy'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center">
                        <Target className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No Policy Configured</h3>
                        <p className="text-sm text-foreground/60 mb-4">
                          Set up your investment policy to monitor portfolio compliance
                        </p>
                        <button
                          onClick={() => fetchPolicyData()}
                          className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
                        >
                          Create Policy
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
