'use client'

import { Suspense } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import SettingsClient from './SettingsClient'
import BackButton from './BackButton'
import { LoadingSpinner } from '@/components/ui'
import type { User } from 'next-auth'

interface SettingsPageContentProps {
  user: User
}

export default function SettingsPageContent({ user }: SettingsPageContentProps) {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Mobile-First Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {t.settings?.title || 'Settings'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {t.settings?.subtitle || 'Manage your profile and security settings'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-2xl mx-auto">
          <Suspense fallback={
            <div className="flex items-center justify-center p-12">
              <LoadingSpinner size="lg" color="primary" />
            </div>
          }>
            <SettingsClient user={user} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}