'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'

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

export default function EvaluationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [teamSummary, setTeamSummary] = useState<TeamSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  const fetchTeamData = async () => {
    try {
      const response = await fetch('/api/manager/team')
      const data = await response.json()
      
      if (data.success) {
        setEmployees(data.employees)
        setTeamSummary(data.summary)
      }
    } catch (error) {
      console.error('Error fetching team data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    fetchTeamData()
  }, [session, status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t.common.loading}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{t.nav.employeeEvaluations}</h1>
              <p className="text-sm text-gray-600 mt-1">{t.nav.selectEmployee}</p>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {t.auth.signOut}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Team Summary Card */}
      {teamSummary && (
        <div className="px-4 pt-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.evaluations.teamSummary}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{teamSummary.pendingEvaluations}</div>
                <div className="text-sm text-gray-600">{t.evaluations.pendingReviews}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {teamSummary.averageScore > 0 ? teamSummary.averageScore.toFixed(1) : '—'}
                </div>
                <div className="text-sm text-gray-600">{t.evaluations.teamAverage}</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-green-600">✅ {teamSummary.completedEvaluations} {t.evaluations.completed}</span>
                <span className="text-yellow-600">🔄 {teamSummary.inProgressEvaluations} {t.evaluations.inProgress}</span>
                <span className="text-gray-500">⭕ {teamSummary.totalEmployees - teamSummary.completedEvaluations - teamSummary.inProgressEvaluations} {t.evaluations.notStarted}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee List */}
      <div className="px-4 pb-6 space-y-3">
        {employees.map((employee) => {
          const getEvaluationStatus = () => {
            const latestEval = employee.evaluationsReceived[0]
            if (!latestEval) return { status: 'empty', icon: '⭕', color: 'text-gray-500', label: t.evaluations.notStarted }
            if (latestEval.status === 'submitted' || latestEval.status === 'approved') {
              return { status: 'completed', icon: '✅', color: 'text-green-600', label: t.evaluations.completed }
            }
            return { status: 'inprogress', icon: '🔄', color: 'text-yellow-600', label: t.evaluations.inProgress }
          }
          
          const statusInfo = getEvaluationStatus()
          
          return (
            <div
              key={employee.id}
              onClick={() => router.push(`/evaluate/${employee.id}`)}
              className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm active:bg-gray-50 transition-colors cursor-pointer"
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