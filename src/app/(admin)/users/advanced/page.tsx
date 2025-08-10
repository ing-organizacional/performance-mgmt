'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { ToastContainer } from '@/components/ui'
import { ConfirmDialog } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/hooks/useConfirm'
import { exportUsersToExcel } from '@/lib/actions/export'
import { resetDatabase } from '@/lib/actions/admin'
import { CSVImportWorkflow } from '@/components/admin/CSVImportWorkflow'
import { ScheduledImportManager } from '@/components/admin/ScheduledImportManager'

export default function AdvancedAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const { toasts, success, error, removeToast } = useToast()
  const { confirmState, confirm } = useConfirm()
  const [resetting, setResetting] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState('')
  const [exporting, setExporting] = useState(false)
  const [activeTab, setActiveTab] = useState<'import' | 'scheduled' | 'database'>('import')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    const userRole = session.user?.role
    if (userRole !== 'hr') {
      router.push('/dashboard')
      return
    }
  }, [session, status, router])

  const handleImportComplete = () => {
    success(t.users.exportSuccess || 'Import completed successfully')
  }

  const handleDatabaseReset = async () => {
    if (resetConfirmText !== 'RESET') {
      error(t.users.resetDatabaseConfirm)
      return
    }

    const confirmed = await confirm({
      title: t.users.resetDatabaseTitle,
      message: t.users.resetDatabaseWarning,
      confirmText: t.users.resetDatabaseButton,
      cancelText: t.common.cancel,
      type: 'danger'
    })

    if (!confirmed) return

    setResetting(true)
    try {
      const formData = new FormData()
      formData.append('confirm', 'RESET')
      
      await resetDatabase(formData)
      
      // Server Action handles success/error via redirects
      success(t.users.resetSuccess)
      setResetConfirmText('')
      
      // Redirect to login since all data is wiped
      setTimeout(() => {
        signOut({ callbackUrl: '/login' })
      }, 2000)
      
    } catch (err: unknown) {
      if (err instanceof Error && err.message) {
        error(`${t.users.resetFailed}: ${err.message}`)
      } else {
        error(t.users.resetFailed)
      }
    } finally {
      setResetting(false)
    }
  }

  const handleExportUsers = async () => {
    setExporting(true)
    try {
      const result = await exportUsersToExcel()

      if (result.success && result.data) {
        // Convert base64 to blob and download
        const binaryString = atob(result.data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const blob = new Blob([bytes], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        })
        
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        success(t.users.exportSuccess)
      } else {
        error(result.message || t.users.exportFailed)
      }
    } catch {
      error(t.users.exportFailed)
    } finally {
      setExporting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="flex items-center gap-3 text-lg text-gray-700">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          {t.common.loading}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Enhanced Desktop-First Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-8xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left Section - Navigation & Title */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation shadow-sm"
                title={t.users.goBack}
                aria-label={t.users.goBack}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="min-w-0">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {t.users.advancedAdmin}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {t.users.configureAutomatedImports}
                </p>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-red-500 text-white rounded-xl hover:bg-red-600 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm touch-manipulation"
                title={t.users.signOut}
                aria-label={t.users.signOut}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Tab Navigation */}
      <div className="max-w-8xl mx-auto px-6 lg:px-8 py-8">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200/60 bg-gradient-to-r from-gray-50/50 to-white">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('import')}
                className={`flex-1 px-6 py-4 text-sm font-semibold border-b-2 transition-all duration-200 min-h-[44px] touch-manipulation ${
                  activeTab === 'import'
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {t.users.manualImport}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('scheduled')}
                className={`flex-1 px-6 py-4 text-sm font-semibold border-b-2 transition-all duration-200 min-h-[44px] touch-manipulation ${
                  activeTab === 'scheduled'
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t.users.scheduledImports}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('database')}
                className={`flex-1 px-6 py-4 text-sm font-semibold border-b-2 transition-all duration-200 min-h-[44px] touch-manipulation ${
                  activeTab === 'database'
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                  {t.users.databaseManagement}
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'import' && (
              <CSVImportWorkflow onImportComplete={handleImportComplete} />
            )}

            {activeTab === 'scheduled' && (
              <ScheduledImportManager onImportComplete={handleImportComplete} />
            )}

            {activeTab === 'database' && (
              <div className="space-y-8">
                {/* Database Management Section */}
                <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
                  <div className="px-8 py-6 border-b border-gray-200/60 bg-gradient-to-r from-gray-50/50 to-white">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{t.users.databaseManagement}</h2>
                        <p className="text-sm text-gray-600 mt-1">Advanced database operations and data export tools</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-8 py-8 space-y-8">
                    {/* Prisma Studio Section */}
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 rounded-xl border border-blue-200/40">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Prisma Studio</h3>
                          <p className="text-sm text-gray-600">{t.users.advancedOperations}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => window.open(`${window.location.protocol}//${window.location.hostname}:5555`, '_blank')}
                        className="flex items-center gap-2 px-6 py-3 min-h-[44px] bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm touch-manipulation"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        {t.users.openPrismaStudio}
                      </button>
                    </div>
                    
                    {/* Export Users Section */}
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50/50 to-emerald-50/30 rounded-xl border border-green-200/40">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{t.users.exportUsers}</h3>
                          <p className="text-sm text-gray-600">{t.users.exportUsersDescription}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleExportUsers}
                        disabled={exporting}
                        className="flex items-center gap-2 px-6 py-3 min-h-[44px] bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                      >
                        {exporting && (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        )}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {exporting ? t.users.exporting : t.users.exportExcel}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Enhanced Danger Zone Section */}
                <div className="bg-gradient-to-r from-red-50/80 to-orange-50/80 rounded-2xl border border-red-200/60 shadow-sm overflow-hidden">
                  <div className="px-8 py-6 border-b border-red-200/60 bg-gradient-to-r from-red-50 to-orange-50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.882 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-red-900">{t.users.dangerZone}</h2>
                        <p className="text-sm text-red-700 mt-1">Destructive operations that cannot be undone</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-8 py-8">
                    <div className="bg-white rounded-xl border border-red-200 p-6 shadow-sm">
                      <div className="flex items-start gap-4 mb-6">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-red-900 mb-2">{t.users.resetDatabaseTitle}</h3>
                          <p className="text-sm text-red-700 mb-4">
                            {t.users.resetDatabaseDescription}
                          </p>
                          
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.882 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              <div>
                                <p className="text-sm font-bold text-red-800 mb-1">
                                  {t.users.resetDatabaseWarning}
                                </p>
                                <p className="text-sm text-red-700">
                                  This action will permanently delete all users, evaluations, companies, and performance cycles.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-bold text-red-900 mb-3">
                                {t.users.resetDatabaseConfirm}
                              </label>
                              <input
                                type="text"
                                value={resetConfirmText}
                                onChange={(e) => setResetConfirmText(e.target.value)}
                                placeholder="RESET"
                                className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border-2 border-red-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500/50 transition-all duration-200 shadow-sm hover:border-red-400 touch-manipulation"
                              />
                            </div>
                            
                            <button
                              onClick={handleDatabaseReset}
                              disabled={resetting || resetConfirmText !== 'RESET'}
                              className="w-full px-6 py-4 min-h-[44px] bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-95 transition-all duration-200 shadow-sm touch-manipulation flex items-center justify-center gap-2"
                            >
                              {resetting && (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              )}
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              {resetting ? t.common.loading : t.users.resetDatabaseButton}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.options.title}
        message={confirmState.options.message}
        confirmText={confirmState.options.confirmText}
        cancelText={confirmState.options.cancelText}
        type={confirmState.options.type}
        onConfirm={confirmState.onConfirm}
        onCancel={confirmState.onCancel}
      />
    </div>
  )
}