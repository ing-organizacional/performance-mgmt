'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { ChevronLeft, Plus, LogOut } from 'lucide-react'

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
              <ChevronLeft className="w-5 h-5" />
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
              <Plus className="w-5 h-5" />
              <span>{t.dashboard.newCycle || 'New Cycle'}</span>
            </button>
            
            <LanguageSwitcher />
            
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-red-500 text-white rounded-xl hover:bg-red-600 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm touch-manipulation"
              title={t.auth?.signOut || 'Sign Out'}
              aria-label={t.auth?.signOut || 'Sign Out'}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}