'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { CycleStatusBanner } from '@/components/features/cycles'
import { CheckCircle, RotateCcw, Circle } from 'lucide-react'

interface Employee {
  id: string
  name: string
  department: string | null
  role: string
  email?: string | null
  _count: {
    evaluationsReceived: number
  }
  evaluationsReceived: {
    id: string
    status: string
    overallRating?: number | null
    evaluationItemsData?: string | null
    createdAt: string
    updatedAt: string
  }[]
}

interface TeamSummary {
  totalEmployees: number
  pendingEvaluations: number
  completedEvaluations: number
  inProgressEvaluations: number
  averageScore: number
}

interface EvaluationsClientProps {
  employees: Employee[]
  teamSummary: TeamSummary
  currentCycleId: string | null
  userRole: string
  reopenedEvaluationsCount?: number
}

export default function EvaluationsClient({ 
  employees, 
  teamSummary, 
  currentCycleId, 
  userRole,
  reopenedEvaluationsCount = 0
}: EvaluationsClientProps) {
  const router = useRouter()
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 py-4">
          {/* Main Title Row */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg active:scale-95 transition-all duration-150 touch-manipulation"
              aria-label={t.common.back}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{t.nav.employeeEvaluations}</h1>
              <p className="text-sm text-gray-500">{t.nav.selectEmployee}</p>
            </div>
            <LanguageSwitcher />
          </div>
          
          {/* Action Buttons Row */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => router.push('/evaluations/assignments')}
              className="flex items-center gap-2 px-3 py-2 min-h-[44px] bg-primary text-white font-medium rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 touch-manipulation"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{t.nav.assignments}</span>
            </button>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/settings')}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 active:scale-95 transition-all duration-150 touch-manipulation"
                title={t.settings?.profile || 'Settings'}
                aria-label={t.settings?.profile || 'Settings'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-95 transition-all duration-150 touch-manipulation"
                title={t.auth.signOut}
                aria-label={t.auth.signOut}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cycle Status Banner */}
      <div className="px-4 pt-3">
        <CycleStatusBanner 
          cycleId={currentCycleId} 
          userRole={userRole}
        />
      </div>

      {/* Reopened Evaluations Banner */}
      {(userRole === 'manager' || userRole === 'hr') && reopenedEvaluationsCount > 0 && (
        <div className="px-4 pt-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-amber-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="flex-1">
                <span className="text-amber-900 text-sm font-medium">
                  {t.evaluations.newCompanyItemsAdded} - {reopenedEvaluationsCount} {reopenedEvaluationsCount > 1 ? t.evaluations.employeesNeedReEvaluation : t.evaluations.employeeNeedReEvaluation}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-Optimized Team Summary Card */}
      <div className="sticky top-[132px] z-10 bg-gray-50 px-4 pt-4 pb-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.evaluations.teamSummary}</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{teamSummary.pendingEvaluations}</div>
              <div className="text-sm text-amber-700 font-medium">{t.evaluations.pendingReviews}</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {teamSummary.averageScore > 0 ? teamSummary.averageScore.toFixed(1) : '—'}
              </div>
              <div className="text-sm text-blue-700 font-medium">{t.evaluations.teamAverage}</div>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm bg-gray-50 rounded-lg p-3">
            <div className="text-center flex-1">
              <div className="text-green-600 font-semibold">{teamSummary.completedEvaluations}</div>
              <div className="text-xs text-gray-600">{t.status.completed}</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-amber-600 font-semibold">{teamSummary.inProgressEvaluations}</div>
              <div className="text-xs text-gray-600">{t.status.inProgress}</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-gray-500 font-semibold">{teamSummary.totalEmployees - teamSummary.completedEvaluations - teamSummary.inProgressEvaluations}</div>
              <div className="text-xs text-gray-600">{t.status.notStarted}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="px-4 pb-24 space-y-3">
        {employees.map((employee) => {
          const getEvaluationStatus = () => {
            const latestEval = employee.evaluationsReceived[0]
            if (!latestEval) return { status: 'empty', icon: <Circle className="w-4 h-4" />, color: 'text-gray-500', label: t.status.notStarted }
            
            if (latestEval.status === 'submitted' || latestEval.status === 'approved' || latestEval.status === 'completed') {
              return { status: 'completed', icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-600', label: t.status.completed }
            }
            
            // Check if this is a reopened evaluation (draft with evaluation data that was recently updated)
            if (latestEval.status === 'draft') {
              // Simple heuristic: if it's a draft but has evaluation data, it might be reopened
              // In a real implementation, you might want a more sophisticated way to detect this
              const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
              const updatedRecently = new Date(latestEval.updatedAt || latestEval.createdAt) > oneDayAgo
              
              if (updatedRecently && latestEval.evaluationItemsData) {
                return { 
                  status: 'reopened', 
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ), 
                  color: 'text-primary', 
                  label: t.status.draftReopened 
                }
              }
            }
            
            return { status: 'inprogress', icon: <RotateCcw className="w-4 h-4" />, color: 'text-amber-600', label: t.status.inProgress }
          }
          
          const statusInfo = getEvaluationStatus()
          
          return (
            <button
              key={employee.id}
              onClick={() => router.push(`/evaluate/${employee.id}`)}
              className="w-full bg-white rounded-xl border border-gray-200 p-5 min-h-[88px] shadow-sm hover:shadow-md hover:border-blue-200 active:scale-[0.98] active:bg-blue-50 transition-all duration-200 text-left touch-manipulation"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {employee.name}
                    </h3>
                    <div className={`p-1.5 rounded-full ${statusInfo.color === 'text-green-600' ? 'bg-green-100' : statusInfo.color === 'text-amber-600' ? 'bg-amber-100' : statusInfo.color === 'text-primary' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <span className={`${statusInfo.color} flex items-center`}>
                        {typeof statusInfo.icon === 'string' ? statusInfo.icon : statusInfo.icon}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 truncate mb-1">
                    {employee.department || t.common.unassigned}
                  </p>
                  <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                    statusInfo.color === 'text-green-600' ? 'bg-green-100 text-green-700' :
                    statusInfo.color === 'text-amber-600' ? 'bg-amber-100 text-amber-700' :
                    statusInfo.color === 'text-primary' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {statusInfo.label}
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Bottom Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-4">
        <div className="text-center">
          <span className="text-sm font-medium text-gray-700">
            {employees.length} {employees.length === 1 ? 'Employee' : t.nav.employees}
          </span>
        </div>
      </div>
    </div>
  )
}