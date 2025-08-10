'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { PDFExportCenter } from '@/components/features/dashboard'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { CycleSelector } from '@/components/features/cycles'
import type { EvaluationCycle } from '@/types'

interface CompletionStats {
  total: number
  completed: number
  inProgress: number
  pending: number
  overdue: number
  duesSoon: number
}

interface RatingDistribution {
  outstanding: number
  exceeds: number
  meets: number
  below: number
  needs: number
}

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

interface OverdueDraft {
  id: string
  employeeName: string
  employeeDepartment: string | null
  managerName: string
  createdAt: string
  daysOverdue: number
}

interface PendingApproval {
  id: string
  employeeId: string
  employeeName: string
  employeeDepartment: string | null
  managerName: string
  submittedAt: string
  daysPending: number
}

interface DashboardClientProps {
  userRole: string
  companyId: string
  companyName: string
  completionStats: CompletionStats
  ratingDistribution: RatingDistribution
  activeCycle: EvaluationCycle | null
  allCycles: PerformanceCycle[]
  overdueDrafts: OverdueDraft[]
  pendingApprovals: PendingApproval[]
  overdueApprovalsCount: number
}

export default function DashboardClient({
  companyId,
  companyName,
  completionStats,
  ratingDistribution,
  activeCycle,
  allCycles,
  overdueDrafts,
  pendingApprovals,
  overdueApprovalsCount
}: DashboardClientProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [isExportCenterOpen, setIsExportCenterOpen] = useState(false)

  const completionPercentage = completionStats.total > 0 
    ? Math.round((completionStats.completed / completionStats.total) * 100)
    : 0

  // Calculate trend indicators
  const totalRatings = Object.values(ratingDistribution).reduce((sum, count) => sum + count, 0)
  const averageRating = totalRatings > 0 
    ? (ratingDistribution.outstanding * 5 + ratingDistribution.exceeds * 4 + ratingDistribution.meets * 3 + ratingDistribution.below * 2 + ratingDistribution.needs * 1) / totalRatings
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Enhanced Header with Better Navigation */}
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

      {/* Main Dashboard Content */}
      <main className="max-w-8xl mx-auto px-6 lg:px-8 py-8">
        
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Primary Completion Metric */}
          <Link href="/dashboard/pending" className="lg:col-span-2 group">
            <div className="bg-white rounded-2xl border border-gray-200/60 p-8 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 group">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors mb-2">
                    {t.dashboard.completionStatus}
                  </h2>
                  <p className="text-sm text-gray-600">{t.dashboard.clickToManagePending}</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-primary mb-1">{completionPercentage}%</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">{t.dashboard.completeStatus}</div>
                </div>
              </div>
              
              {/* Enhanced Progress Bar */}
              <div className="mb-6">
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="text-2xl font-bold text-green-600 mb-1">{completionStats.completed}</div>
                  <div className="text-xs font-semibold text-green-700 uppercase tracking-wide">{t.dashboard.completed}</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{completionStats.inProgress}</div>
                  <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">{t.dashboard.inProgressStatus}</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="text-2xl font-bold text-orange-600 mb-1">{completionStats.pending}</div>
                  <div className="text-xs font-semibold text-orange-700 uppercase tracking-wide">{t.dashboard.remaining}</div>
                </div>
              </div>
            </div>
          </Link>

          {/* Quick Stats Cards */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{t.dashboard.totalEmployeesHeader}</h3>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-gray-900">{completionStats.total}</div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{t.dashboard.avgRatingHeader}</h3>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
            </div>
          </div>

          {/* Performance Distribution */}
          <button 
            onClick={() => router.push('/dashboard/ratings')}
            className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 text-left"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">{t.dashboard.generalResults}</h3>
              <svg className="w-5 h-5 text-gray-400 hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            
            <div className="space-y-3">
              {[
                { 
                  key: 'outstanding', 
                  label: t.dashboard.outstanding,
                  bgClass: 'bg-emerald-50',
                  borderClass: 'border-emerald-100',
                  dotClass: 'bg-emerald-500',
                  textClass: 'text-emerald-800',
                  countClass: 'text-emerald-700',
                  barBgClass: 'bg-emerald-200',
                  barFillClass: 'bg-emerald-600'
                },
                { 
                  key: 'exceeds', 
                  label: t.dashboard.exceeds,
                  bgClass: 'bg-blue-50',
                  borderClass: 'border-blue-100',
                  dotClass: 'bg-blue-500',
                  textClass: 'text-blue-800',
                  countClass: 'text-blue-700',
                  barBgClass: 'bg-blue-200',
                  barFillClass: 'bg-blue-600'
                },
                { 
                  key: 'meets', 
                  label: t.dashboard.meets,
                  bgClass: 'bg-gray-50',
                  borderClass: 'border-gray-100',
                  dotClass: 'bg-gray-500',
                  textClass: 'text-gray-800',
                  countClass: 'text-gray-700',
                  barBgClass: 'bg-gray-200',
                  barFillClass: 'bg-gray-600'
                },
                { 
                  key: 'below', 
                  label: t.dashboard.below,
                  bgClass: 'bg-amber-50',
                  borderClass: 'border-amber-100',
                  dotClass: 'bg-amber-500',
                  textClass: 'text-amber-800',
                  countClass: 'text-amber-700',
                  barBgClass: 'bg-amber-200',
                  barFillClass: 'bg-amber-600'
                },
                { 
                  key: 'needs', 
                  label: t.dashboard.needsImprovement,
                  bgClass: 'bg-red-50',
                  borderClass: 'border-red-100',
                  dotClass: 'bg-red-500',
                  textClass: 'text-red-800',
                  countClass: 'text-red-700',
                  barBgClass: 'bg-red-200',
                  barFillClass: 'bg-red-600'
                }
              ].map(({ key, label, bgClass, borderClass, dotClass, textClass, countClass, barBgClass, barFillClass }) => {
                const count = ratingDistribution[key as keyof RatingDistribution]
                const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0
                
                return (
                  <div key={key} className={`flex items-center justify-between p-3 rounded-lg border ${bgClass} ${borderClass}`}>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${dotClass}`}></div>
                      <span className={`text-sm font-semibold ${textClass}`}>{label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-base font-bold ${countClass}`}>{count}</span>
                      <div className={`w-16 rounded-full h-2 ${barBgClass}`}>
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${barFillClass}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </button>

        </div>

        {/* Critical Actions and Status Updates */}
        <div className="space-y-6 mb-8">
          
          {/* Critical Actions */}
          {(completionStats.overdue > 0 || completionStats.duesSoon > 0) && (
            <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {t.dashboard.attentionRequired}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completionStats.overdue > 0 && (
                  <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-4"></div>
                      <div>
                        <h3 className="font-semibold text-red-800">
                          {completionStats.overdue} {t.dashboard.overdueEvaluationsCount}
                        </h3>
                        <p className="text-sm text-red-600">{t.dashboard.pastDueDate}</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
                      {t.dashboard.sendReminders}
                    </button>
                  </div>
                )}

                {completionStats.duesSoon > 0 && (
                  <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mr-4"></div>
                      <div>
                        <h3 className="font-semibold text-amber-800">
                          {completionStats.duesSoon} {t.dashboard.dueSoonCount}
                        </h3>
                        <p className="text-sm text-amber-600">{t.dashboard.dueWithinDays}</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors">
                      {t.dashboard.viewList}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Overdue Drafts and Pending Approvals Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Overdue Drafts - Enhanced Layout */}
            {overdueDrafts.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t.dashboard.overdueDrafts || 'Overdue Draft Evaluations'}
                  </h2>
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                    {overdueDrafts.length}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {overdueDrafts.slice(0, 3).map((draft) => (
                    <div key={draft.id} className="flex items-center justify-between p-4 border border-red-200 bg-red-50/50 rounded-xl hover:bg-red-50 transition-colors">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{draft.employeeName}</p>
                        <p className="text-sm text-gray-600">
                          {t.dashboard.managerLabel}: {draft.managerName} • {draft.daysOverdue} {t.dashboard.daysOverdueText}
                        </p>
                      </div>
                      <button
                        onClick={() => router.push(`/evaluate/${draft.id}`)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 hover:scale-105 transition-all duration-200"
                      >
                        Review
                      </button>
                    </div>
                  ))}
                </div>
                
                {overdueDrafts.length > 3 && (
                  <button
                    onClick={() => router.push('/dashboard/overdue')}
                    className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-semibold pt-4 border-t border-gray-200 mt-4"
                  >
                    {t.dashboard.viewAllOverdue.replace('{count}', overdueDrafts.length.toString())}
                  </button>
                )}
              </div>
            )}

            {/* Pending Approvals - Enhanced Layout */}
            {pendingApprovals.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 text-amber-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t.dashboard.pendingApprovals || 'Pending Employee Approvals'}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-semibold rounded-full">
                      {pendingApprovals.length}
                    </span>
                    {overdueApprovalsCount > 0 && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                        {overdueApprovalsCount} {t.dashboard.overdueText}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {pendingApprovals.slice(0, 3).map((approval) => (
                    <div key={approval.id} className={`flex items-center justify-between p-4 border rounded-xl hover:shadow-sm transition-all duration-200 ${
                      approval.daysPending > 3 ? 'border-red-200 bg-red-50/50' : 'border-amber-200 bg-amber-50/50'
                    }`}>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{approval.employeeName}</p>
                        <p className="text-sm text-gray-600">
                          Submitted by: {approval.managerName} • {approval.daysPending} days ago
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {approval.daysPending > 3 && (
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        )}
                        <button
                          onClick={() => router.push(`/evaluation-summary/${approval.id}`)}
                          className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 hover:scale-105 transition-all duration-200"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {pendingApprovals.length > 3 && (
                  <button
                    onClick={() => router.push('/dashboard/pending-approvals')}
                    className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-semibold pt-4 border-t border-gray-200 mt-4"
                  >
                    View all {pendingApprovals.length} pending approvals →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Administrative Actions - Full Width Bottom Section */}
        <div className="bg-white rounded-2xl border border-gray-200/60 p-8 shadow-sm mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center">
            <svg className="w-6 h-6 text-indigo-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t.dashboard.administrativeActions}
          </h2>
          
          {/* Primary Actions - Featured */}
          <div className="mb-8">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              {t.dashboard.primaryManagement}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={() => router.push('/evaluations/assignments')}
                className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-semibold text-gray-900">{t.dashboard.evaluationAssignments}</div>
                    <div className="text-sm text-gray-600">{t.dashboard.manageOkrsCompetencies}</div>
                  </div>
                </div>
                <svg className="w-6 h-6 text-blue-600 group-hover:text-blue-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button 
                onClick={() => setIsExportCenterOpen(true)}
                className="flex items-center justify-between p-6 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl hover:from-emerald-100 hover:to-green-100 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-semibold text-gray-900">{t.dashboard.pdfExportCenter}</div>
                    <div className="text-sm text-gray-600">{t.dashboard.generateReportsAnalysis}</div>
                  </div>
                </div>
                <svg className="w-6 h-6 text-emerald-600 group-hover:text-emerald-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Secondary & Tertiary Actions - Compact Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* System Administration */}
            <div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                {t.dashboard.systemAdministration}
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/users')}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-700">{t.dashboard.manageUsers}</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button 
                  onClick={() => router.push('/admin/cycles')}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-700">{t.dashboard.cycles}</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Monitoring & Analysis */}
            <div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                {t.dashboard.monitoringAnalysis}
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/dashboard/audit')}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-700">{t.dashboard.auditLogs}</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button 
                  onClick={() => router.push('/dashboard/deadlines')}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-700">{t.dashboard.deadlines}</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button 
                  onClick={() => router.push('/dashboard/ratings')}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-700">{t.dashboard.departmentRatings}</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="border-t border-gray-200/50 bg-white/80 backdrop-blur-lg mt-12">
        <div className="max-w-8xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{t.dashboard.lastUpdated}: </span>
              {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </div>
            <div className="text-xs text-gray-500">
              © 2025 - <a 
                href="https://www.ing-organizacional.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-gray-700 transition-colors font-medium"
              >
                Ingeniería Organizacional
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* PDF Export Center Modal */}
      <PDFExportCenter 
        isOpen={isExportCenterOpen}
        onClose={() => setIsExportCenterOpen(false)}
        companyId={companyId}
      />
    </div>
  )
}