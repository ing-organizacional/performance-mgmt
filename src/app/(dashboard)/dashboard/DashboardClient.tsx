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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          {/* Title Section */}
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold text-gray-900 truncate">{t.dashboard.hrDashboard}</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500">
                  {activeCycle ? activeCycle.name : 'No active performance cycle'}
                </p>
                {activeCycle && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeCycle.status === 'active' ? 'text-green-600 bg-green-100' :
                    activeCycle.status === 'closed' ? 'text-red-600 bg-red-100' :
                    'text-gray-600 bg-gray-100'
                  }`}>
                    {activeCycle.status === 'active' ? t.dashboard.active :
                     activeCycle.status === 'closed' ? t.dashboard.closed :
                     activeCycle.status === 'archived' ? t.dashboard.archived :
                     (activeCycle.status as string).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center justify-center w-9 h-9 bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-95 transition-all duration-150 touch-manipulation ml-3"
              title={t.auth.signOut}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
          
          {/* Actions Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/evaluations')}
                className="flex items-center justify-center space-x-1 px-2 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 active:scale-95 transition-all duration-150 touch-manipulation whitespace-nowrap tracking-tighter leading-none"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13.5 7a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span>{t.nav.employeeEvaluations}</span>
              </button>
              <button
                onClick={() => router.push('/my-evaluations')}
                className="flex items-center justify-center space-x-1 px-2 py-2 bg-green-100 text-green-700 text-xs font-medium rounded-lg hover:bg-green-200 active:scale-95 transition-all duration-150 touch-manipulation whitespace-nowrap tracking-tighter leading-none"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{t.nav.myEvaluations}</span>
              </button>
              <button
                onClick={() => router.push('/dashboard/deadlines')}
                className="flex items-center justify-center space-x-1 px-2 py-2 bg-orange-100 text-orange-700 text-xs font-medium rounded-lg hover:bg-orange-200 active:scale-95 transition-all duration-150 touch-manipulation whitespace-nowrap tracking-tighter leading-none"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Deadlines</span>
              </button>
              <button
                onClick={() => router.push('/admin/cycles')}
                className="flex items-center justify-center space-x-1 px-2 py-2 bg-purple-100 text-purple-700 text-xs font-medium rounded-lg hover:bg-purple-200 active:scale-95 transition-all duration-150 touch-manipulation whitespace-nowrap tracking-tighter leading-none"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
<span>{t.dashboard.cycles}</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <CycleSelector 
                showCreateButton={false} 
                onCycleSelect={() => {}} // TODO: Handle cycle changes
                initialCycles={allCycles}
                selectedCycleId={activeCycle?.id || null}
              />
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with top padding to account for fixed header */}
      <div className="pt-28 px-4 py-6 space-y-6">
        {/* Completion Overview - Clickable */}
        <Link href="/dashboard/pending" className="group">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{t.dashboard.completionStatus}</h2>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-600">{completionPercentage}%</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completionStats.completed}</div>
                <div className="text-sm text-gray-600">{t.dashboard.completed}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">{completionStats.pending}</div>
                <div className="text-sm text-gray-600">{t.dashboard.remaining}</div>
              </div>
            </div>
            
            {completionStats.pending > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-sm text-orange-600 font-medium text-center">
                  Click para gestionar {completionStats.pending} evaluaciones pendientes
                </p>
              </div>
            )}
          </div>
        </Link>

        {/* Action Items */}
        <div className="space-y-3">
          {completionStats.overdue > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {completionStats.overdue} {t.dashboard.overdueEvaluations}
                    </h3>
                    <p className="text-sm text-red-600 mt-1">
                      {t.dashboard.pastDueDate}
                    </p>
                  </div>
                </div>
                <button className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors">
                  {t.dashboard.sendReminders}
                </button>
              </div>
            </div>
          )}

          {completionStats.duesSoon > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      {completionStats.duesSoon} {t.dashboard.dueSoon}
                    </h3>
                    <p className="text-sm text-yellow-600 mt-1">
                      {t.dashboard.dueWithinDays}
                    </p>
                  </div>
                </div>
                <button className="px-3 py-1 bg-yellow-600 text-white rounded text-xs font-medium hover:bg-yellow-700 transition-colors">
                  {t.dashboard.viewList}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rating Distribution - Clickable */}
        <button 
          onClick={() => router.push('/dashboard/ratings')}
          className="w-full bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-150 text-left touch-manipulation"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t.dashboard.generalResults} - {companyName}</h2>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">{t.dashboard.outstanding}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">{ratingDistribution.outstanding}</span>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${completionStats.completed > 0 ? (ratingDistribution.outstanding / completionStats.completed) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">{t.dashboard.exceeds}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">{ratingDistribution.exceeds}</span>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${completionStats.completed > 0 ? (ratingDistribution.exceeds / completionStats.completed) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">{t.dashboard.meets}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">{ratingDistribution.meets}</span>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-500 h-2 rounded-full" 
                    style={{ width: `${completionStats.completed > 0 ? (ratingDistribution.meets / completionStats.completed) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">{t.dashboard.below}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">{ratingDistribution.below}</span>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full" 
                    style={{ width: `${completionStats.completed > 0 ? (ratingDistribution.below / completionStats.completed) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">{t.dashboard.needsImprovement}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">{ratingDistribution.needs}</span>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${completionStats.completed > 0 ? (ratingDistribution.needs / completionStats.completed) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* Overdue Drafts Section - HR Only */}
        {overdueDrafts.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t.dashboard.overdueDrafts || 'Overdue Draft Evaluations'}</h2>
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                {overdueDrafts.length} {t.dashboard.overdue || 'overdue'}
              </span>
            </div>
            <div className="space-y-2">
              {overdueDrafts.slice(0, 5).map((draft) => (
                <div key={draft.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{draft.employeeName}</p>
                    <p className="text-xs text-gray-500">
                      {t.common.manager}: {draft.managerName} • {draft.daysOverdue} {t.dashboard.daysOverdue || 'days overdue'}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/evaluate/${draft.id}`)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors"
                  >
                    {t.common.view}
                  </button>
                </div>
              ))}
              {overdueDrafts.length > 5 && (
                <button
                  onClick={() => router.push('/dashboard/overdue')}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium pt-2"
                >
                  {t.dashboard.viewAll || 'View all'} ({overdueDrafts.length})
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pending Approvals Section - HR Only */}
        {pendingApprovals.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t.dashboard.pendingApprovals || 'Pending Employee Approvals'}</h2>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                  {pendingApprovals.length} {t.dashboard.pending || 'pending'}
                </span>
                {overdueApprovalsCount > 0 && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                    {overdueApprovalsCount} {t.dashboard.overdue3Days || '>3 days'}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {pendingApprovals.slice(0, 5).map((approval) => (
                <div key={approval.id} className={`flex items-center justify-between p-3 border rounded-lg ${
                  approval.daysPending > 3 ? 'border-red-200 bg-red-50' : 'border-gray-200'
                }`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{approval.employeeName}</p>
                    <p className="text-xs text-gray-500">
                      {t.dashboard.submittedBy || 'Submitted by'}: {approval.managerName} • {approval.daysPending} {t.dashboard.daysPending || 'days ago'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {approval.daysPending > 3 && (
                      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    <button
                      onClick={() => router.push(`/evaluation-summary/${approval.id}`)}
                      className="px-3 py-1 bg-yellow-600 text-white rounded text-xs font-medium hover:bg-yellow-700 transition-colors"
                    >
                      {t.common.view}
                    </button>
                  </div>
                </div>
              ))}
              {pendingApprovals.length > 5 && (
                <button
                  onClick={() => router.push('/dashboard/pending-approvals')}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium pt-2"
                >
                  {t.dashboard.viewAll || 'View all'} ({pendingApprovals.length})
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.dashboard.administrativeActions}</h2>
          
          <div className="grid grid-cols-1 gap-3">

            <button 
              onClick={() => router.push('/dashboard/company-items')}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">{t.dashboard.companyWideItems}</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button 
              onClick={() => setIsExportCenterOpen(true)}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">{t.dashboard.pdfExportCenter}</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button 
              onClick={() => router.push('/users')}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">{t.dashboard.manageUsers}</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button 
              onClick={() => router.push('/dashboard/audit')}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Audit Logs</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push('/evaluations')}
            className="text-sm text-blue-600 font-medium"
          >
            {t.dashboard.startEvaluating}
          </button>
          <span className="text-sm text-gray-500">
            {t.dashboard.lastUpdated}: {new Date().toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* PDF Export Center Modal */}
      <PDFExportCenter 
        isOpen={isExportCenterOpen}
        onClose={() => setIsExportCenterOpen(false)}
        companyId={companyId}
      />
    </div>
  )
}