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

export default function AdvancedAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const { toasts, success, error, removeToast } = useToast()
  const { confirmState, confirm } = useConfirm()
  const [uploading, setUploading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState('')
  const [exporting, setExporting] = useState(false)

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

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        success(`${t.users.successfullyImported} ${result.imported} users`)
      } else {
        const errorData = await response.json()
        error(`${t.users.importFailed}: ${errorData.error}`)
      }
    } catch {
      error(t.users.uploadFailed)
    } finally {
      setUploading(false)
      // Reset file input
      event.target.value = ''
    }
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
      const response = await fetch('/api/admin/reset-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirm: 'RESET' }),
      })

      if (response.ok) {
        success(t.users.resetSuccess)
        setResetConfirmText('')
        // Redirect to login since all data is wiped
        setTimeout(() => {
          signOut({ callbackUrl: '/login' })
        }, 2000)
      } else {
        const errorData = await response.json()
        error(`${t.users.resetFailed}: ${errorData.error}`)
      }
    } catch {
      error(t.users.resetFailed)
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t.common.loading}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 py-3">
          {/* Title Section */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-gray-900 truncate">{t.users.advancedAdmin}</h1>
                <p className="text-xs text-gray-500">{t.users.dangerZone}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center justify-center w-9 h-9 bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-95 transition-all duration-150 touch-manipulation ml-3"
              title={t.auth.signOut}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* CSV Upload Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{t.users.importUsersCSV}</h2>
          </div>
          <div className="px-6 py-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700 mb-2">
                {t.users.uploadCSVFile}
              </label>
              <input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                disabled={uploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              {uploading && (
                <p className="text-sm text-blue-600 mt-2">{t.users.uploadingProcessing}</p>
              )}
            </div>
            <div className="text-xs text-gray-500">
              <p className="font-medium mb-1">{t.users.csvFormat}</p>
              <p>name,email,username,role,department,userType,password,employeeId,personID,managerPersonID,managerEmployeeId,companyCode</p>
              <div className="mt-2 space-y-1">
                <div>
                  <a 
                    href="/example-users.csv" 
                    download 
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    📋 {t.users.basicExampleCSV}
                  </a>
                  <span className="text-gray-400 ml-2">- {t.users.usesPersonIdMatching}</span>
                </div>
                <div>
                  <a 
                    href="/example-users-advanced.csv" 
                    download 
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    🔧 {t.users.advancedExampleCSV}
                  </a>
                  <span className="text-gray-400 ml-2">- {t.users.showsBothIdOptions}</span>
                </div>
              </div>
              <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                <p className="font-medium text-blue-800 mb-1">{t.users.fieldExplanations}</p>
                <ul className="text-blue-700 space-y-0.5">
                  <li><strong>employeeId:</strong> {t.users.employeeIdExplanation}</li>
                  <li><strong>personID:</strong> {t.users.personIdExplanation}</li>
                  <li><strong>managerPersonID:</strong> {t.users.managerPersonIdExplanation}</li>
                  <li><strong>managerEmployeeId:</strong> {t.users.managerEmployeeIdExplanation}</li>
                </ul>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Database Management Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{t.users.databaseManagement}</h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {t.users.advancedOperations}
                  </p>
                </div>
                <button
                  onClick={() => window.open(`${window.location.protocol}//${window.location.hostname}:5555`, '_blank')}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 active:scale-95 transition-all duration-150 touch-manipulation"
                >
                  {t.users.openPrismaStudio}
                </button>
              </div>
              
              {/* Export Users Section */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{t.users.exportUsers}</h3>
                    <p className="text-xs text-gray-600">
                      {t.users.exportUsersDescription}
                    </p>
                  </div>
                  <button
                    onClick={handleExportUsers}
                    disabled={exporting}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 active:scale-95 transition-all duration-150 touch-manipulation disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {exporting ? t.users.exporting : t.users.exportExcel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Database Reset Section - Danger Zone */}
        <div className="bg-red-50 rounded-lg border border-red-200 shadow-sm">
          <div className="px-6 py-4 border-b border-red-200">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <h2 className="text-lg font-semibold text-red-900">{t.users.dangerZone}</h2>
            </div>
          </div>
          <div className="px-6 py-4">
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-red-300 p-4">
              <h3 className="text-md font-semibold text-red-900 mb-2">{t.users.resetDatabaseTitle}</h3>
              <p className="text-sm text-red-700 mb-4">
                {t.users.resetDatabaseDescription}
              </p>
              
              <div className="bg-red-100 rounded-lg p-3 mb-4">
                <p className="text-sm font-bold text-red-800 mb-2">
                  {t.users.resetDatabaseWarning}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">
                    {t.users.resetDatabaseConfirm}
                  </label>
                  <input
                    type="text"
                    value={resetConfirmText}
                    onChange={(e) => setResetConfirmText(e.target.value)}
                    placeholder="RESET"
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-gray-900"
                  />
                </div>
                
                <button
                  onClick={handleDatabaseReset}
                  disabled={resetting || resetConfirmText !== 'RESET'}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-95 transition-all duration-150 touch-manipulation"
                >
                  {resetting ? t.common.loading : t.users.resetDatabaseButton}
                </button>
              </div>
            </div>
          </div>
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