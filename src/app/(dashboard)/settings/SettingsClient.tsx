'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { BiometricAuth } from '@/components/ui'
import { getBiometricCredentials, removeBiometricCredential } from '@/lib/actions/biometric'
import { useToast } from '@/hooks/useToast'
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

  useEffect(() => {
    loadCredentials()
  }, [])

  const loadCredentials = async () => {
    try {
      setLoading(true)
      const result = await getBiometricCredentials()
      if (result.success) {
        setCredentials(result.credentials || [])
      } else {
        showError(result.error || 'Failed to load credentials')
      }
    } catch (err) {
      console.error('Error loading credentials:', err)
      showError('Failed to load credentials')
    } finally {
      setLoading(false)
    }
  }

  const handleBiometricSetupSuccess = (_credentialId: string) => {
    success(t.biometric?.setupSuccess || 'Biometric authentication set up successfully')
    loadCredentials() // Reload to show the new credential
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
        showError(result.error || 'Failed to remove credential')
      }
    } catch (err) {
      console.error('Error removing credential:', err)
      showError('Failed to remove credential')
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
    <div className="space-y-8">
      {/* User Profile Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {t.settings?.profile || 'Profile'}
          </h2>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t.auth?.name || 'Name'}
              </label>
              <p className="mt-1 text-sm text-gray-900">{user.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t.auth?.email || 'Email'}
              </label>
              <p className="mt-1 text-sm text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t.auth?.role || 'Role'}
              </label>
              <p className="mt-1 text-sm text-gray-900 capitalize">{user.role}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t.common?.department || 'Department'}
              </label>
              <p className="mt-1 text-sm text-gray-900">{user.department || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Biometric Authentication Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {t.biometric?.authentication || 'Biometric Authentication'}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {t.biometric?.settingsDescription || 'Manage your biometric authentication methods for secure login'}
          </p>
        </div>
        <div className="px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Setup New Biometric */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {t.biometric?.addNew || 'Add New Biometric Authentication'}
                </h3>
                <BiometricAuth
                  mode="setup"
                  userId={user.id}
                  userName={user.email || user.name}
                  userDisplayName={user.name}
                  onSuccess={handleBiometricSetupSuccess}
                  onError={handleBiometricSetupError}
                  className="max-w-sm"
                />
              </div>

              {/* Existing Credentials */}
              {credentials.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {t.biometric?.existingCredentials || 'Your Biometric Credentials'}
                  </h3>
                  <div className="space-y-4">
                    {credentials.map((credential) => (
                      <div
                        key={credential.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          {getDeviceIcon(credential.deviceType)}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {credential.deviceName || getDeviceTypeName(credential.deviceType)}
                            </h4>
                            <p className="text-xs text-gray-600">
                              {t.common?.created || 'Created'}: {formatDate(credential.createdAt)}
                            </p>
                            <p className="text-xs text-gray-600">
                              {t.common?.lastUsed || 'Last used'}: {formatDate(credential.lastUsed)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveCredential(credential.credentialId)}
                          disabled={removing === credential.credentialId}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                        >
                          {removing === credential.credentialId ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            t.common?.remove || 'Remove'
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {credentials.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">
                    {t.biometric?.noCredentials || 'No biometric credentials set up yet'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}