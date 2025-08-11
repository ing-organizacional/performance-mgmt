'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { CycleSelector } from '@/components/features/cycles'
import type { EvaluationCycle } from '@/types'
import { Settings, LogOut, Clipboard, FileText, Clock, RefreshCw } from 'lucide-react'

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
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center justify-center w-10 h-10 bg-red-500 text-white rounded-xl hover:bg-red-600 hover:scale-105 hover:shadow-lg transition-all duration-200"
              title={t.auth.signOut}
            >
              <LogOut className="w-5 h-5" />
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
                <Clipboard className="w-4 h-4" />
                <span>{t.nav.employeeEvaluations}</span>
              </button>
              
              <button
                onClick={() => router.push('/my-evaluations')}
                className="inline-flex items-center px-4 py-2.5 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-xl hover:bg-emerald-200 transition-all duration-200 space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>{t.nav.myEvaluations}</span>
              </button>

              <button
                onClick={() => router.push('/dashboard/deadlines')}
                className="inline-flex items-center px-4 py-2.5 bg-amber-100 text-amber-700 text-sm font-semibold rounded-xl hover:bg-amber-200 transition-all duration-200 space-x-2"
              >
                <Clock className="w-4 h-4" />
                <span>{t.dashboard.deadlines}</span>
              </button>

              <button
                onClick={() => router.push('/admin/cycles')}
                className="inline-flex items-center px-4 py-2.5 bg-primary/10 text-primary text-sm font-semibold rounded-xl hover:bg-primary/20 transition-all duration-200 space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
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