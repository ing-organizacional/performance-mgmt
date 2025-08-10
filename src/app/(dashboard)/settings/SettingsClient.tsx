'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { BiometricAuth, LoadingSpinner } from '@/components/ui'
import { getBiometricCredentials, removeBiometricCredential } from '@/lib/actions/biometric'
import { useToast } from '@/hooks/useToast'
import ChangePasswordModal from './ChangePasswordModal'
import type { User } from 'next-auth'

interface BiometricCredential {
  id: string
  credentialId: string
  deviceName: string | null
  deviceType: string
  lastUsed: Date | null
  createdAt: Date
}

interface SettingsClientProps {
  user: User
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const { t } = useLanguage()
  const { success, error: showError } = useToast()
  const [credentials, setCredentials] = useState<BiometricCredential[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)
  const [showChangePassword, setShowChangePassword] = useState(false)

  const loadCredentials = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getBiometricCredentials()
      if (result.success) {
        setCredentials(result.credentials || [])
      } else {
        showError(result.error || t.settings?.failedToLoadCredentials || 'Failed to load credentials')
      }
    } catch (err) {
      console.error('Error loading credentials:', err)
      showError(t.settings?.failedToLoadCredentials || 'Failed to load credentials')
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    loadCredentials()
  }, [loadCredentials])

  const handleBiometricSetupSuccess = () => {
    success(t.biometric?.setupSuccess || 'Biometric authentication set up successfully')
    loadCredentials() // Reload to show the new credential
  }

  const handlePasswordChangeSuccess = () => {
    // No need to refresh page for password changes
    // The success message is handled in the modal
  }

  const handleBiometricSetupError = (error: string) => {
    showError(error)
  }

  const handleRemoveCredential = async (credentialId: string) => {
    if (!confirm(t.biometric?.confirmRemove || 'Are you sure you want to remove this biometric credential?')) {
      return
    }

    try {
      setRemoving(credentialId)
      const result = await removeBiometricCredential(credentialId)
      
      if (result.success) {
        success(t.biometric?.removeSuccess || 'Biometric credential removed successfully')
        setCredentials(prev => prev.filter(cred => cred.credentialId !== credentialId))
      } else {
        showError(result.error || t.settings?.failedToRemoveCredential || 'Failed to remove credential')
      }
    } catch (err) {
      console.error('Error removing credential:', err)
      showError(t.settings?.failedToRemoveCredential || 'Failed to remove credential')
    } finally {
      setRemoving(null)
    }
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'face_id':
        return (
          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v-.07zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        )
      case 'touch_id':
        return (
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm8-2v2m-6-6v6m6-4v4m-2-8v8"/>
          </svg>
        )
      case 'fingerprint':
        return (
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm8-2v2m-6-6v6m6-4v4m-2-8v8"/>
          </svg>
        )
      default:
        return (
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        )
    }
  }

  const getDeviceTypeName = (deviceType: string) => {
    switch (deviceType) {
      case 'face_id': return t.biometric?.faceId || 'Face ID'
      case 'touch_id': return t.biometric?.touchId || 'Touch ID'
      case 'fingerprint': return t.biometric?.fingerprint || 'Fingerprint'
      default: return t.biometric?.biometric || 'Biometric'
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return t.common?.never || 'Never'
    return new Date(date).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* User Profile Section - Mobile-First Design */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm">
        <div className="px-6 py-5 border-b border-gray-200/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {t.settings?.profile || 'Profile'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{t.settings?.profileDescription || 'Your personal information and account details'}</p>
            </div>
            <button
              onClick={() => setShowChangePassword(true)}
              className="inline-flex items-center justify-center px-4 py-3 min-h-[44px] text-sm font-semibold text-primary bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary/20 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {t.settings?.changePassword || 'Change Password'}
            </button>
          </div>
        </div>
        <div className="px-6 py-6">
          <div className="space-y-6">
            {/* Name and Position Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t.auth?.name || 'Name'}
                </label>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-900 font-medium">{user.name}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t.users?.position || 'Position'}
                </label>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-900 font-medium">{user.position || t.common?.na || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.auth?.email || 'Email'}
              </label>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-900 font-medium">{user.email}</p>
              </div>
            </div>

            {/* Department and Role Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t.common?.department || 'Department'}
                </label>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-900 font-medium">{user.department || t.common?.na || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t.auth?.role || 'Role'}
                </label>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-900 font-medium capitalize">{user.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Biometric Authentication Section - Enhanced Mobile Design */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm">
        <div className="px-6 py-5 border-b border-gray-200/50">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900">
                {t.biometric?.authentication || 'Biometric Authentication'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {t.biometric?.settingsDescription || 'Manage your biometric authentication methods for secure login'}
              </p>
            </div>
          </div>
        </div>
        <div className="px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" color="primary" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Setup New Biometric */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  {t.biometric?.addNew || 'Add New Biometric Authentication'}
                </h3>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <BiometricAuth
                    mode="setup"
                    userId={user.id}
                    userName={user.email || user.name}
                    userDisplayName={user.name}
                    onSuccess={handleBiometricSetupSuccess}
                    onError={handleBiometricSetupError}
                    className="w-full max-w-none"
                  />
                </div>
              </div>

              {/* Existing Credentials */}
              {credentials.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    {t.biometric?.existingCredentials || 'Your Biometric Credentials'}
                  </h3>
                  <div className="space-y-3">
                    {credentials.map((credential) => (
                      <div
                        key={credential.id}
                        className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            {getDeviceIcon(credential.deviceType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {credential.deviceName || getDeviceTypeName(credential.deviceType)}
                            </h4>
                            <div className="space-y-1 mt-1">
                              <p className="text-xs text-gray-600">
                                {t.common?.created || 'Created'}: {formatDate(credential.createdAt)}
                              </p>
                              <p className="text-xs text-gray-600">
                                {t.common?.lastUsed || 'Last used'}: {formatDate(credential.lastUsed)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveCredential(credential.credentialId)}
                          disabled={removing === credential.credentialId}
                          className="flex items-center justify-center px-4 py-2 min-h-[44px] text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                        >
                          {removing === credential.credentialId ? (
                            <LoadingSpinner size="sm" color="red" />
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              {t.common?.remove || 'Remove'}
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {credentials.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    {t.settings?.noCredentials || 'No biometric credentials set up yet'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t.settings?.noCredentialsDescription || 'Set up biometric authentication above to enhance your account security'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        user={user}
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSuccess={handlePasswordChangeSuccess}
      />
    </div>
  )
}