'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import CycleStatusBanner from '@/components/CycleStatusBanner'

interface Employee {
  id: string
  name: string
  department: string
  role: string
  email?: string
  _count: {
    evaluationsReceived: number
  }
  evaluationsReceived: {
    id: string
    status: string
    overallRating?: number
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
}

export default function EvaluationsClient({ 
  employees, 
  teamSummary, 
  currentCycleId, 
  userRole 
}: EvaluationsClientProps) {
  const router = useRouter()
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 py-3">
          {/* Title Section */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-gray-900 truncate">{t.nav.employeeEvaluations}</h1>
                <p className="text-xs text-gray-500">{t.nav.selectEmployee}</p>
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
                onClick={() => router.push('/evaluations/assignments')}
                className="flex items-center justify-center space-x-1 px-2 py-2 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-200 active:scale-95 transition-all duration-150 touch-manipulation whitespace-nowrap tracking-tighter leading-none"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                <span>{t.nav.assignments}</span>
              </button>
            </div>
            <LanguageSwitcher />
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

      {/* Fixed Team Summary Card */}
      <div className="sticky top-[85px] z-10 bg-gray-50 px-4 pt-3 pb-2">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-3">{t.evaluations.teamSummary}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">{teamSummary.pendingEvaluations}</div>
              <div className="text-xs text-gray-600">{t.evaluations.pendingReviews}</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                {teamSummary.averageScore > 0 ? teamSummary.averageScore.toFixed(1) : '—'}
              </div>
              <div className="text-xs text-gray-600">{t.evaluations.teamAverage}</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between text-xs">
              <span className="text-green-600">✅ {teamSummary.completedEvaluations}</span>
              <span className="text-yellow-600">🔄 {teamSummary.inProgressEvaluations}</span>
              <span className="text-gray-500">⭕ {teamSummary.totalEmployees - teamSummary.completedEvaluations - teamSummary.inProgressEvaluations}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="px-4 pb-24 space-y-3">
        {employees.map((employee) => {
          const getEvaluationStatus = () => {
            const latestEval = employee.evaluationsReceived[0]
            if (!latestEval) return { status: 'empty', icon: '⭕', color: 'text-gray-500', label: t.evaluations.notStarted }
            if (latestEval.status === 'submitted' || latestEval.status === 'approved' || latestEval.status === 'completed') {
              return { status: 'completed', icon: '✅', color: 'text-green-600', label: t.evaluations.completed }
            }
            return { status: 'inprogress', icon: '🔄', color: 'text-yellow-600', label: t.evaluations.inProgress }
          }
          
          const statusInfo = getEvaluationStatus()
          
          return (
            <div
              key={employee.id}
              onClick={() => router.push(`/evaluate/${employee.id}`)}
              className="bg-white rounded-lg border border-gray-200 p-5 min-h-[80px] shadow-sm hover:shadow-md active:scale-[0.98] active:bg-gray-50 transition-all duration-150 cursor-pointer touch-manipulation"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-medium text-gray-900 truncate">
                      {employee.name}
                    </h3>
                    <span className={`text-sm ${statusInfo.color}`}>
                      {statusInfo.icon}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {employee.department}
                  </p>
                  <p className={`text-xs ${statusInfo.color} mt-1`}>
                    {statusInfo.label}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex justify-center items-center">
          <span className="text-sm text-gray-500">{employees.length} {t.nav.employees}</span>
        </div>
      </div>
    </div>
  )
}