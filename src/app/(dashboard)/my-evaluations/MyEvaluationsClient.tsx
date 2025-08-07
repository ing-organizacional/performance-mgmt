'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import type { EvaluationCycle } from '@/types'

interface Evaluation {
  id: string
  period: string
  status: 'draft' | 'submitted' | 'approved' | 'completed'
  overallRating: number | null
  submittedAt: string | null
  managerName: string
}

interface MyEvaluationsClientProps {
  evaluations: Evaluation[]
  userName: string
  activeCycle: EvaluationCycle | null
  userRole: string
}

export default function MyEvaluationsClient({ evaluations, userName, activeCycle, userRole }: MyEvaluationsClientProps) {
  const router = useRouter()
  const { t } = useLanguage()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'submitted': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return t.status.draft
      case 'submitted': return t.status.submitted
      case 'approved': return t.status.approved
      case 'completed': return t.status.completed
      default: return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  const getRatingStars = (rating: number | null) => {
    if (!rating) return <span className="text-gray-400">{t.ratings.notRated}</span>
    
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 py-3">
          {/* Title Section */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Back button only visible for HR and managers, not employees */}
              {userRole !== 'employee' && (
                <button
                  onClick={() => router.back()}
                  className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-gray-900 truncate">{t.nav.myEvaluations}</h1>
                <p className="text-xs text-gray-500 truncate">
                  {t.nav.welcomeBack}, {userName}
                </p>
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
            <div className="opacity-50 pointer-events-none">
              <span className="text-xs text-gray-500">{t.nav.performanceHistory}</span>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Gray background section for visual contrast */}
      <div className="bg-gray-50 px-4 pt-3 pb-2">
        <div className="h-1"></div>
      </div>

      <div className="px-4 py-6">
        {/* Current Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t.nav.currentPeriod}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              activeCycle 
                ? activeCycle.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : activeCycle.status === 'closed'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {activeCycle ? activeCycle.name : 'No active cycle'}
            </span>
          </div>
          
          {evaluations.length > 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t.nav.evaluationComplete}
              </h3>
              <p className="text-gray-600 mb-4">
                {t.nav.latestPerformanceEvaluation}
              </p>
              <div className="flex items-center justify-center mb-2">
                {getRatingStars(evaluations[0]?.overallRating)}
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {evaluations[0]?.overallRating === 1 && t.ratings.needsImprovement}
                  {evaluations[0]?.overallRating === 2 && t.ratings.belowExpectations}
                  {evaluations[0]?.overallRating === 3 && t.ratings.meetsExpectations}
                  {evaluations[0]?.overallRating === 4 && t.ratings.exceedsExpectations}
                  {evaluations[0]?.overallRating === 5 && t.ratings.outstanding}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {t.nav.reviewedBy} {evaluations[0]?.managerName}
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t.nav.noEvaluationsYet}
              </h3>
              <p className="text-gray-600">
                {t.nav.noPerformanceEvaluations}
              </p>
            </div>
          )}
        </div>

        {/* Evaluation History */}
        {evaluations.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{t.nav.evaluationHistory}</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {evaluations.map((evaluation) => (
              <div key={evaluation.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium text-gray-900">
                        {evaluation.period}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(evaluation.status)}`}>
                        {getStatusText(evaluation.status)}
                      </span>
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center">
                        {getRatingStars(evaluation.overallRating)}
                        {evaluation.overallRating && (
                          <span className="ml-2 text-sm text-gray-600">
                            ({evaluation.overallRating}/5)
                          </span>
                        )}
                      </div>
                      {evaluation.submittedAt && (
                        <span className="text-sm text-gray-500">
                          {new Date(evaluation.submittedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500 mt-1">
                      {t.nav.reviewedBy} {evaluation.managerName}
                    </p>
                  </div>
                  
                  <div className="ml-4">
                    <button 
                      onClick={() => router.push(`/evaluation-summary/${evaluation.id}`)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {t.nav.viewDetails}
                    </button>
                  </div>
                </div>
              </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Summary */}
        {evaluations.length > 0 && (
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.nav.performanceSummary}</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {evaluations.length > 0 
                  ? (evaluations.reduce((sum, evaluation) => sum + (evaluation.overallRating || 0), 0) / evaluations.length).toFixed(1)
                  : '—'
                }
              </div>
              <div className="text-sm text-gray-600">{t.nav.averageRating}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{evaluations.length}</div>
              <div className="text-sm text-gray-600">{t.nav.completedReviews}</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              {t.nav.consistentlyExceeding}
            </p>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}