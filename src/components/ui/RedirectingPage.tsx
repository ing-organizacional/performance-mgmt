'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import LoadingSpinner from './LoadingSpinner'

interface RedirectingPageProps {
  message?: string
  destination?: string
  countdown?: number
  showSuccess?: boolean
}

export default function RedirectingPage({ 
  message, 
  destination,
  countdown,
  showSuccess = false
}: RedirectingPageProps) {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-2xl text-center max-w-md w-full animate-in fade-in-0 zoom-in-95 duration-500">
        
        {/* Success Icon or Redirect Icon */}
        <div className="mb-6">
          {showSuccess ? (
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-4 animate-in zoom-in-0 duration-700 delay-200">
              <svg 
                className="h-10 w-10 text-green-600 animate-in scale-in-0 duration-500 delay-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 mb-4 animate-in zoom-in-0 duration-700 delay-200">
              <svg 
                className="h-10 w-10 text-blue-600 animate-in scale-in-0 duration-500 delay-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 mb-3 animate-in slide-in-from-bottom-4 duration-500 delay-300">
          {message || t.evaluations?.redirecting || 'Redirecting...'}
        </h2>
        
        {/* Destination */}
        {destination && (
          <p className="text-gray-600 mb-6 animate-in slide-in-from-bottom-4 duration-500 delay-400">
            Taking you to {destination}
          </p>
        )}

        {/* Countdown */}
        {countdown && countdown > 0 && (
          <div className="mb-6 animate-in slide-in-from-bottom-4 duration-500 delay-500">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {countdown}
            </div>
            <div className="text-sm text-gray-500">
              {countdown === 1 ? 'second' : 'seconds'} remaining
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        <div className="flex items-center justify-center animate-in slide-in-from-bottom-4 duration-500 delay-600">
          <LoadingSpinner size="md" color={showSuccess ? 'green' : 'blue'} />
          <span className="ml-3 text-sm text-gray-500">
            {t.evaluations?.redirecting || 'Redirecting...'}
          </span>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-100 rounded-full opacity-20 animate-pulse" />
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-green-100 rounded-full opacity-20 animate-pulse delay-1000" />
        </div>
      </div>
    </div>
  )
}