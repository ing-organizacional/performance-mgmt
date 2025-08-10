'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'

interface CyclesHeaderProps {
  onCreateClick: () => void
  isPending: boolean
}

export function CyclesHeader({ onCreateClick, isPending }: CyclesHeaderProps) {
  const router = useRouter()
  const { t } = useLanguage()

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="max-w-8xl mx-auto px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Left Section - Navigation & Title */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation shadow-sm"
              title={t.common?.back || 'Go back'}
              aria-label={t.common?.back || 'Go back'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="min-w-0">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {t.dashboard.performanceCycles || 'Performance Cycles'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {t.dashboard.cycleManagement || 'Manage evaluation cycles and their status'}
              </p>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={onCreateClick}
              disabled={isPending}
              className="flex items-center gap-2 px-6 py-3 min-h-[44px] bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{t.dashboard.newCycle || 'New Cycle'}</span>
            </button>
            
            <LanguageSwitcher />
            
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-red-500 text-white rounded-xl hover:bg-red-600 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm touch-manipulation"
              title={t.auth?.signOut || 'Sign Out'}
              aria-label={t.auth?.signOut || 'Sign Out'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}