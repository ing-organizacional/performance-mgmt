'use client'

import { useState, useCallback } from 'react'

// Simplified interfaces that match WebAuthn API exactly
interface CredentialCreationOptions extends PublicKeyCredentialCreationOptions {}
interface CredentialRequestOptions extends PublicKeyCredentialRequestOptions {}

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
    } catch (err) {
      setIsSupported(false)
      return false
    }
  }, [])

  const createCredential = useCallback(async (
    options: CredentialCreationOptions
  ): Promise<BiometricCredential | null> => {
    setError(null)
    setIsCreating(true)

    try {
      const supported = await checkSupport()
      if (!supported) {
        throw new Error('WebAuthn or biometric authentication is not supported on this device')
      }

      const credential = await navigator.credentials.create({
        publicKey: options
      }) as PublicKeyCredential

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
    } catch (err: any) {
      console.error('WebAuthn creation error:', err)
      
      // Provide user-friendly error messages
      if (err.name === 'NotSupportedError') {
        setError('Biometric authentication is not supported on this device')
      } else if (err.name === 'SecurityError') {
        setError('Security error: Please ensure you are using HTTPS')
      } else if (err.name === 'NotAllowedError') {
        setError('Biometric authentication was cancelled or not allowed')
      } else if (err.name === 'InvalidStateError') {
        setError('A credential already exists for this account')
      } else {
        setError(err.message || 'Failed to set up biometric authentication')
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
    } catch (err: any) {
      console.error('WebAuthn authentication error:', err)
      
      // Provide user-friendly error messages
      if (err.name === 'NotSupportedError') {
        setError('Biometric authentication is not supported on this device')
      } else if (err.name === 'SecurityError') {
        setError('Security error: Please ensure you are using HTTPS')
      } else if (err.name === 'NotAllowedError') {
        setError('Biometric authentication was cancelled or not allowed')
      } else if (err.name === 'InvalidStateError') {
        setError('No biometric credentials found for this account')
      } else {
        setError(err.message || 'Failed to set up biometric authentication')
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