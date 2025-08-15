'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { CycleSelector } from '@/components/features/cycles'
import type { EvaluationCycle } from '@/types'
import { Settings, LogOut, Clipboard, FileText, Clock, RefreshCw, Menu, X } from 'lucide-react'

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-4 lg:space-x-8 flex-1">
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl lg:text-3xl font-bold text-gray-900">{t.dashboard.hrDashboard}</h1>
              <div className="mt-1">
                <p className="text-sm text-gray-600 font-medium">
                  {companyName}
                </p>
              </div>
            </div>
          </div>
          
          {/* Desktop Header Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <CycleSelector 
              showCreateButton={false} 
              onCycleSelect={() => {}}
              initialCycles={allCycles}
              selectedCycleId={activeCycle?.id || null}
            />
            <LanguageSwitcher />
            <button
              onClick={() => router.push('/settings')}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 hover:scale-105 transition-all duration-200"
              title={t.nav?.settings || 'Settings'}
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-red-500 text-white rounded-xl hover:bg-red-600 hover:scale-105 hover:shadow-lg transition-all duration-200"
              title={t.auth.signOut}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden flex items-center justify-center min-w-[44px] min-h-[44px] bg-primary text-white rounded-xl hover:bg-primary-hover transition-all duration-200"
            title="Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Desktop Navigation Bar */}
        <div className="hidden lg:block border-t border-gray-200/50 py-4">
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

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200/50">
            <div className="py-4 space-y-4">
              {/* Mobile Actions Row 1 */}
              <div className="flex items-center gap-4">
                <LanguageSwitcher />
                <button
                  onClick={() => {
                    router.push('/settings')
                    setIsMobileMenuOpen(false)
                  }}
                  className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all duration-200"
                  title={t.nav?.settings || 'Settings'}
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200"
                  title={t.auth.signOut}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Navigation Grid */}
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => {
                    router.push('/evaluations')
                    setIsMobileMenuOpen(false)
                  }}
                  className="inline-flex items-center justify-center px-4 py-4 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all duration-200 space-x-2 min-h-[44px]"
                >
                  <Clipboard className="w-4 h-4" />
                  <span>{t.nav.employeeEvaluations}</span>
                </button>
                
                <button
                  onClick={() => {
                    router.push('/my-evaluations')
                    setIsMobileMenuOpen(false)
                  }}
                  className="inline-flex items-center justify-center px-4 py-4 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-xl hover:bg-emerald-200 transition-all duration-200 space-x-2 min-h-[44px]"
                >
                  <FileText className="w-4 h-4" />
                  <span>{t.nav.myEvaluations}</span>
                </button>

                <button
                  onClick={() => {
                    router.push('/dashboard/deadlines')
                    setIsMobileMenuOpen(false)
                  }}
                  className="inline-flex items-center justify-center px-4 py-4 bg-amber-100 text-amber-700 text-sm font-semibold rounded-xl hover:bg-amber-200 transition-all duration-200 space-x-2 min-h-[44px]"
                >
                  <Clock className="w-4 h-4" />
                  <span>{t.dashboard.deadlines}</span>
                </button>

                <button
                  onClick={() => {
                    router.push('/admin/cycles')
                    setIsMobileMenuOpen(false)
                  }}
                  className="inline-flex items-center justify-center px-4 py-4 bg-primary/10 text-primary text-sm font-semibold rounded-xl hover:bg-primary/20 transition-all duration-200 space-x-2 min-h-[44px]"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{t.dashboard.cycles}</span>
                </button>
              </div>

              {/* Active Cycle Info */}
              {activeCycle && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-sm text-gray-600 font-medium">Active Cycle:</div>
                  <div className="text-base font-semibold text-gray-900">{activeCycle.name}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}