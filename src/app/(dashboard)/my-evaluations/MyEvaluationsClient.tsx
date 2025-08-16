'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import type { EvaluationCycle } from '@/types'
import { FileText, Target, Clock, Edit, AlertTriangle } from 'lucide-react'

interface Evaluation {
  id: string
  period: string
  status: 'draft' | 'submitted' | 'completed'
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
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return t.status.draft
      case 'submitted': return t.evaluations.awaitingEmployeeApproval
      case 'completed': return t.status.completed
      default: return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  const getPerformanceSummaryText = (averageRating: number) => {
    if (averageRating >= 4.5) return t.nav.performanceOutstanding    // 4.5-5: Outstanding
    if (averageRating >= 3.5) return t.nav.performanceExceeding      // 3.5-4.4: Exceeding 
    if (averageRating >= 2.5) return t.nav.performanceMeeting        // 2.5-3.4: Meeting
    if (averageRating >= 1.5) return t.nav.performanceImproving      // 1.5-2.4: Improving
    return t.nav.performanceNeedsWork                                // 1-1.4: Needs Work
  }

  const getRatingStars = (rating: number | null, size: 'small' | 'large' = 'small') => {
    if (!rating) return <span className="text-gray-400 text-base font-medium">{t.ratings.notRated}</span>
    
    const starSize = size === 'large' ? 'w-6 h-6' : 'w-5 h-5'
    
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`${starSize} ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
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
      {/* Mobile-First Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 py-4">
          {/* Title Section */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Back button only visible for HR and managers, not employees */}
              {userRole !== 'employee' && (
                <button
                  onClick={() => router.back()}
                  className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg active:scale-95 transition-all duration-150 touch-manipulation"
                  aria-label={t.common.back}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-gray-900 truncate">{t.nav.myEvaluations}</h1>
                <p className="text-sm text-gray-600 truncate">
                  {t.nav.welcomeBack}, {userName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/settings')}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 active:scale-95 transition-all duration-150 touch-manipulation"
                title={t.settings?.profile || 'Settings'}
                aria-label={t.settings?.profile || 'Settings'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-95 transition-all duration-150 touch-manipulation shadow-sm"
                aria-label={t.auth.signOut}
              >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
          </div>
          
          {/* Actions Section */}
          <div className="flex items-center justify-between">
            <div className="opacity-50 pointer-events-none">
              <span className="text-sm text-gray-500">{t.nav.performanceHistory}</span>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Mobile-First Main Content */}
      <div className="px-4 py-4 space-y-4">
        {/* Show notification for evaluations awaiting acceptance - moved to top */}
        {evaluations.filter(e => e.status === 'submitted').length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-base text-amber-700 leading-relaxed">
                  {(() => {
                    const count = evaluations.filter(e => e.status === 'submitted').length;
                    return count === 1 
                      ? t.evaluations.evaluationAwaitingApprovalMessage.replace('{count}', count.toString())
                      : t.evaluations.evaluationsAwaitingApprovalMessage.replace('{count}', count.toString());
                  })()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Current Status Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t.nav.currentPeriod}</h2>
            <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
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
          
          {(() => {
            if (evaluations.length === 0) {
              return (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <FileText className="w-16 h-16 mx-auto text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t.nav.noEvaluationsYet}
                  </h3>
                  <p className="text-gray-600">
                    {t.nav.noPerformanceEvaluations}
                  </p>
                </div>
              )
            }

            // Find evaluations that match the current active cycle
            const getCurrentCycleEvaluations = () => {
              if (!activeCycle) return evaluations
              
              // Derive expected period type and date from active cycle
              const cycleName = activeCycle.name.toLowerCase()
              let expectedPeriodType = 'yearly'
              let expectedPeriodDate = new Date().getFullYear().toString()
              
              if (cycleName.includes('annual') || cycleName.includes('yearly') || cycleName.includes('year')) {
                expectedPeriodType = 'yearly'
                const yearMatch = activeCycle.name.match(/\b(20\d{2})\b/)
                expectedPeriodDate = yearMatch ? yearMatch[1] : new Date().getFullYear().toString()
              } else if (cycleName.includes('quarter') || cycleName.includes('q1') || cycleName.includes('q2') || cycleName.includes('q3') || cycleName.includes('q4')) {
                expectedPeriodType = 'quarterly'
                const quarterMatch = activeCycle.name.match(/\b(20\d{2}[-\s]?Q[1-4]|\bQ[1-4][-\s]?20\d{2})\b/i)
                if (quarterMatch) {
                  expectedPeriodDate = quarterMatch[1].replace(/\s/g, '-').toUpperCase()
                } else {
                  const currentDate = new Date()
                  const quarter = Math.ceil((currentDate.getMonth() + 1) / 3)
                  expectedPeriodDate = `${currentDate.getFullYear()}-Q${quarter}`
                }
              }
              
              return evaluations.filter(e => 
                e.period === `${expectedPeriodDate} ${expectedPeriodType}`
              )
            }
            
            const currentCycleEvaluations = getCurrentCycleEvaluations()
            
            // Prioritize current cycle evaluations by user relevance:
            // 1. Completed (show latest achievement first)
            // 2. Submitted (requires user action)  
            // 3. Draft (work in progress - lowest priority)
            const completedEvaluation = currentCycleEvaluations.find(e => e.status === 'completed')
            const submittedEvaluation = currentCycleEvaluations.find(e => e.status === 'submitted')
            const latestEvaluation = completedEvaluation || submittedEvaluation || currentCycleEvaluations[0]
            
            // Show different content based on the prioritized evaluation status
            if (!latestEvaluation) {
              // No evaluation for current cycle
              return (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <FileText className="w-16 h-16 mx-auto text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t.nav.noEvaluationsYet}
                  </h3>
                  <p className="text-gray-600">
                    {t.nav.noPerformanceEvaluations}
                  </p>
                </div>
              )
            } else if (latestEvaluation.status === 'completed') {
              return (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <Target className="w-16 h-16 mx-auto text-green-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t.nav.evaluationComplete}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {t.nav.latestPerformanceEvaluation}
                  </p>
                  <div className="mb-4">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      {getRatingStars(latestEvaluation.overallRating, 'large')}
                      <span className="text-lg font-bold text-gray-900">
                        ({latestEvaluation.overallRating}/5)
                      </span>
                    </div>
                    <div className="flex justify-center">
                      <div className={`inline-flex items-center px-4 py-2 rounded-lg font-semibold text-base ${
                        latestEvaluation.overallRating === 1 ? 'bg-red-100 text-red-700' :
                        latestEvaluation.overallRating === 2 ? 'bg-amber-100 text-amber-700' :
                        latestEvaluation.overallRating === 3 ? 'bg-gray-100 text-gray-700' :
                        latestEvaluation.overallRating === 4 ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {latestEvaluation.overallRating === 1 && t.ratings.needsImprovement}
                        {latestEvaluation.overallRating === 2 && t.ratings.belowExpectations}
                        {latestEvaluation.overallRating === 3 && t.ratings.meetsExpectations}
                        {latestEvaluation.overallRating === 4 && t.ratings.exceedsExpectations}
                        {latestEvaluation.overallRating === 5 && t.ratings.outstanding}
                      </div>
                    </div>
                  </div>
                  <p className="text-base text-gray-600">
                    {t.nav.reviewedBy} <span className="font-semibold">{latestEvaluation.managerName}</span>
                  </p>
                </div>
              )
            }
            
            if (latestEvaluation.status === 'submitted') {
              return (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <Clock className="w-16 h-16 mx-auto text-amber-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t.evaluations.awaitingEmployeeApproval}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {t.nav.managerSubmittedEvaluation}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t.nav.reviewedBy} {latestEvaluation.managerName}
                  </p>
                </div>
              )
            }
            
            if (latestEvaluation.status === 'draft') {
              return (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <Edit className="w-16 h-16 mx-auto text-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t.nav.evaluationInProgress}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {t.nav.managerPreparingEvaluation}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t.common.manager}: {latestEvaluation.managerName}
                  </p>
                </div>
              )
            }
            
            // Fallback
            return (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t.nav.noEvaluationsYet}
                </h3>
                <p className="text-gray-600">
                  {t.nav.noPerformanceEvaluations}
                </p>
              </div>
            )
          })()}
        </div>

        {/* Evaluation History */}
        {evaluations.filter(e => e.status !== 'draft').length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{t.nav.evaluationHistory}</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {evaluations.filter(e => e.status !== 'draft').map((evaluation) => (
              <div key={evaluation.id} className="px-6 py-5 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        {evaluation.period}
                      </h3>
                    </div>
                    
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex items-center">
                        {getRatingStars(evaluation.overallRating)}
                        {evaluation.overallRating && (
                          <span className="ml-2 text-base font-semibold text-gray-700">
                            ({evaluation.overallRating}/5)
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-base text-gray-600">
                      {t.nav.evaluatedBy
                        .replace('{manager}', evaluation.managerName)
                        .replace('{date}', evaluation.submittedAt ? new Date(evaluation.submittedAt).toLocaleDateString() : '')
                      }
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {evaluation.status === 'submitted' && (
                      <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${getStatusColor(evaluation.status)}`}>
                        {getStatusText(evaluation.status)}
                      </span>
                    )}
                    <button 
                      onClick={() => router.push(`/evaluation-summary/${evaluation.id}`)}
                      className="px-4 py-2.5 min-h-[44px] bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 touch-manipulation shadow-sm"
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
        {evaluations.filter(e => e.status === 'completed').length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.nav.performanceSummary}</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {(() => {
                  const completedEvaluations = evaluations.filter(e => e.status === 'completed' && e.overallRating)
                  return completedEvaluations.length > 0 
                    ? (completedEvaluations.reduce((sum, evaluation) => sum + (evaluation.overallRating || 0), 0) / completedEvaluations.length).toFixed(1)
                    : '—'
                })()}
              </div>
              <div className="text-sm text-gray-600">{t.nav.averageRating}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{evaluations.filter(e => e.status === 'completed').length}</div>
              <div className="text-sm text-gray-600">{t.nav.completedReviews}</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              {(() => {
                const completedEvaluations = evaluations.filter(e => e.status === 'completed' && e.overallRating)
                return completedEvaluations.length > 0 
                  ? getPerformanceSummaryText(completedEvaluations.reduce((sum, evaluation) => sum + (evaluation.overallRating || 0), 0) / completedEvaluations.length)
                  : t.nav.noPerformanceEvaluations
              })()}
            </p>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}