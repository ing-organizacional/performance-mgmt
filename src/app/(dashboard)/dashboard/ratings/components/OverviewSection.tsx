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

interface OverviewSectionProps {
  departments: DepartmentRating[]
}

export function OverviewSection({ departments }: OverviewSectionProps) {
  const { t } = useLanguage()

  return (
    <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white mb-8 shadow-lg">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">{t.dashboard.performanceInsights}</h2>
          <p className="text-blue-100 text-sm">{t.dashboard.comprehensiveAnalysisDescription}</p>
        </div>
        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <div className="text-3xl font-bold mb-2">
            {departments.reduce((sum, dept) => sum + dept.employees.evaluated, 0)}
          </div>
          <div className="text-blue-100 text-sm font-semibold mb-1">{t.dashboard.totalEvaluations}</div>
          <div className="text-blue-200 text-xs">
            {departments.reduce((sum, dept) => sum + dept.employees.pending, 0)} {t.dashboard.pending.toLowerCase()}
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <div className="text-3xl font-bold mb-2">
            {departments.filter(dept => {
              const completionRate = dept.employees.total > 0 ? (dept.employees.evaluated / dept.employees.total) : 0
              return completionRate === 1
            }).length}
          </div>
          <div className="text-blue-100 text-sm font-semibold mb-1">{t.dashboard.completeDepartments}</div>
          <div className="text-blue-200 text-xs">
            {t.common.of} {departments.length} {t.dashboard.total}
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <div className="text-3xl font-bold mb-2">
            {departments.filter(dept => {
              const needsAttention = dept.ratings.needs + dept.ratings.below
              return needsAttention > dept.ratings.total * 0.3 && dept.ratings.total > 0
            }).length}
          </div>
          <div className="text-blue-100 text-sm font-semibold mb-1">{t.dashboard.departmentsNeedAttention}</div>
          <div className="text-blue-200 text-xs">
            {t.dashboard.requireImmediateAttention}
          </div>
        </div>
      </div>
    </div>
  )
}