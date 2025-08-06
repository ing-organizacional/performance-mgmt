'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LanguageSwitcher } from '@/components/layout'
import { useLanguage } from '@/contexts/LanguageContext'

interface DepartmentRating {
  department: string
  manager: {
    name: string
    email: string | null
  } | null
  ratings: {
    outstanding: number
    exceeds: number
    meets: number
    below: number
    needs: number
    total: number
  }
  employees: {
    total: number
    evaluated: number
    pending: number
  }
  criticalEmployees: {
    id: string
    name: string
    rating: number
    status: string
    evaluationId: string
    isManager: boolean
  }[]
}

interface DepartmentRatingsClientProps {
  departments: DepartmentRating[]
}

function DepartmentRatingCard({ department }: { department: DepartmentRating }) {
  const { t } = useLanguage()
  const router = useRouter()
  const [showDetails, setShowDetails] = useState(false)
  
  const getPercentage = (count: number) => 
    department.ratings.total > 0 ? Math.round((count / department.ratings.total) * 100) : 0

  const completionPercentage = department.employees.total > 0 
    ? Math.round((department.employees.evaluated / department.employees.total) * 100) 
    : 0

  // Determine department status for visual hierarchy
  const getDepartmentStatus = () => {
    if (department.employees.pending > department.employees.total * 0.5) return 'urgent'
    if (department.ratings.needs > department.ratings.total * 0.3) return 'attention' 
    if (completionPercentage === 100) return 'complete'
    return 'normal'
  }

  const status = getDepartmentStatus()
  const statusStyling = {
    urgent: 'border-l-red-500 bg-red-50',
    attention: 'border-l-orange-500 bg-orange-50', 
    complete: 'border-l-green-500 bg-green-50',
    normal: 'border-l-gray-300 bg-white'
  }

  return (
    <div className={`rounded-lg border border-gray-200 border-l-4 p-6 shadow-sm ${statusStyling[status]}`}>
      {/* Enhanced Department Header with Visual Hierarchy */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{department.department}</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-sm font-medium text-gray-700">
              {department.manager ? department.manager.name : t.dashboard.noManager}
            </span>
          </div>
        </div>
        <div className="text-right ml-4">
          <div className="text-3xl font-bold text-gray-900">{completionPercentage}%</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Complete</div>
        </div>
      </div>

      {/* Compact Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white/80 rounded-lg p-3 text-center border border-gray-100">
          <div className="text-lg font-bold text-gray-900">{department.employees.total}</div>
          <div className="text-xs text-gray-600 font-medium">{t.dashboard.employees}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center border border-green-100">
          <div className="text-lg font-bold text-green-600">{department.employees.evaluated}</div>
          <div className="text-xs text-gray-600 font-medium">{t.dashboard.evaluated}</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-100">
          <div className="text-lg font-bold text-orange-600">{department.employees.pending}</div>
          <div className="text-xs text-gray-600 font-medium">{t.dashboard.pending}</div>
        </div>
      </div>

      {/* Stacked Progress Bar - Performance Distribution */}
      {department.ratings.total > 0 ? (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">{t.dashboard.performanceDistribution}</span>
            <span className="text-sm text-gray-500">{department.ratings.total} {t.dashboard.evaluations}</span>
          </div>
          
          {/* Single comprehensive stacked progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-4 flex overflow-hidden shadow-inner">
            {department.ratings.outstanding > 0 && (
              <div 
                className="bg-green-500 h-full first:rounded-l-full" 
                style={{ width: `${getPercentage(department.ratings.outstanding)}%` }}
                title={`${t.dashboard.outstandingShort}: ${department.ratings.outstanding} (${getPercentage(department.ratings.outstanding)}%)`}
              />
            )}
            {department.ratings.exceeds > 0 && (
              <div 
                className="bg-blue-500 h-full" 
                style={{ width: `${getPercentage(department.ratings.exceeds)}%` }}
                title={`${t.dashboard.exceedsShort}: ${department.ratings.exceeds} (${getPercentage(department.ratings.exceeds)}%)`}
              />
            )}
            {department.ratings.meets > 0 && (
              <div 
                className="bg-gray-400 h-full" 
                style={{ width: `${getPercentage(department.ratings.meets)}%` }}
                title={`${t.dashboard.meetsShort}: ${department.ratings.meets} (${getPercentage(department.ratings.meets)}%)`}
              />
            )}
            {department.ratings.below > 0 && (
              <div 
                className="bg-orange-500 h-full" 
                style={{ width: `${getPercentage(department.ratings.below)}%` }}
                title={`${t.dashboard.belowShort}: ${department.ratings.below} (${getPercentage(department.ratings.below)}%)`}
              />
            )}
            {department.ratings.needs > 0 && (
              <div 
                className="bg-red-500 h-full last:rounded-r-full" 
                style={{ width: `${getPercentage(department.ratings.needs)}%` }}
                title={`${t.dashboard.needsImprovementShort}: ${department.ratings.needs} (${getPercentage(department.ratings.needs)}%)`}
              />
            )}
          </div>
          
          {/* Compact Legend with Key Metrics */}
          <div className="flex justify-between items-center mt-3">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">{department.ratings.outstanding} {t.dashboard.outstandingShort}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">{department.ratings.needs} {t.dashboard.needsImprovementShort}</span>
              </div>
            </div>
            {(department.ratings.needs > 0 || department.ratings.below > 0) && (
              <div className="text-xs text-orange-600 font-medium">
                {department.ratings.needs + department.ratings.below} {t.dashboard.needAttention}
              </div>
            )}
          </div>
          
          {/* Expandable Critical Employees Section */}
          {department.criticalEmployees.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center justify-between w-full text-left hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
              >
                <span className="text-sm font-medium text-orange-600">
                  {department.criticalEmployees.length} {t.dashboard.employeesNeedReview}
                </span>
                <svg 
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showDetails && (
                <div className="mt-3 space-y-2 animate-in slide-in-from-top-1 duration-200">
                  {department.criticalEmployees
                    .sort((a, b) => {
                      // Managers first, then by rating (worst first)
                      if (a.isManager && !b.isManager) return -1
                      if (!a.isManager && b.isManager) return 1
                      return a.rating - b.rating
                    })
                    .map(employee => (
                    <button
                      key={employee.id}
                      onClick={() => router.push(`/evaluation-summary/${employee.evaluationId}`)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-150 hover:shadow-md active:scale-[0.98] touch-manipulation ${
                        employee.rating === 1 
                          ? 'bg-red-50 border-red-100 hover:bg-red-100' 
                          : 'bg-orange-50 border-orange-100 hover:bg-orange-100'
                      }`}
                    >
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{employee.name}</span>
                          {employee.isManager && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                              </svg>
                              <span>{t.common.manager}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {employee.rating === 1 ? t.dashboard.needsImprovementShort : t.dashboard.belowShort}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          employee.rating === 1 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          <span>{employee.rating}/5</span>
                        </div>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                  
                  {/* Quick action hint */}
                  <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
                    💡 {t.dashboard.scheduleOneOnOnes}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <div className="text-sm font-medium">{t.dashboard.noCompletedEvaluations}</div>
          <div className="text-xs text-gray-400 mt-1">{t.dashboard.evaluationsWillAppear}</div>
        </div>
      )}
    </div>
  )
}

export default function DepartmentRatingsClient({ departments }: DepartmentRatingsClientProps) {
  const { t } = useLanguage()

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
                <h1 className="text-lg font-semibold text-gray-900">{t.dashboard.departmentRatings}</h1>
                <p className="text-sm text-gray-500">{departments.length} {t.common.department.toLowerCase()}s</p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 px-4 pb-6">
        <div className="max-w-4xl mx-auto">
          {/* Enhanced Overview with Insights */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">{t.dashboard.performanceInsights}</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-3xl font-bold mb-1">
                  {departments.reduce((sum, dept) => sum + dept.employees.evaluated, 0)}
                </div>
                <div className="text-blue-100 text-sm font-medium">{t.dashboard.totalEvaluations}</div>
                <div className="text-blue-200 text-xs mt-1">
                  {departments.reduce((sum, dept) => sum + dept.employees.pending, 0)} {t.dashboard.pending.toLowerCase()}
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">
                  {departments.filter(dept => {
                    const completionRate = dept.employees.total > 0 ? (dept.employees.evaluated / dept.employees.total) : 0
                    return completionRate === 1
                  }).length}
                </div>
                <div className="text-blue-100 text-sm font-medium">{t.dashboard.completeDepartments}</div>
                <div className="text-blue-200 text-xs mt-1">
                  {t.common.of} {departments.length} total
                </div>
              </div>
            </div>
            
            {/* Quick Action Indicators */}
            <div className="mt-4 pt-4 border-t border-blue-400/30">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                  <span className="text-blue-100">
                    {departments.filter(dept => {
                      const needsAttention = dept.ratings.needs + dept.ratings.below
                      return needsAttention > dept.ratings.total * 0.3 && dept.ratings.total > 0
                    }).length} {t.dashboard.departmentsNeedAttention}
                  </span>
                </div>
                <div className="text-blue-200 text-xs">
                  {t.dashboard.swipeForDetails}
                </div>
              </div>
            </div>
          </div>

          {/* Department Cards */}
          <div className="space-y-4">
            {departments.map((department) => (
              <DepartmentRatingCard key={department.department} department={department} />
            ))}
          </div>

          {departments.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm text-center">
              <div className="text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t.dashboard.noDepartmentsFound}</h3>
                <p className="text-gray-600">{t.dashboard.addEmployeesWithDepartments}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}