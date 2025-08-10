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



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Enhanced Desktop-First Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-8xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left Section - Navigation & Title */}
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation shadow-sm"
                title={t.common.back}
                aria-label={t.common.back}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              
              <div className="min-w-0">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {t.dashboard.managePendingEvaluations}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredPendingEmployees.length} {t.dashboard.employeesWithoutEvaluations}
                </p>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Search and Filter Section */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-[92px] z-30 shadow-sm">
        <div className="max-w-8xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Search Input */}
            <div className="flex-1 relative">
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={t.dashboard.searchEmployeesManagers || "Search employees, managers..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md hover:border-gray-300 touch-manipulation"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 min-w-[32px] min-h-[32px] text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 touch-manipulation"
                    title={t.dashboard.clearSearch}
                    aria-label={t.dashboard.clearSearch}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            {/* Department Filter */}
            <div className="relative">
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="appearance-none px-6 py-3 pr-10 min-h-[44px] min-w-[160px] text-base text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md hover:border-gray-300 cursor-pointer touch-manipulation"
              >
                <option value="all">{t.dashboard.allDepartments || 'All Departments'}</option>
                {departments.map(dept => (
                  <option key={dept || 'unassigned'} value={dept || 'Unassigned'}>
                    {dept || t.common.unassigned}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {/* Results Count - Desktop Only */}
            <div className="hidden lg:flex items-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-sm font-medium text-gray-600">
                {filteredPendingEmployees.length} {filteredPendingEmployees.length === 1 ? t.dashboard.employeeSingular : t.dashboard.employeesPlural}
              </span>
            </div>
          </div>
          
          {/* Mobile Results Count */}
          <div className="lg:hidden mt-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl">
            <span className="text-sm font-medium text-gray-600">
              {filteredPendingEmployees.length} {filteredPendingEmployees.length === 1 ? t.dashboard.employeeSingular : t.dashboard.employeesPlural} {t.dashboard.pendingText}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-8xl mx-auto px-6 lg:px-8 py-8">
        {/* Enhanced Overview Section */}
        <div className="bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 rounded-2xl p-8 text-white mb-8 shadow-lg">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">{t.dashboard.pendingEvaluations}</h2>
              <p className="text-orange-100 text-sm">{t.dashboard.employeeEvaluationManagement}</p>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl font-bold mb-2">
                {completedEmployees.length}
              </div>
              <div className="text-orange-100 text-sm font-semibold mb-1">{t.dashboard.completed}</div>
              <div className="text-orange-200 text-xs">
                {t.dashboard.evaluationsFinished}
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl font-bold mb-2">
                {pendingEmployees.length}
              </div>
              <div className="text-orange-100 text-sm font-semibold mb-1">{t.dashboard.pending}</div>
              <div className="text-orange-200 text-xs">
                {t.dashboard.awaitingEvaluation}
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl font-bold mb-2">
                {departments.length}
              </div>
              <div className="text-orange-100 text-sm font-semibold mb-1">{t.dashboard.departmentsHeader}</div>
              <div className="text-orange-200 text-xs">
                {t.dashboard.withPendingWork}
              </div>
            </div>
          </div>
        </div>


        {/* Enhanced Pending Evaluations Section */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          {/* Section Header */}
          <div className="px-8 py-6 border-b border-gray-200/60 bg-gradient-to-r from-gray-50/50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {t.dashboard.pendingEvaluations}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredPendingEmployees.length} {filteredPendingEmployees.length === 1 ? t.dashboard.employeeSingular : t.dashboard.employeesPlural} {t.dashboard.awaitingEvaluationText}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            {filteredPendingEmployees.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t.dashboard.allEvaluationsCompleted || 'All evaluations completed!'}</h3>
                <p className="text-gray-600">{t.dashboard.excellentWork || 'Excellent work! All employees have been evaluated.'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPendingEmployees.map(employee => (
                  <div key={employee.id} className="bg-gradient-to-r from-orange-50/80 to-red-50/80 rounded-xl border border-orange-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 flex-1 min-w-0">
                        {/* Employee Avatar */}
                        <div className="flex-shrink-0">
                          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            {employee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                        </div>
                        
                        {/* Employee Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900 truncate">{employee.name}</h3>
                            <span className="px-3 py-1 bg-white text-gray-600 rounded-xl text-xs font-medium border border-gray-200 shrink-0">
                              {employee.department || t.common.unassigned}
                            </span>
                            {employee.role === 'manager' && (
                              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-xl text-xs font-medium border border-amber-200 shrink-0">
                                {t.common.manager}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {employee.manager ? (
                              <>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="font-medium">{t.dashboard.reportsTo}:</span>
                                <span className="truncate">{employee.manager.name}</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.882 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <span className="text-amber-600 font-medium">{t.dashboard.noManagerAssigned || 'No manager assigned'}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <div className="flex-shrink-0 ml-6">
                        <button
                          onClick={() => router.push(`/evaluate/${employee.id}`)}
                          className="flex items-center gap-2 px-6 py-3 min-h-[44px] bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm touch-manipulation"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>{t.dashboard.startEvaluation}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}