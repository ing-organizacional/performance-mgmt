'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export default function BackButton() {
  const { t } = useLanguage()

  return (
    <button
      onClick={() => window.history.back()}
      className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation shadow-sm"
      title={t.common?.back || 'Go back'}
      aria-label={t.common?.back || 'Go back'}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  )
}