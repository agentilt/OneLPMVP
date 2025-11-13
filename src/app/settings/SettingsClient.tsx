'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { AdminSidebar } from '@/components/AdminSidebar'
import { DataManagerSidebar } from '@/components/DataManagerSidebar'
import { ThemeSelector } from '@/components/ThemeSelector'
import { User, Mail, Calendar, Shield, Key, Smartphone, Eye, AlertTriangle, CheckCircle, Clock, Trash2, Download, Settings, ChevronDown } from 'lucide-react'

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

export function SettingsClient({ user }: SettingsClientProps) {
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openSections, setOpenSections] = useState<string[]>([])
  
  // Email preferences state
  const [emailWeeklyReports, setEmailWeeklyReports] = useState(user.emailWeeklyReports)
  const [emailMonthlyReports, setEmailMonthlyReports] = useState(user.emailMonthlyReports)
  const [savingEmailPrefs, setSavingEmailPrefs] = useState(false)
  const [emailPrefsSaved, setEmailPrefsSaved] = useState(false)
  const [emailPrefsOpen, setEmailPrefsOpen] = useState(false)
  
  // Security state
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [userSessions, setUserSessions] = useState<UserSession[]>([])

  // Fetch security data on component mount
  useEffect(() => {
    fetchSecurityData()
  }, [user.id])

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
        // Close the editor after a brief delay
        setTimeout(() => {
          setEmailPrefsOpen(false)
          setEmailPrefsSaved(false)
        }, 1500)
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

  const toggleSection = (id: string) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((section) => section !== id) : [...prev, id]
    )
  }

  const isSectionOpen = (id: string) => openSections.includes(id)

  const SettingsSection = ({
    id,
    title,
    description,
    icon: Icon,
    accent,
    children
  }: {
    id: string
    title: string
    description: string
    icon: any
    accent: string
    children: React.ReactNode
  }) => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between px-6 py-5 text-left transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/60"
      >
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-lg shadow-black/10`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            <p className="text-sm text-foreground/60">{description}</p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-foreground/50 transition-transform ${isSectionOpen(id) ? 'rotate-180' : ''}`}
        />
      </button>
      {isSectionOpen(id) && (
        <div className="border-t border-slate-200/60 dark:border-slate-800/60">
          {children}
        </div>
      )}
    </div>
  )

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

            <div className="space-y-6">
              <SettingsSection
                id="profile"
                title="Profile Information"
                description="Your account details and personal information"
                icon={User}
                accent="from-accent to-accent/80"
              >
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
              </SettingsSection>

              <SettingsSection
                id="appearance"
                title="Appearance"
                description="Customize your dashboard theme"
                icon={Eye}
                accent="from-purple-500 to-purple-600"
              >
                <div className="p-6">
                  <ThemeSelector />
                </div>
              </SettingsSection>

              <SettingsSection
                id="security-overview"
                title="Security Overview"
                description="Review your account security status"
                icon={Shield}
                accent="from-green-500 to-green-600"
              >
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
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

              </SettingsSection>

              <SettingsSection
                id="password-management"
                title="Password & Security"
                description="Manage password reset and security options"
                icon={Key}
                accent="from-red-500 to-red-600"
              >
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

                  {passwordError && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium">{passwordError}</p>
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
              </SettingsSection>

              <SettingsSection
                id="active-sessions"
                title="Active Sessions"
                description="Manage your logged-in devices"
                icon={Clock}
                accent="from-purple-500 to-purple-600"
              >
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
              </SettingsSection>

              <SettingsSection
                id="security-events"
                title="Recent Security Events"
                description="Monitor important security activity on your account"
                icon={AlertTriangle}
                accent="from-orange-500 to-orange-600"
              >
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
              </SettingsSection>

              <SettingsSection
                id="email-preferences"
                title="Email Preferences"
                description="Choose how often you'd like to receive reports"
                icon={Mail}
                accent="from-blue-500 to-blue-600"
              >
                <div className="p-6 space-y-6">
                  {emailPrefsOpen ? (
                    <>
                      {emailError && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                          <p className="text-sm text-red-600 dark:text-red-400 font-medium">{emailError}</p>
                        </div>
                      )}

                      {emailPrefsSaved && (
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Email preferences saved successfully
                          </p>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                          <input
                            id="settings-emailWeekly"
                            type="checkbox"
                            checked={emailWeeklyReports}
                            onChange={(e) => setEmailWeeklyReports(e.target.checked)}
                            className="mt-1 w-5 h-5 text-accent border-2 border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-accent focus:ring-offset-0 cursor-pointer"
                          />
                          <div className="flex-1">
                            <label htmlFor="settings-emailWeekly" className="text-base font-semibold text-foreground cursor-pointer block mb-1">
                              Weekly Portfolio Reports
                            </label>
                            <p className="text-sm text-foreground/60">
                              Receive a weekly email summary of your portfolio performance and updates
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                          <input
                            id="settings-emailMonthly"
                            type="checkbox"
                            checked={emailMonthlyReports}
                            onChange={(e) => setEmailMonthlyReports(e.target.checked)}
                            className="mt-1 w-5 h-5 text-accent border-2 border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-accent focus:ring-offset-0 cursor-pointer"
                          />
                          <div className="flex-1">
                            <label htmlFor="settings-emailMonthly" className="text-base font-semibold text-foreground cursor-pointer block mb-1">
                              Monthly Portfolio Reports
                            </label>
                            <p className="text-sm text-foreground/60">
                              Receive a comprehensive monthly email report with detailed portfolio analytics
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex gap-3">
                        <button
                          onClick={() => {
                            setEmailPrefsOpen(false)
                            setEmailError('')
                            // Reset to original values
                            setEmailWeeklyReports(user.emailWeeklyReports)
                            setEmailMonthlyReports(user.emailMonthlyReports)
                          }}
                          className="flex-1 py-3 px-6 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-foreground rounded-xl font-semibold transition-all duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEmailPreferences}
                          disabled={savingEmailPrefs}
                          className="flex-1 py-3 px-6 bg-gradient-to-r from-accent to-accent/90 hover:from-accent-hover hover:to-accent text-white rounded-xl font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          {savingEmailPrefs ? (
                            <>
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Saving...</span>
                            </>
                          ) : emailPrefsSaved ? (
                            <>
                              <CheckCircle className="w-5 h-5" />
                              <span>Saved</span>
                            </>
                          ) : (
                            <>
                              <span>Save Preferences</span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col gap-6">
                      <div className="px-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                          <div>
                            <p className="text-sm font-semibold text-foreground mb-1">Current Preferences</p>
                            <div className="flex flex-wrap gap-3 text-sm text-foreground/60">
                              {emailWeeklyReports && (
                                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg font-medium">
                                  Weekly Reports
                                </span>
                              )}
                              {emailMonthlyReports && (
                                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-lg font-medium">
                                  Monthly Reports
                                </span>
                              )}
                              {!emailWeeklyReports && !emailMonthlyReports && (
                                <span className="text-foreground/40 italic">No email preferences set</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => setEmailPrefsOpen(true)}
                            className="px-4 py-2 bg-gradient-to-r from-accent to-accent/90 hover:from-accent-hover hover:to-accent text-white rounded-xl font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                          >
                            <Settings className="w-4 h-4" />
                            Manage Preferences
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </SettingsSection>

              <SettingsSection
                id="privacy"
                title="Data & Privacy"
                description="Manage your data and privacy preferences"
                icon={Eye}
                accent="from-green-500 to-green-600"
              >
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
              </SettingsSection>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

