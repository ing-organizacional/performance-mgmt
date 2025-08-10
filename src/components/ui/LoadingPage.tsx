'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import LoadingSpinner from './LoadingSpinner'

interface LoadingPageProps {
  message?: string
  subtitle?: string
  showLogo?: boolean
}

export default function LoadingPage({ 
  message, 
  subtitle,
  showLogo = true 
}: LoadingPageProps) {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        {/* Logo/Brand Section */}
        {showLogo && (
          <div className="mb-8 animate-in fade-in-0 duration-700">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <svg 
                className="w-8 h-8 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t.common?.loading || 'Performance Management'}
            </h1>
          </div>
        )}

        {/* Loading Animation */}
        <div className="mb-8 animate-in zoom-in-50 duration-500 delay-300">
          <div className="relative">
            {/* Main Spinner */}
            <div className="flex justify-center mb-6">
              <LoadingSpinner size="xl" color="primary" />
            </div>
            
            {/* Pulse Effect */}
            <div className="absolute inset-0 flex justify-center items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full animate-ping opacity-20" />
            </div>
          </div>
        </div>

        {/* Message Section */}
        <div className="animate-in slide-in-from-bottom-4 duration-500 delay-500">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {message || t.common?.loading || 'Loading...'}
          </h2>
          
          {subtitle && (
            <p className="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Progress Dots */}
        <div className="mt-8 flex justify-center space-x-2 animate-in fade-in-0 duration-500 delay-700">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100" />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200" />
        </div>
      </div>
    </div>
  )
}