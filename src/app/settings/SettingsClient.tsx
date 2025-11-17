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
  Bell, Lock, Monitor, Activity, Database, FileText, LogOut
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

type SettingsTab = 'profile' | 'security' | 'privacy' | 'notifications' | 'preferences'

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

  // Fetch security data on component mount
  useEffect(() => {
    if (activeTab === 'security') {
      fetchSecurityData()
    }
  }, [activeTab, user.id])

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
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        {renderSidebar()}
        
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-foreground mb-1">Settings</h1>
              <p className="text-sm text-foreground/60">
                Manage your account settings and preferences
              </p>
            </div>

            {/* Settings Layout */}
            <div className="flex gap-6">
              {/* Sidebar Navigation */}
              <div className="w-64 flex-shrink-0">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden sticky top-6">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800">
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
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
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
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
