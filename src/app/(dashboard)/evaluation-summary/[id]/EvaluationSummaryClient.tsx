'use client'

import Link from 'next/link'
import { LanguageSwitcher } from '@/components/layout'
import { useLanguage } from '@/contexts/LanguageContext'

interface EvaluationSummary {
  id: string
  employee: {
    id: string
    name: string
    department: string | null
    role: string
  }
  manager: {
    name: string
    email: string | null
  }
  status: string
  overallRating: number | null
  managerComments: string | null
  createdAt: string
  evaluationItems: {
    id: string
    title: string
    description: string
    type: string
    rating: number | null
    comment: string
    level?: string
    createdBy?: string
  }[]
}

interface EvaluationSummaryClientProps {
  evaluation: EvaluationSummary
}

export default function EvaluationSummaryClient({ evaluation }: EvaluationSummaryClientProps) {
  const { t } = useLanguage()

  const getRatingColor = (rating: number | null) => {
    if (!rating) return 'gray'
    if (rating >= 5) return 'green'
    if (rating >= 4) return 'blue' 
    if (rating >= 3) return 'gray'
    if (rating >= 2) return 'orange'
    return 'red'
  }

  const getRatingLabel = (rating: number | null) => {
    if (!rating) return t.evaluations.notStarted
    switch (rating) {
      case 5: return t.evaluations.outstanding
      case 4: return t.evaluations.exceedsExpectations
      case 3: return t.evaluations.meetsExpectations
      case 2: return t.evaluations.belowExpectations
      case 1: return t.evaluations.needsImprovement
      default: return `${rating}/5`
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green'
      case 'submitted': return 'blue'
      case 'approved': return 'purple'
      case 'draft': return 'yellow'
      default: return 'gray'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return t.evaluations.completed
      case 'submitted': return 'Submitted'
      case 'approved': return 'Approved'
      case 'draft': return t.evaluations.inProgress
      default: return status
    }
  }

  // Group items by type for better visual organization
  const okrs = evaluation.evaluationItems.filter(item => item.type === 'okr')
  const competencies = evaluation.evaluationItems.filter(item => item.type === 'competency')

  // Calculate averages
  const calculateAverage = (items: any[]) => {
    const ratingsWithValues = items.filter(item => item.rating && item.rating > 0)
    if (ratingsWithValues.length === 0) return null
    const sum = ratingsWithValues.reduce((acc, item) => acc + item.rating, 0)
    return Math.round((sum / ratingsWithValues.length) * 10) / 10 // Round to 1 decimal
  }

  const okrAverage = calculateAverage(okrs)
  const competencyAverage = calculateAverage(competencies)
  const totalAverage = calculateAverage([...okrs, ...competencies])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/dashboard/ratings"
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all duration-150 mr-3 touch-manipulation"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{t.evaluations.evaluation}</h1>
                <p className="text-sm text-gray-500">{evaluation.employee.name}</p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 px-4 pb-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Employee & Overall Performance Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">
                      {evaluation.employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{evaluation.employee.name}</h2>
                    <div className="text-sm text-gray-600">
                      {evaluation.employee.department && `${evaluation.employee.department} • `}
                      {evaluation.employee.role}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {t.evaluations.evaluation} by {evaluation.manager.name} • 
                  {new Date(evaluation.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              {/* Status Badge */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                getStatusColor(evaluation.status) === 'green' ? 'bg-green-100 text-green-700' :
                getStatusColor(evaluation.status) === 'blue' ? 'bg-blue-100 text-blue-700' :
                getStatusColor(evaluation.status) === 'purple' ? 'bg-purple-100 text-purple-700' :
                getStatusColor(evaluation.status) === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {getStatusLabel(evaluation.status)}
              </div>
            </div>

            {/* Overall Rating - Prominent Display */}
            {evaluation.overallRating && (
              <div className={`bg-gradient-to-r p-6 rounded-lg text-white mb-6 ${
                getRatingColor(evaluation.overallRating) === 'green' ? 'from-green-500 to-green-600' :
                getRatingColor(evaluation.overallRating) === 'blue' ? 'from-blue-500 to-blue-600' :
                getRatingColor(evaluation.overallRating) === 'gray' ? 'from-gray-500 to-gray-600' :
                getRatingColor(evaluation.overallRating) === 'orange' ? 'from-orange-500 to-orange-600' :
                'from-red-500 to-red-600'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{t.evaluations.overallPerformance}</h3>
                    <div className="text-2xl font-bold">
                      {evaluation.overallRating}/5 • {getRatingLabel(evaluation.overallRating)}
                    </div>
                  </div>
                  <div className="text-right">
                    {/* Star Rating Visual */}
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-6 h-6 ${
                            star <= (evaluation.overallRating || 0) ? 'text-white' : 'text-white/30'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Breakdown - OKR, Competency, and Total Averages */}
            {(okrAverage !== null || competencyAverage !== null || totalAverage !== null) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                {/* OKR Average */}
                {okrAverage !== null && (
                  <div className={`p-4 rounded-lg border-2 ${
                    getRatingColor(okrAverage) === 'green' ? 'bg-green-50 border-green-200' :
                    getRatingColor(okrAverage) === 'blue' ? 'bg-blue-50 border-blue-200' :
                    getRatingColor(okrAverage) === 'gray' ? 'bg-gray-50 border-gray-200' :
                    getRatingColor(okrAverage) === 'orange' ? 'bg-orange-50 border-orange-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{t.dashboard.okrAverage}</span>
                    </div>
                    <div className={`text-2xl font-bold ${
                      getRatingColor(okrAverage) === 'green' ? 'text-green-700' :
                      getRatingColor(okrAverage) === 'blue' ? 'text-blue-700' :
                      getRatingColor(okrAverage) === 'gray' ? 'text-gray-700' :
                      getRatingColor(okrAverage) === 'orange' ? 'text-orange-700' :
                      'text-red-700'
                    }`}>
                      {okrAverage}/5
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{okrs.length} {t.dashboard.objectives}</div>
                  </div>
                )}

                {/* Competency Average */}
                {competencyAverage !== null && (
                  <div className={`p-4 rounded-lg border-2 ${
                    getRatingColor(competencyAverage) === 'green' ? 'bg-green-50 border-green-200' :
                    getRatingColor(competencyAverage) === 'blue' ? 'bg-blue-50 border-blue-200' :
                    getRatingColor(competencyAverage) === 'gray' ? 'bg-gray-50 border-gray-200' :
                    getRatingColor(competencyAverage) === 'orange' ? 'bg-orange-50 border-orange-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{t.dashboard.competencyAverage}</span>
                    </div>
                    <div className={`text-2xl font-bold ${
                      getRatingColor(competencyAverage) === 'green' ? 'text-green-700' :
                      getRatingColor(competencyAverage) === 'blue' ? 'text-blue-700' :
                      getRatingColor(competencyAverage) === 'gray' ? 'text-gray-700' :
                      getRatingColor(competencyAverage) === 'orange' ? 'text-orange-700' :
                      'text-red-700'
                    }`}>
                      {competencyAverage}/5
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{competencies.length} {t.dashboard.skills}</div>
                  </div>
                )}

                {/* Total Average */}
                {totalAverage !== null && (
                  <div className={`p-4 rounded-lg border-2 ${
                    getRatingColor(totalAverage) === 'green' ? 'bg-green-50 border-green-200' :
                    getRatingColor(totalAverage) === 'blue' ? 'bg-blue-50 border-blue-200' :
                    getRatingColor(totalAverage) === 'gray' ? 'bg-gray-50 border-gray-200' :
                    getRatingColor(totalAverage) === 'orange' ? 'bg-orange-50 border-orange-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{t.dashboard.totalAverage}</span>
                    </div>
                    <div className={`text-2xl font-bold ${
                      getRatingColor(totalAverage) === 'green' ? 'text-green-700' :
                      getRatingColor(totalAverage) === 'blue' ? 'text-blue-700' :
                      getRatingColor(totalAverage) === 'gray' ? 'text-gray-700' :
                      getRatingColor(totalAverage) === 'orange' ? 'text-orange-700' :
                      'text-red-700'
                    }`}>
                      {totalAverage}/5
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{okrs.length + competencies.length} {t.dashboard.items}</div>
                  </div>
                )}
              </div>
            )}

            {/* Manager Comments */}
            {evaluation.managerComments && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{t.dashboard.managerComments}</h4>
                <p className="text-gray-700 leading-relaxed">{evaluation.managerComments}</p>
              </div>
            )}
          </div>

          {/* OKRs Section */}
          {okrs.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">OKRs ({okrs.length})</h3>
              </div>

              <div className="space-y-4">
                {okrs.map((item, index) => (
                  <div key={item.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        {item.level && (
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            item.level === 'company' ? 'bg-purple-100 text-purple-700' :
                            item.level === 'department' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {item.level === 'company' ? t.dashboard.companyLevel : 
                             item.level === 'department' ? t.dashboard.departmentLevel : t.dashboard.managerLevel}
                          </span>
                        )}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                        getRatingColor(item.rating) === 'green' ? 'bg-green-100 text-green-700' :
                        getRatingColor(item.rating) === 'blue' ? 'bg-blue-100 text-blue-700' :
                        getRatingColor(item.rating) === 'gray' ? 'bg-gray-100 text-gray-700' :
                        getRatingColor(item.rating) === 'orange' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {item.rating || 0}/5
                      </div>
                    </div>
                    {item.comment && (
                      <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
                        <strong>{t.dashboard.feedback}:</strong> {item.comment}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Competencies Section */}
          {competencies.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t.evaluations.competency} ({competencies.length})</h3>
              </div>

              <div className="space-y-4">
                {competencies.map((item, index) => (
                  <div key={item.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        {item.level && (
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            item.level === 'company' ? 'bg-purple-100 text-purple-700' :
                            item.level === 'department' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {item.level === 'company' ? t.dashboard.companyLevel : 
                             item.level === 'department' ? t.dashboard.departmentLevel : t.dashboard.managerLevel}
                          </span>
                        )}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                        getRatingColor(item.rating) === 'green' ? 'bg-green-100 text-green-700' :
                        getRatingColor(item.rating) === 'blue' ? 'bg-blue-100 text-blue-700' :
                        getRatingColor(item.rating) === 'gray' ? 'bg-gray-100 text-gray-700' :
                        getRatingColor(item.rating) === 'orange' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {item.rating || 0}/5
                      </div>
                    </div>
                    {item.comment && (
                      <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
                        <strong>{t.dashboard.feedback}:</strong> {item.comment}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {okrs.length === 0 && competencies.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm text-center">
              <div className="text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Evaluation Items</h3>
                <p className="text-gray-600">This evaluation doesn't contain any OKRs or competencies yet.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}