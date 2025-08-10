'use client'

import { useState, useCallback } from 'react'

// Type aliases for WebAuthn API
type CredentialCreationOptions = PublicKeyCredentialCreationOptions
type CredentialRequestOptions = PublicKeyCredentialRequestOptions

interface BiometricCredential {
  id: string
  rawId: ArrayBuffer
  response: {
    clientDataJSON: ArrayBuffer
    attestationObject?: ArrayBuffer
    authenticatorData?: ArrayBuffer
    signature?: ArrayBuffer
  }
  type: 'public-key'
}

interface UseWebAuthnReturn {
  isSupported: boolean
  isCreating: boolean
  isAuthenticating: boolean
  error: string | null
  createCredential: (options: CredentialCreationOptions) => Promise<BiometricCredential | null>
  authenticate: (options: CredentialRequestOptions) => Promise<BiometricCredential | null>
  checkSupport: () => Promise<boolean>
}

// Utility functions for ArrayBuffer/base64 conversion
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

const stringToArrayBuffer = (str: string): ArrayBuffer => {
  const encoder = new TextEncoder()
  return encoder.encode(str).buffer
}

export function useWebAuthn(): UseWebAuthnReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkSupport = useCallback(async (): Promise<boolean> => {
    try {
      // Check if WebAuthn is supported
      if (!window.navigator.credentials || !window.PublicKeyCredential) {
        setIsSupported(false)
        return false
      }

      // Check if platform authenticator is available (biometric)
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      setIsSupported(available)
      return available
    } catch {
      setIsSupported(false)
      return false
    }
  }, [])

  const createCredential = useCallback(async (
    options: CredentialCreationOptions
  ): Promise<BiometricCredential | null> => {
    // Clear any previous error state
    setError(null)
    setIsCreating(true)

    try {
      const supported = await checkSupport()
      if (!supported) {
        throw new Error('WebAuthn or biometric authentication is not supported on this device')
      }

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), 60000)
      )

      const credentialPromise = navigator.credentials.create({
        publicKey: options
      }) as Promise<PublicKeyCredential>

      const credential = await Promise.race([credentialPromise, timeoutPromise])

      if (!credential) {
        throw new Error('Failed to create credential')
      }

      // Convert to our format
      const result: BiometricCredential = {
        id: credential.id,
        rawId: credential.rawId,
        response: {
          clientDataJSON: credential.response.clientDataJSON,
          attestationObject: (credential.response as AuthenticatorAttestationResponse).attestationObject
        },
        type: 'public-key'
      }

      return result
    } catch (err: unknown) {
      const error = err as Error & { name?: string }
      
      // Don't set error state for user cancellation to prevent loops
      if (error.name === 'NotAllowedError') {
        // User cancelled - this is normal behavior, don't show persistent error
        console.log('User cancelled biometric setup - this is normal')
        // Optionally show a brief message via callback instead of state
      } else {
        console.error('WebAuthn creation error:', error)
      }
      
      if (error.name === 'NotSupportedError') {
        setError('Biometric authentication is not supported on this device')
      } else if (error.name === 'SecurityError') {
        setError('Security error: Please ensure you are using HTTPS')
      } else if (error.name === 'InvalidStateError') {
        setError('A credential already exists for this account')
      } else if (error.message === 'Operation timed out') {
        setError('The operation timed out. Please try again.')
      } else {
        setError(error.message || 'Failed to set up biometric authentication')
      }
      
      return null
    } finally {
      setIsCreating(false)
    }
  }, [checkSupport])

  const authenticate = useCallback(async (
    options: CredentialRequestOptions
  ): Promise<BiometricCredential | null> => {
    setError(null)
    setIsAuthenticating(true)

    try {
      const supported = await checkSupport()
      if (!supported) {
        throw new Error('WebAuthn or biometric authentication is not supported on this device')
      }

      const credential = await navigator.credentials.get({
        publicKey: options
      }) as PublicKeyCredential

      if (!credential) {
        throw new Error('Failed to authenticate')
      }

      // Convert to our format
      const result: BiometricCredential = {
        id: credential.id,
        rawId: credential.rawId,
        response: {
          clientDataJSON: credential.response.clientDataJSON,
          authenticatorData: (credential.response as AuthenticatorAssertionResponse).authenticatorData,
          signature: (credential.response as AuthenticatorAssertionResponse).signature
        },
        type: 'public-key'
      }

      return result
    } catch (err: unknown) {
      const error = err as Error & { name?: string }
      
      // Handle user cancellation gracefully for authentication too
      if (error.name === 'NotAllowedError') {
        console.log('User cancelled biometric authentication - this is normal')
      } else {
        console.error('WebAuthn authentication error:', error)
      }
      
      // Provide user-friendly error messages
      if (error.name === 'NotSupportedError') {
        setError('Biometric authentication is not supported on this device')
      } else if (error.name === 'SecurityError') {
        setError('Security error: Please ensure you are using HTTPS')
      } else if (error.name === 'NotAllowedError') {
        // Don't set persistent error for cancellation during login
        console.log('Authentication cancelled by user')
      } else if (error.name === 'InvalidStateError') {
        setError('No biometric credentials found for this account')
      } else {
        setError(error.message || 'Failed to set up biometric authentication')
      }
      
      return null
    } finally {
      setIsAuthenticating(false)
    }
  }, [checkSupport])

  return {
    isSupported,
    isCreating,
    isAuthenticating,
    error,
    createCredential,
    authenticate,
    checkSupport
  }
}

// Export utility functions for server-side processing
export { arrayBufferToBase64, base64ToArrayBuffer, stringToArrayBuffer }