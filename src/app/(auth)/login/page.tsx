/**
 * Login Page Component
 * 
 * Comprehensive authentication page supporting multiple login methods including traditional
 * credentials and modern biometric authentication. Provides a secure, user-friendly login
 * experience with internationalization support and development convenience features.
 * 
 * Key Features:
 * - Credential-based authentication with email/username and password
 * - Biometric authentication support (Face ID, Touch ID, fingerprint)
 * - Password visibility toggle for better user experience
 * - Form validation with real-time error feedback
 * - Internationalization support with language switching
 * - Development mode with demo credentials display
 * - Automatic session management and redirect handling
 * 
 * Authentication Methods:
 * - Traditional: Email/username + password authentication
 * - Biometric: WebAuthn-based biometric authentication for supported devices
 * - Development: Demo credentials for testing different user roles
 * 
 * Security Features:
 * - Secure credential validation with NextAuth integration
 * - Password masking with optional visibility toggle
 * - Automatic login tracking for audit purposes
 * - Error handling with user-friendly messages
 * - CSRF protection through NextAuth
 * 
 * User Experience:
 * - Responsive design for mobile and desktop
 * - Loading states during authentication
 * - Clear error messaging with internationalization
 * - Language switcher for global accessibility
 * - Direct window redirect for improved performance
 * 
 * Development Support:
 * - Demo credentials display in development mode
 * - Multiple user role examples for testing
 * - Clear role-based credential examples
 */

'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { BiometricAuth } from '@/components/ui'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        identifier,
        password,
        redirect: false
      })

      if (result?.error) {
        setError(t.auth.invalidCredentials)
        setLoading(false)
      } else {
        // Update lastLogin in the background after successful login
        fetch('/api/auth/update-last-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).catch(() => {}) // Fire and forget
        
        // Direct redirect to avoid double navigation
        window.location.href = '/'
      }
    } catch {
      setError(t.auth.loginFailed)
      setLoading(false)
    }
  }

  const handleBiometricSuccess = async (credentialId: string, user?: unknown) => {
    setLoading(true)
    setError('')

    try {
      if (user && typeof user === 'object' && 'id' in user) {
        // Biometric authentication was successful and we have user data
        // Create a session by signing in with the verified user data
        const userObj = user as { id: string; email?: string; username?: string }
        const result = await signIn('credentials', {
          identifier: userObj.email || userObj.username,
          biometricAuth: 'true',
          userId: userObj.id,
          redirect: false
        })

        if (result?.error) {
          throw new Error('Failed to create session')
        }

        // Update lastLogin in the background
        fetch('/api/auth/update-last-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).catch(() => {}) // Fire and forget
        
        // Redirect to dashboard
        window.location.href = '/'
      } else {
        // Fallback - just show success message
        setError('')
        setLoading(false)
      }
    } catch (err) {
      console.error('Biometric login error:', err)
      setError(t.biometric?.failed || 'Biometric authentication failed')
      setLoading(false)
    }
  }

  const handleBiometricError = (error: string) => {
    setError(error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Subtle overlay pattern to match ing-organizacional.com aesthetic */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-transparent to-orange-500/20 pointer-events-none" />
      
      <div className="relative z-10">
        {/* Language selector with guidance */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
          <div className="text-center mb-4">
            <p className="text-white/80 text-sm mb-3">
              {t.auth.selectLanguage}
            </p>
            <div className="flex justify-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/20">
                <LanguageSwitcher variant="orange-header" />
              </div>
            </div>
          </div>
        </div>

        {/* Main titles */}
        <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center mb-4">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight">
            {t.auth.welcomeTo}{' '}
            <span className="text-orange-400 bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
              Performa
            </span>
          </h1>
          <h2 className="text-xl md:text-2xl text-white/90 font-medium">
            {t.auth.performanceManagementSystem}
          </h2>
        </div>
      </div>

      <div className="relative z-10 mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 backdrop-blur-sm py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                {t.auth.emailOrUsername}
              </label>
              <div className="mt-1">
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm text-gray-900"
                  placeholder={t.auth.emailOrUsername}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t.auth.password}
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 pr-10 placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm text-gray-900"
                  placeholder={t.auth.password}
                  style={{ 
                    WebkitTextSecurity: showPassword ? 'none' : 'disc',
                    color: '#111827'
                  } as React.CSSProperties & { WebkitTextSecurity?: string }}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t.auth.signingIn : t.auth.signIn}
              </button>
            </div>
          </form>

          {/* Biometric Authentication Option */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white/95 px-4 py-1 text-gray-600 font-medium rounded-full border border-gray-200">
                  {t.auth.orLoginWithBiometric}
                </span>
              </div>
            </div>
            
            <div className="mt-6">
              <BiometricAuth
                mode="login"
                onSuccess={handleBiometricSuccess}
                onError={handleBiometricError}
                disabled={loading}
                compact={true}
              />
            </div>
          </div>
        </div>
        
        {/* Copyright footer */}
        <div className="mt-8 text-center">
          <p className="text-white/70 text-sm">
            {t.auth.copyright}
          </p>
          <p className="text-white/70 text-sm mt-2">
            Version 2.3.1
          </p>
        </div>
      </div>
    </div>
  )
}