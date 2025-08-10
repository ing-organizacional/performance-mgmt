'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { CycleSelector } from '@/components/features/cycles'
import type { EvaluationCycle } from '@/types'

interface PerformanceCycle {
  id: string
  name: string
  status: string
  startDate: string
  endDate: string
  createdBy: string
  closedBy?: string | null
  closedAt?: string | null
  _count: {
    evaluations: number
    evaluationItems: number
    partialAssessments: number
  }
}

interface DashboardHeaderProps {
  companyName: string
  activeCycle: EvaluationCycle | null
  allCycles: PerformanceCycle[]
}

export function DashboardHeader({ 
  companyName, 
  activeCycle, 
  allCycles 
}: DashboardHeaderProps) {
  const router = useRouter()
  const { t } = useLanguage()

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="max-w-8xl mx-auto px-6 lg:px-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{t.dashboard.hrDashboard}</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-gray-600 font-medium">
                  {companyName}
                </p>
                {activeCycle && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    activeCycle.status === 'active' ? 'text-green-700 bg-green-100 border border-green-200' :
                    activeCycle.status === 'closed' ? 'text-red-700 bg-red-100 border border-red-200' :
                    'text-gray-700 bg-gray-100 border border-gray-200'
                  }`}>
                    {activeCycle.status === 'active' ? t.dashboard.active :
                     activeCycle.status === 'closed' ? t.dashboard.closed :
                     activeCycle.status === 'archived' ? t.dashboard.archived :
                     (activeCycle.status as string).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center gap-4">
            <CycleSelector 
              showCreateButton={false} 
              onCycleSelect={() => {}}
              initialCycles={allCycles}
              selectedCycleId={activeCycle?.id || null}
            />
            <LanguageSwitcher />
            <button
              onClick={() => router.push('/settings')}
              className="flex items-center justify-center w-10 h-10 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 hover:scale-105 transition-all duration-200"
              title={t.nav?.settings || 'Settings'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center justify-center w-10 h-10 bg-red-500 text-white rounded-xl hover:bg-red-600 hover:scale-105 hover:shadow-lg transition-all duration-200"
              title={t.auth.signOut}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="border-t border-gray-200/50 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => router.push('/evaluations')}
                className="inline-flex items-center px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 hover:shadow-lg transition-all duration-200 space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>{t.nav.employeeEvaluations}</span>
              </button>
              
              <button
                onClick={() => router.push('/my-evaluations')}
                className="inline-flex items-center px-4 py-2.5 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-xl hover:bg-emerald-200 transition-all duration-200 space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{t.nav.myEvaluations}</span>
              </button>

              <button
                onClick={() => router.push('/dashboard/deadlines')}
                className="inline-flex items-center px-4 py-2.5 bg-amber-100 text-amber-700 text-sm font-semibold rounded-xl hover:bg-amber-200 transition-all duration-200 space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{t.dashboard.deadlines}</span>
              </button>

              <button
                onClick={() => router.push('/admin/cycles')}
                className="inline-flex items-center px-4 py-2.5 bg-primary/10 text-primary text-sm font-semibold rounded-xl hover:bg-primary/20 transition-all duration-200 space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{t.dashboard.cycles}</span>
              </button>
            </div>

            <div className="text-sm text-gray-600">
              {activeCycle ? activeCycle.name : t.dashboard.noActivePerformanceCycle}
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}