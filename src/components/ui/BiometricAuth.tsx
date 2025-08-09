'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useWebAuthn, stringToArrayBuffer, arrayBufferToBase64 } from '@/hooks/useWebAuthn'
import { useToast } from '@/hooks/useToast'
import { registerBiometricCredential, authenticateWithBiometric } from '@/lib/actions/biometric'

interface BiometricAuthProps {
  mode: 'setup' | 'login'
  userId?: string
  userName?: string
  userDisplayName?: string
  onSuccess?: (credentialId: string, user?: unknown) => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
}

export default function BiometricAuth({
  mode,
  userId,
  userName,
  userDisplayName,
  onSuccess,
  onError,
  className = '',
  disabled = false
}: BiometricAuthProps) {
  const { t } = useLanguage()
  const { success, error: showError } = useToast()
  const {
    isSupported,
    isCreating,
    isAuthenticating,
    error,
    createCredential,
    authenticate,
    checkSupport
  } = useWebAuthn()

  const [isChecking, setIsChecking] = useState(true)

  // Check support on mount
  useEffect(() => {
    const checkBiometricSupport = async () => {
      setIsChecking(true)
      await checkSupport()
      setIsChecking(false)
    }
    
    checkBiometricSupport()
  }, [checkSupport])

  // Handle errors from the hook
  useEffect(() => {
    if (error) {
      onError?.(error)
      showError(error)
    }
  }, [error, onError, showError])

  const generateChallenge = (): ArrayBuffer => {
    // In production, this should come from your server
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)
    return challenge.buffer
  }

  const handleSetupBiometric = async () => {
    if (!userId || !userName) {
      const errorMsg = t.biometric?.userInfoRequired || 'User information required for biometric setup'
      onError?.(errorMsg)
      showError(errorMsg)
      return
    }

    try {
      const challenge = generateChallenge()

      const credential = await createCredential({
        challenge,
        rp: {
          name: 'Performance Management System',
          id: window.location.hostname
        },
        user: {
          id: new Uint8Array(stringToArrayBuffer(userId)),
          name: userName,
          displayName: userDisplayName || userName
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          requireResidentKey: false
        },
        timeout: 60000,
        attestation: 'none'
      })

      if (credential) {
        const publicKey = arrayBufferToBase64(credential.response.attestationObject || new ArrayBuffer(0))
        
        // Register the credential with the server
        const result = await registerBiometricCredential({
          credentialId: credential.id,
          publicKey,
          deviceName: getDeviceSpecificText(),
          deviceType: getDeviceType()
        })

        if (result.success) {
          success(t.biometric?.setupSuccess || 'Biometric authentication set up successfully')
          onSuccess?.(credential.id, publicKey)
        } else {
          throw new Error(result.error || 'Registration failed')
        }
      }
    } catch (err) {
      console.error('Biometric setup failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Setup failed'
      onError?.(errorMessage)
      showError(errorMessage)
    }
  }

  const handleBiometricLogin = async () => {
    try {
      const challenge = generateChallenge()

      const credential = await authenticate({
        challenge,
        userVerification: 'required',
        timeout: 60000
      })

      if (credential) {
        // Authenticate with the server
        const result = await authenticateWithBiometric({
          credentialId: credential.id,
          signature: arrayBufferToBase64(credential.response.signature || new ArrayBuffer(0)),
          authenticatorData: arrayBufferToBase64(credential.response.authenticatorData || new ArrayBuffer(0)),
          clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON)
        })

        if (result.success) {
          success(t.biometric?.loginSuccess || 'Biometric authentication successful')
          onSuccess?.(credential.id, result.user)
        } else {
          throw new Error(result.error || 'Authentication failed')
        }
      }
    } catch (err) {
      console.error('Biometric login failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      onError?.(errorMessage)
      showError(errorMessage)
    }
  }

  const getDeviceType = (): string => {
    const userAgent = navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(userAgent)) return 'face_id'
    if (/macintosh|mac os x/.test(userAgent)) return 'touch_id'
    if (/android/.test(userAgent)) return 'fingerprint'
    return 'other'
  }

  const getBiometricIcon = () => {
    // Detect device type for appropriate icon
    const userAgent = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(userAgent)
    const isMac = /macintosh|mac os x/.test(userAgent)
    const isAndroid = /android/.test(userAgent)

    if (isIOS || isMac) {
      return (
        // Face ID / Touch ID icon
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v-.07zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      )
    } else if (isAndroid) {
      return (
        // Fingerprint icon
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm8-2v2m-6-6v6m6-4v4m-2-8v8"/>
        </svg>
      )
    } else {
      return (
        // Generic biometric icon
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
      )
    }
  }

  const getDeviceSpecificText = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(userAgent)
    const isMac = /macintosh|mac os x/.test(userAgent)
    const isAndroid = /android/.test(userAgent)

    if (isIOS) return t.biometric?.faceIdTouchId || 'Face ID / Touch ID'
    if (isMac) return t.biometric?.touchId || 'Touch ID'
    if (isAndroid) return t.biometric?.fingerprint || 'Fingerprint'
    return t.biometric?.biometric || 'Biometric Authentication'
  }

  // Don't render if not supported or still checking
  if (isChecking) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isSupported) {
    return null // Don't render if not supported
  }

  const isLoading = isCreating || isAuthenticating

  return (
    <button
      onClick={mode === 'setup' ? handleSetupBiometric : handleBiometricLogin}
      disabled={disabled || isLoading}
      className={`flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 touch-manipulation ${
        disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
      } ${className}`}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
      ) : (
        <div className="text-blue-600 mb-3">
          {getBiometricIcon()}
        </div>
      )}
      
      <div className="text-center">
        <h3 className="text-sm font-medium text-gray-900 mb-1">
          {mode === 'setup' 
            ? (t.biometric?.setup || 'Set up')
            : (t.biometric?.use || 'Use')
          } {getDeviceSpecificText()}
        </h3>
        <p className="text-xs text-gray-600">
          {mode === 'setup' 
            ? (t.biometric?.tapToSetup || 'Tap to set up biometric authentication')
            : (t.biometric?.tapToAuth || 'Tap to authenticate with biometrics')
          }
        </p>
      </div>
      
      {isLoading && (
        <p className="text-xs text-blue-600 mt-2">
          {mode === 'setup' 
            ? (t.biometric?.settingUp || 'Setting up...')
            : (t.biometric?.authenticating || 'Authenticating...')
          }
        </p>
      )}
    </button>
  )
}