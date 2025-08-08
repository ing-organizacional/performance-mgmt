'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LanguageSwitcher } from '@/components/layout'
import { SearchFilterBar } from '@/components/ui'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState<string>('all')

  // Get departments that have pending evaluations only
  const departments = Array.from(
    new Set(pendingEmployees
      .map(emp => emp.department)
      .filter(Boolean))
  ).sort()

  // Filter pending employees by department and search term
  const filteredPendingEmployees = pendingEmployees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.manager?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDepartment = filterDepartment === 'all' || emp.department === filterDepartment
    
    return matchesSearch && matchesDepartment
  })

  // Filter completed employees by department and search term
  const filteredCompletedEmployees = completedEmployees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.manager?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDepartment = filterDepartment === 'all' || emp.department === filterDepartment
    
    return matchesSearch && matchesDepartment
  })


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

      <SearchFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchPlaceholder={t.dashboard.searchEmployees || "Search employees..."}
        filterValue={filterDepartment}
        setFilterValue={setFilterDepartment}
        filterOptions={[
          { value: 'all', label: t.common.allDepartments || `All ${t.common.departments}` },
          ...departments.map(dept => ({
            value: dept || 'Unassigned',
            label: dept || t.common.unassigned
          }))
        ]}
      />

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
                  {t.status.completed.toLowerCase()}
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
                <div className="space-y-3">
                  {filteredPendingEmployees.map(employee => (
                    <div key={employee.id} className="rounded-lg border border-gray-200 border-l-4 border-l-orange-500 bg-orange-50 p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">{employee.name}</h4>
                            <span className="px-2 py-0.5 bg-white text-gray-600 rounded-full text-xs font-medium border shrink-0">
                              {employee.department || t.common.unassigned}
                            </span>
                            {employee.role === 'manager' && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium shrink-0">
                                {t.common.manager}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600">
                            {employee.manager ? (
                              <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div>
                                <span className="truncate">{t.common.manager}: {employee.manager.name}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></div>
                                <span className="text-orange-600 truncate">{t.dashboard.noManagerAssigned || `No ${t.common.manager.toLowerCase()} assigned`}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/evaluate/${employee.id}`)}
                          className="px-3 py-2 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-200 active:scale-95 transition-all duration-150 touch-manipulation shrink-0 ml-3"
                        >
                          {t.dashboard.startEvaluation}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}