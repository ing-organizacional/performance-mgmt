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
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 py-3">
          {/* Title Section */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Link
                href="/dashboard"
                className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-gray-900 truncate">{t.dashboard.managePendingEvaluations}</h1>
                <p className="text-xs text-gray-500">
                  {filteredPendingEmployees.length} {t.dashboard.employeesWithoutEvaluations}
                </p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto">
          
          {/* Enhanced Overview with Insights */}
          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg p-6 text-white mb-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">{t.dashboard.managePendingEvaluations}</h2>
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
            
            {/* Quick Action Indicators */}
            <div className="mt-4 pt-4 border-t border-orange-400/30">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                  <span className="text-orange-100">
                    {pendingEmployees.length} {t.dashboard.employeesWithoutEvaluations}
                  </span>
                </div>
                <div className="text-orange-200 text-xs">
                  {departments.length > 1 ? `${departments.length} ${t.common.departments}` : `1 ${t.common.department}`}
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
                  <option value="all">{t.common.allDepartments || `All ${t.common.departments}`}</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept || 'Unassigned'}>{dept || t.common.unassigned}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    showCompleted 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {showCompleted ? t.common.hide : t.common.show} {t.dashboard.completed} ({completedEmployees.length})
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t.dashboard.allEvaluationsCompleted || 'All evaluations completed!'}</h3>
                    <p className="text-gray-600">{t.dashboard.excellentWork || 'Excellent work! All employees have been evaluated.'}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPendingEmployees.map(employee => (
                    <div key={employee.id} className="rounded-lg border border-gray-200 border-l-4 border-l-orange-500 bg-orange-50 p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{employee.name}</h4>
                            <span className="px-2 py-1 bg-white text-gray-600 rounded-full text-xs font-medium border">
                              {employee.department || t.common.unassigned}
                            </span>
                            {employee.role === 'manager' && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                {t.common.manager}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {employee.manager ? (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span>{t.common.manager}: {employee.manager.name}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                <span className="text-orange-600">{t.dashboard.noManagerAssigned || `No ${t.common.manager.toLowerCase()} assigned`}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/evaluate/${employee.id}`)}
                          className="px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 active:scale-95 transition-all duration-150 touch-manipulation"
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

                <div className="space-y-4">
                  {filteredCompletedEmployees.map(employee => (
                    <div key={employee.id} className="rounded-lg border border-gray-200 border-l-4 border-l-green-500 bg-green-50 p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{employee.name}</h4>
                            <span className="px-2 py-1 bg-white text-gray-600 rounded-full text-xs font-medium border">
                              {employee.department || t.common.unassigned}
                            </span>
                            {employee.role === 'manager' && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                {t.common.manager}
                              </span>
                            )}
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {t.evaluations.completed}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <span>{t.common.manager}: {employee.manager?.name || t.common.unassigned}</span>
                            </div>
                          </div>
                        </div>
                        {employee.evaluationId && (
                          <Link
                            href={`/evaluation-summary/${employee.evaluationId}`}
                            className="px-3 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 active:scale-95 transition-all duration-150 touch-manipulation"
                          >
                            {t.dashboard.viewResults || 'View Results'}
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