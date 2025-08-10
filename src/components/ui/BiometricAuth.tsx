'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useWebAuthn, stringToArrayBuffer, arrayBufferToBase64 } from '@/hooks/useWebAuthn'
import { useToast } from '@/hooks/useToast'
import { registerBiometricCredential, authenticateWithBiometric } from '@/lib/actions/biometric'
import LoadingSpinner from './LoadingSpinner'

interface BiometricAuthProps {
  mode: 'setup' | 'login'
  userId?: string
  userName?: string
  userDisplayName?: string
  onSuccess?: (credentialId: string, user?: unknown) => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
  compact?: boolean
}

export default function BiometricAuth({
  mode,
  userId,
  userName,
  userDisplayName,
  onSuccess,
  onError,
  className = '',
  disabled = false,
  compact = false
}: BiometricAuthProps) {
  const { t } = useLanguage()
  const { success, error: showError } = useToast()
  const {
    isSupported,
    isCreating,
    isAuthenticating,
    error: _error, // eslint-disable-line @typescript-eslint/no-unused-vars -- Intentionally unused to prevent runaway loops in biometric error handling
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

  // Disable automatic error handling from hook to prevent loops
  // useEffect(() => {
  //   if (error) {
  //     onError?.(error)
  //     showError(error)
  //   }
  // }, [error, onError, showError])

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
      // Don't show error UI for user cancellation to prevent loops
      if (err instanceof Error && (err.message.includes('cancelled') || err.message.includes('not allowed'))) {
        console.log('User cancelled biometric setup - this is normal')
        return // Exit silently for cancellation
      }
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
      // Don't show error UI for user cancellation to prevent loops
      if (err instanceof Error && (err.message.includes('cancelled') || err.message.includes('not allowed'))) {
        console.log('User cancelled biometric login - this is normal')
        return // Exit silently for cancellation
      }
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
    // Use fingerprint icon for all devices
    return (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
      </svg>
    )
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
        <LoadingSpinner size="md" color="blue" />
      </div>
    )
  }

  if (!isSupported) {
    return null // Don't render if not supported
  }

  const isLoading = isCreating || isAuthenticating

  if (compact) {
    return (
      <div className="flex justify-center">
        <button
          onClick={mode === 'setup' ? handleSetupBiometric : handleBiometricLogin}
          disabled={disabled || isLoading}
          className={`flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 touch-manipulation ${
            disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
          } ${className}`}
        >
          {isLoading ? (
            <LoadingSpinner size="md" color="blue" />
          ) : (
            <div className="text-blue-600">
              {getBiometricIcon()}
            </div>
          )}
        </button>
      </div>
    )
  }

  // Full mode for settings page
  return (
    <button
      onClick={mode === 'setup' ? handleSetupBiometric : handleBiometricLogin}
      disabled={disabled || isLoading}
      className={`flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 touch-manipulation ${
        disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
      } ${className}`}
    >
      {isLoading ? (
        <LoadingSpinner size="lg" color="blue" />
      ) : (
        <div className="text-blue-600 mb-3">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
          </svg>
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