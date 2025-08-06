'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LanguageSwitcher } from '@/components/layout'
import { useLanguage } from '@/contexts/LanguageContext'

interface PendingEmployee {
  id: string
  name: string
  department: string | null
  role: string
  manager: {
    name: string
    email: string | null
  } | null
  hasEvaluation: boolean
  evaluationId?: string
}

interface PendingEvaluationsClientProps {
  completedEmployees: PendingEmployee[]
  pendingEmployees: PendingEmployee[]
}

export default function PendingEvaluationsClient({ 
  completedEmployees, 
  pendingEmployees 
}: PendingEvaluationsClientProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [showCompleted, setShowCompleted] = useState(false)
  const [filterDepartment, setFilterDepartment] = useState<string>('all')

  // Get departments that have pending evaluations only
  const departments = Array.from(
    new Set(pendingEmployees
      .map(emp => emp.department)
      .filter(Boolean))
  ).sort()

  // Filter pending employees by department
  const filteredPendingEmployees = filterDepartment === 'all' 
    ? pendingEmployees 
    : pendingEmployees.filter(emp => emp.department === filterDepartment)

  // Filter completed employees by department  
  const filteredCompletedEmployees = filterDepartment === 'all'
    ? completedEmployees
    : completedEmployees.filter(emp => emp.department === filterDepartment)


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all duration-150 mr-3 touch-manipulation"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{t.dashboard.managePendingEvaluations}</h1>
                <p className="text-sm text-gray-500">
                  {filteredPendingEmployees.length} {t.dashboard.employeesWithoutEvaluations}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 px-4 pb-6">
        <div className="max-w-4xl mx-auto">
          
          {/* Overview Stats */}
          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg p-6 text-white mb-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">{t.dashboard.completionStatus}</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-3xl font-bold mb-1">
                  {completedEmployees.length}
                </div>
                <div className="text-orange-100 text-sm font-medium">{t.dashboard.completed}</div>
                <div className="text-orange-200 text-xs mt-1">
                  {t.evaluations.completed.toLowerCase()}
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">
                  {pendingEmployees.length}
                </div>
                <div className="text-orange-100 text-sm font-medium">{t.dashboard.pending}</div>
                <div className="text-orange-200 text-xs mt-1">
                  {t.dashboard.pending.toLowerCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <select 
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos los {t.common.department}s</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept || 'Unassigned'}>{dept || 'Unassigned'}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    showCompleted 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {showCompleted ? 'Ocultar' : 'Mostrar'} {t.dashboard.completed} ({completedEmployees.length})
                </button>
              </div>
            </div>
          </div>

          {/* Pending Evaluations */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t.dashboard.pendingEvaluations} ({filteredPendingEmployees.length})
                </h2>
              </div>

              {filteredPendingEmployees.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Todas las evaluaciones completadas!</h3>
                    <p className="text-gray-600">Excelente trabajo! Todos los empleados han sido evaluados.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPendingEmployees.map(employee => (
                    <div key={employee.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{employee.name}</h4>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                              {employee.department || 'Unassigned'}
                            </span>
                            {employee.role === 'manager' && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                {t.common.manager}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {employee.manager ? (
                              <>{t.common.manager}: {employee.manager.name}</>
                            ) : (
                              <span className="text-orange-600">Sin {t.common.manager.toLowerCase()}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/evaluate/${employee.id}`)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:scale-95 transition-all duration-150"
                        >
                          {t.dashboard.startEvaluation}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Evaluations (Collapsible) */}
            {showCompleted && filteredCompletedEmployees.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t.dashboard.completed} ({filteredCompletedEmployees.length})
                  </h2>
                </div>

                <div className="space-y-3">
                  {filteredCompletedEmployees.map(employee => (
                    <div key={employee.id} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{employee.name}</h4>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                              {employee.department || 'Unassigned'}
                            </span>
                            {employee.role === 'manager' && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                {t.common.manager}
                              </span>
                            )}
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              ✓ {t.evaluations.completed}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {t.common.manager}: {employee.manager?.name || 'Sin asignar'}
                          </div>
                        </div>
                        {employee.evaluationId && (
                          <Link
                            href={`/evaluation-summary/${employee.evaluationId}`}
                            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 active:scale-95 transition-all duration-150"
                          >
                            Ver Resultados
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}