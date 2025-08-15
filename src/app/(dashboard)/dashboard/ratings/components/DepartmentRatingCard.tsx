import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { useExport } from '@/hooks/useExport'
import { Users, User, Download, ChevronDown, AlertTriangle, BarChart3, ChevronRight } from 'lucide-react'

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
  allEmployees: {
    id: string
    name: string
    rating: number
    status: string
    evaluationId: string
    isManager: boolean
  }[]
  criticalEmployees: {
    id: string
    name: string
    rating: number
    status: string
    evaluationId: string
    isManager: boolean
  }[]
}

interface DepartmentRatingCardProps {
  department: DepartmentRating
}

export function DepartmentRatingCard({ department }: DepartmentRatingCardProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [showDetails, setShowDetails] = useState(false)
  const { isExporting, exportDepartment } = useExport()
  
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

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Enhanced Department Header with Professional Design */}
      <div className={`px-4 lg:px-8 py-4 lg:py-6 border-b border-gray-200/60 bg-gradient-to-r ${
        status === 'urgent' ? 'from-red-50/80 to-orange-50/80' :
        status === 'attention' ? 'from-amber-50/80 to-yellow-50/80' :
        status === 'complete' ? 'from-green-50/80 to-emerald-50/80' :
        'from-gray-50/50 to-white'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
            <div className={`w-10 lg:w-12 h-10 lg:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              status === 'urgent' ? 'bg-red-100' :
              status === 'attention' ? 'bg-amber-100' :
              status === 'complete' ? 'bg-green-100' :
              'bg-blue-100'
            }`}>
              <Users className={`w-5 lg:w-6 h-5 lg:h-6 ${
                status === 'urgent' ? 'text-red-600' :
                status === 'attention' ? 'text-amber-600' :
                status === 'complete' ? 'text-green-600' :
                'text-blue-600'
              }`} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-1 truncate">{department.department}</h3>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700 truncate">
                  {department.manager ? department.manager.name : t.dashboard.noManager}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between sm:justify-end gap-3 lg:gap-4 flex-shrink-0">
            {/* Export Button */}
            <button
              onClick={() => exportDepartment(department.department, 'pdf')}
              disabled={isExporting}
              className="flex items-center gap-2 px-3 lg:px-4 py-2 min-h-[44px] bg-white text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              title={`${t.dashboard.exportPDF} - ${department.department}`}
            >
              {isExporting && (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              )}
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">PDF</span>
            </button>
            
            {/* Completion Percentage */}
            <div className="text-right">
              <div className="text-2xl lg:text-3xl font-bold text-gray-900">{completionPercentage}%</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{t.dashboard.complete}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Content Section */}
      <div className="px-4 lg:px-8 py-4 lg:py-6">
        {/* Professional Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 lg:gap-6 mb-6 lg:mb-8">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg lg:rounded-xl p-3 lg:p-4 border border-gray-200/60 text-center shadow-sm">
            <div className="text-lg lg:text-2xl font-bold text-gray-900 mb-0.5 lg:mb-1">{department.employees.total}</div>
            <div className="text-xs lg:text-sm text-gray-600 font-semibold">{t.dashboard.employees}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg lg:rounded-xl p-3 lg:p-4 border border-green-200/60 text-center shadow-sm">
            <div className="text-lg lg:text-2xl font-bold text-green-600 mb-0.5 lg:mb-1">{department.employees.evaluated}</div>
            <div className="text-xs lg:text-sm text-gray-600 font-semibold">{t.dashboard.evaluated}</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg lg:rounded-xl p-3 lg:p-4 border border-amber-200/60 text-center shadow-sm">
            <div className="text-lg lg:text-2xl font-bold text-amber-600 mb-0.5 lg:mb-1">{department.employees.pending}</div>
            <div className="text-xs lg:text-sm text-gray-600 font-semibold">{t.dashboard.pending}</div>
          </div>
        </div>

        {/* Enhanced Performance Distribution */}
        {department.ratings.total > 0 ? (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
              <h4 className="text-base lg:text-lg font-bold text-gray-900">{t.dashboard.performanceDistribution}</h4>
              <span className="px-2 lg:px-3 py-1 bg-gray-100 text-gray-700 text-xs lg:text-sm font-medium rounded-lg">
                {department.ratings.total} {t.dashboard.evaluations}
              </span>
            </div>
            
            {/* Professional Stacked Progress Bar */}
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-xl h-6 flex overflow-hidden shadow-inner">
                {department.ratings.outstanding > 0 && (
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-300" 
                    style={{ width: `${getPercentage(department.ratings.outstanding)}%` }}
                    title={`${t.dashboard.outstandingShort}: ${department.ratings.outstanding} (${getPercentage(department.ratings.outstanding)}%)`}
                  />
                )}
                {department.ratings.exceeds > 0 && (
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300" 
                    style={{ width: `${getPercentage(department.ratings.exceeds)}%` }}
                    title={`${t.dashboard.exceedsShort}: ${department.ratings.exceeds} (${getPercentage(department.ratings.exceeds)}%)`}
                  />
                )}
                {department.ratings.meets > 0 && (
                  <div 
                    className="bg-gradient-to-r from-gray-400 to-gray-500 h-full transition-all duration-300" 
                    style={{ width: `${getPercentage(department.ratings.meets)}%` }}
                    title={`${t.dashboard.meetsShort}: ${department.ratings.meets} (${getPercentage(department.ratings.meets)}%)`}
                  />
                )}
                {department.ratings.below > 0 && (
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-amber-600 h-full transition-all duration-300" 
                    style={{ width: `${getPercentage(department.ratings.below)}%` }}
                    title={`${t.dashboard.belowShort}: ${department.ratings.below} (${getPercentage(department.ratings.below)}%)`}
                  />
                )}
                {department.ratings.needs > 0 && (
                  <div 
                    className="bg-gradient-to-r from-red-500 to-red-600 h-full transition-all duration-300" 
                    style={{ width: `${getPercentage(department.ratings.needs)}%` }}
                    title={`${t.dashboard.needsImprovementShort}: ${department.ratings.needs} (${getPercentage(department.ratings.needs)}%)`}
                  />
                )}
              </div>
            </div>
            
            {/* Enhanced Legend with Professional Styling */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-4 mt-4 lg:mt-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-sm"></div>
                <span className="text-sm font-medium text-gray-700">
                  {department.ratings.outstanding} {t.dashboard.outstandingShort}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-sm"></div>
                <span className="text-sm font-medium text-gray-700">
                  {department.ratings.exceeds} {t.dashboard.exceedsShort}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full shadow-sm"></div>
                <span className="text-sm font-medium text-gray-700">
                  {department.ratings.meets} {t.dashboard.meetsShort}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full shadow-sm"></div>
                <span className="text-sm font-medium text-gray-700">
                  {department.ratings.below} {t.dashboard.belowShort}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-sm"></div>
                <span className="text-sm font-medium text-gray-700">
                  {department.ratings.needs} {t.dashboard.needsImprovementShort}
                </span>
              </div>
            </div>
            
            {/* Enhanced Employees Section */}
            {department.allEmployees.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button 
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center justify-between w-full p-3 lg:p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-200 min-h-[44px] touch-manipulation"
                >
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className="w-6 lg:w-8 h-6 lg:h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Users className="w-3 lg:w-4 h-3 lg:h-4 text-primary" />
                    </div>
                    <span className="text-xs lg:text-sm font-semibold text-gray-900">
                      {t.dashboard.viewCompletedEvaluations?.replace('{count}', department.allEmployees.length.toString()) || 
                        `Ver las ${department.allEmployees.length} evaluaciones completas`
                      }
                    </span>
                  </div>
                  <ChevronDown 
                    className={`w-4 lg:w-5 h-4 lg:h-5 text-gray-400 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`}
                  />
                </button>
                
                {showDetails && (
                  <div className="mt-4 space-y-2 animate-in slide-in-from-top-1 duration-300">
                    {department.allEmployees
                      .sort((a, b) => {
                        // Managers first, then by rating (best first for full list)
                        if (a.isManager && !b.isManager) return -1
                        if (!a.isManager && b.isManager) return 1
                        return b.rating - a.rating
                      })
                      .map(employee => (
                      <button
                        key={employee.id}
                        onClick={() => router.push(`/evaluation-summary/${employee.evaluationId}`)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:shadow-md active:scale-[0.98] touch-manipulation min-h-[44px] ${
                          employee.rating === 5 
                            ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                            : employee.rating === 4
                            ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                            : employee.rating === 3
                            ? 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            : employee.rating === 2
                            ? 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                            : 'bg-red-50 border-red-200 hover:bg-red-100'
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            employee.rating === 5 ? 'bg-green-100' :
                            employee.rating === 4 ? 'bg-blue-100' :
                            employee.rating === 3 ? 'bg-gray-100' :
                            employee.rating === 2 ? 'bg-amber-100' : 'bg-red-100'
                          }`}>
                            <span className={`text-sm font-bold ${
                              employee.rating === 5 ? 'text-green-600' :
                              employee.rating === 4 ? 'text-blue-600' :
                              employee.rating === 3 ? 'text-gray-600' :
                              employee.rating === 2 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {employee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-gray-900 truncate">{employee.name}</span>
                              {employee.isManager && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex-shrink-0">
                                  {t.common.manager}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600">
                              {employee.rating === 5 ? t.dashboard.outstandingShort : 
                               employee.rating === 4 ? t.dashboard.exceedsShort :
                               employee.rating === 3 ? t.dashboard.meetsShort :
                               employee.rating === 2 ? t.dashboard.belowShort : t.dashboard.needsImprovementShort}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className={`px-3 py-1 rounded-lg text-sm font-bold ${
                            employee.rating === 5 
                              ? 'bg-green-100 text-green-700' 
                              : employee.rating === 4
                              ? 'bg-blue-100 text-blue-700'
                              : employee.rating === 3
                              ? 'bg-gray-100 text-gray-700'
                              : employee.rating === 2
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {employee.rating}/5
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </button>
                    ))}
                    
                    {/* Critical employees indicator */}
                    {department.criticalEmployees.length > 0 && (
                      <div className="flex items-center justify-center gap-2 p-3 lg:p-4 mt-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-xs lg:text-sm font-semibold text-amber-800">
                          {department.criticalEmployees.length} {t.dashboard.employeesNeedReview}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 lg:py-12 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300">
            <div className="w-12 lg:w-16 h-12 lg:h-16 mx-auto mb-3 lg:mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-6 lg:w-8 h-6 lg:h-8 text-gray-400" />
            </div>
            <h4 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">{t.dashboard.noCompletedEvaluations}</h4>
            <p className="text-sm text-gray-600">{t.dashboard.evaluationsWillAppear}</p>
          </div>
        )}
      </div>
    </div>
  )
}