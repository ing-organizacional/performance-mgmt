'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LanguageSwitcher } from '@/components/layout'
import { useLanguage } from '@/contexts/LanguageContext'
import { useExport } from '@/hooks/useExport'
import { unlockEvaluation, approveEvaluation } from '@/lib/actions/evaluations'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui'
import { Target, Star } from 'lucide-react'

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
  userRole: string
  currentUserId: string
}

export default function EvaluationSummaryClient({ evaluation, userRole, currentUserId }: EvaluationSummaryClientProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { isExporting, exportError, exportEvaluationById } = useExport()
  const { toasts, error, success, removeToast } = useToast()
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [isApproving, setIsApproving] = useState(false)


  const handleApproveEvaluation = async () => {
    if (!evaluation.id) return
    
    setIsApproving(true)
    try {
      const result = await approveEvaluation(evaluation.id)
      if (result.success) {
        success(t.evaluations.evaluationApprovedSuccess)
        // Refresh the page to show updated status
        window.location.reload()
      } else {
        error(result.error || 'Failed to approve evaluation')
      }
    } catch {
      error('Failed to approve evaluation')
    } finally {
      setIsApproving(false)
    }
  }

  const handleUnlockEvaluation = async () => {
    if (!evaluation.id) return
    setIsUnlocking(true)
    setUnlockError(null)
    
    try {
      const result = await unlockEvaluation(evaluation.id)
      if (result.success) {
        // Refresh the page to show updated status
        router.refresh()
      } else {
        setUnlockError(result.error || 'Failed to unlock evaluation')
      }
    } catch {
      setUnlockError('An unexpected error occurred')
    } finally {
      setIsUnlocking(false)
    }
  }

  const getRatingColor = (rating: number | null) => {
    if (!rating) return 'gray'
    if (rating >= 5) return 'green'
    if (rating >= 4) return 'blue' 
    if (rating >= 3) return 'gray'
    if (rating >= 2) return 'orange'
    return 'red'
  }

  const getRatingLabel = (rating: number | null) => {
    if (!rating) return t.status.notStarted
    switch (rating) {
      case 5: return t.ratings.outstanding
      case 4: return t.ratings.exceedsExpectations
      case 3: return t.ratings.meetsExpectations
      case 2: return t.ratings.belowExpectations
      case 1: return t.ratings.needsImprovement
      default: return `${rating}/5`
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green'
      case 'submitted': return 'green'
      case 'approved': return 'purple'
      case 'draft': return 'yellow'
      default: return 'gray'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return t.status.completed
      case 'submitted': return t.status.submitted
      case 'approved': return t.status.approved
      case 'draft': return t.status.draft
      default: return status
    }
  }

  // Group items by type for better visual organization
  const okrs = evaluation.evaluationItems.filter(item => item.type === 'okr')
  const competencies = evaluation.evaluationItems.filter(item => item.type === 'competency')

  // Calculate averages
  const calculateAverage = (items: { rating: number | null }[]) => {
    const ratingsWithValues = items.filter(item => item.rating && item.rating > 0)
    if (ratingsWithValues.length === 0) return null
    const sum = ratingsWithValues.reduce((acc, item) => acc + (item.rating || 0), 0)
    return Math.round((sum / ratingsWithValues.length) * 10) / 10 // Round to 1 decimal
  }

  const okrAverage = calculateAverage(okrs)
  const competencyAverage = calculateAverage(competencies)
  const totalAverage = calculateAverage([...okrs, ...competencies])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg active:scale-95 transition-all duration-150 touch-manipulation"
                aria-label={t.common.back}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-gray-900 truncate">Mi evaluación</h1>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Mobile-First Main Content */}
      <div className="pt-20 px-4 py-3 space-y-3">
        <div className="space-y-3">
          
          {/* Export Error Display */}
          {exportError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-red-800 mb-2">{t.dashboard.exportError}</h3>
                  <p className="text-sm text-red-600 leading-relaxed">
                    {exportError === 'Evaluation not found or access denied' ? t.dashboard.evaluationNotFound :
                     exportError === 'Export failed' ? t.dashboard.exportFailed :
                     exportError === 'No evaluations found' ? t.dashboard.noEvaluationsFound :
                     exportError === 'Access denied - HR role required' ? t.dashboard.hrRoleRequired :
                     exportError === 'Access denied - Manager or HR role required' ? t.dashboard.managerOrHrRequired :
                     exportError}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Unlock Error Display */}
          {unlockError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-red-800 mb-2">Unlock Error</h3>
                  <p className="text-sm text-red-600 leading-relaxed">{unlockError}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Employee & Overall Performance Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex flex-col space-y-3 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-lg">
                      {evaluation.employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold text-gray-900 truncate">{evaluation.employee.name}</h2>
                    <div className="text-sm text-gray-600">
                      {evaluation.employee.department && `${evaluation.employee.department} • `}
                      {evaluation.employee.role}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {t.evaluations.evaluation} by {evaluation.manager.name} • 
                  {new Date(evaluation.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {/* HR Unlock Button - Only for submitted evaluations */}
                {userRole === 'hr' && evaluation.status === 'submitted' && (
                  <button
                    onClick={handleUnlockEvaluation}
                    disabled={isUnlocking}
                    className={`flex items-center gap-2 px-4 py-3 min-h-[44px] text-orange-700 text-sm font-medium rounded-lg active:scale-95 transition-all duration-150 touch-manipulation whitespace-nowrap ${
                      isUnlocking 
                        ? 'bg-gray-400 text-white cursor-not-allowed' 
                        : 'bg-orange-100 hover:bg-orange-200'
                    }`}
                    title="Unlock evaluation for editing"
                  >
                    {isUnlocking ? (
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    )}
                    <span>{isUnlocking ? t.evaluations.unlocking : t.evaluations.unlock}</span>
                  </button>
                )}

                {/* Employee Approve Button - Only for the employee viewing their own submitted evaluation */}
                {evaluation.status === 'submitted' && currentUserId === evaluation.employee.id && (
                  <button
                    onClick={handleApproveEvaluation}
                    disabled={isApproving}
                    className={`flex items-center gap-2 px-6 py-3 min-h-[44px] text-white text-sm font-medium rounded-lg active:scale-95 transition-all duration-150 touch-manipulation whitespace-nowrap shadow-sm ${
                      isApproving 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                    title="Approve this evaluation"
                  >
                    {isApproving ? (
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span>{isApproving ? t.common.approving : t.common.approve}</span>
                  </button>
                )}

                {/* Context-Aware Export Button */}
                <button
                  onClick={() => exportEvaluationById(evaluation.id, 'pdf')}
                  disabled={isExporting}
                  className={`flex items-center gap-2 px-4 py-3 min-h-[44px] text-blue-700 text-sm font-medium rounded-lg active:scale-95 transition-all duration-150 touch-manipulation whitespace-nowrap ${
                    isExporting 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-blue-100 hover:bg-blue-200'
                  }`}
                  title={t.dashboard.exportPDF}
                >
                  {isExporting ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  <span>{isExporting ? t.dashboard.exporting : t.dashboard.exportPDF}</span>
                </button>

                {/* Status Badge */}
                <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  getStatusColor(evaluation.status) === 'green' ? 'bg-green-100 text-green-800' :
                  getStatusColor(evaluation.status) === 'purple' ? 'bg-primary/10 text-primary' :
                  getStatusColor(evaluation.status) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {getStatusLabel(evaluation.status)}
                </div>
              </div>
            </div>

            {/* Overall Rating - Prominent Display */}
            {evaluation.overallRating && (
              <div className={`bg-gradient-to-r p-4 rounded-xl text-white mb-4 ${
                getRatingColor(evaluation.overallRating) === 'green' ? 'from-green-500 to-green-600' :
                getRatingColor(evaluation.overallRating) === 'blue' ? 'from-blue-500 to-blue-600' :
                getRatingColor(evaluation.overallRating) === 'gray' ? 'from-gray-500 to-gray-600' :
                getRatingColor(evaluation.overallRating) === 'orange' ? 'from-orange-500 to-orange-600' :
                'from-red-500 to-red-600'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1">{t.evaluations.overallPerformance}</h3>
                    <div className="text-2xl font-bold mb-1">
                      {evaluation.overallRating}/5
                    </div>
                    <div className="text-base font-medium opacity-90">
                      {getRatingLabel(evaluation.overallRating)}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {/* OKR Average */}
                {okrAverage !== null && (
                  <div className={`p-4 rounded-xl border-2 ${
                    getRatingColor(okrAverage) === 'green' ? 'bg-green-50 border-green-200' :
                    getRatingColor(okrAverage) === 'blue' ? 'bg-blue-50 border-blue-200' :
                    getRatingColor(okrAverage) === 'gray' ? 'bg-gray-50 border-gray-200' :
                    getRatingColor(okrAverage) === 'orange' ? 'bg-orange-50 border-orange-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Target className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{t.dashboard.okrAverage}</span>
                    </div>
                    <div className={`text-2xl font-bold mb-1 ${
                      getRatingColor(okrAverage) === 'green' ? 'text-green-700' :
                      getRatingColor(okrAverage) === 'blue' ? 'text-blue-700' :
                      getRatingColor(okrAverage) === 'gray' ? 'text-gray-700' :
                      getRatingColor(okrAverage) === 'orange' ? 'text-orange-700' :
                      'text-red-700'
                    }`}>
                      {okrAverage}/5
                    </div>
                    <div className="text-xs text-gray-600">{okrs.length} {t.dashboard.objectives}</div>
                  </div>
                )}

                {/* Competency Average */}
                {competencyAverage !== null && (
                  <div className={`p-4 rounded-xl border-2 ${
                    getRatingColor(competencyAverage) === 'green' ? 'bg-green-50 border-green-200' :
                    getRatingColor(competencyAverage) === 'blue' ? 'bg-blue-50 border-blue-200' :
                    getRatingColor(competencyAverage) === 'gray' ? 'bg-gray-50 border-gray-200' :
                    getRatingColor(competencyAverage) === 'orange' ? 'bg-orange-50 border-orange-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Star className="w-3 h-3 text-yellow-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{t.dashboard.competencyAverage}</span>
                    </div>
                    <div className={`text-2xl font-bold mb-1 ${
                      getRatingColor(competencyAverage) === 'green' ? 'text-green-700' :
                      getRatingColor(competencyAverage) === 'blue' ? 'text-blue-700' :
                      getRatingColor(competencyAverage) === 'gray' ? 'text-gray-700' :
                      getRatingColor(competencyAverage) === 'orange' ? 'text-orange-700' :
                      'text-red-700'
                    }`}>
                      {competencyAverage}/5
                    </div>
                    <div className="text-xs text-gray-600">{competencies.length} {t.dashboard.skills}</div>
                  </div>
                )}

                {/* Total Average */}
                {totalAverage !== null && (
                  <div className={`p-4 rounded-xl border-2 ${
                    getRatingColor(totalAverage) === 'green' ? 'bg-green-50 border-green-200' :
                    getRatingColor(totalAverage) === 'blue' ? 'bg-blue-50 border-blue-200' :
                    getRatingColor(totalAverage) === 'gray' ? 'bg-gray-50 border-gray-200' :
                    getRatingColor(totalAverage) === 'orange' ? 'bg-orange-50 border-orange-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{t.dashboard.totalAverage}</span>
                    </div>
                    <div className={`text-2xl font-bold mb-1 ${
                      getRatingColor(totalAverage) === 'green' ? 'text-green-700' :
                      getRatingColor(totalAverage) === 'blue' ? 'text-blue-700' :
                      getRatingColor(totalAverage) === 'gray' ? 'text-gray-700' :
                      getRatingColor(totalAverage) === 'orange' ? 'text-orange-700' :
                      'text-red-700'
                    }`}>
                      {totalAverage}/5
                    </div>
                    <div className="text-xs text-gray-600">{okrs.length + competencies.length} {t.dashboard.items}</div>
                  </div>
                )}
              </div>
            )}

            {/* Manager Comments */}
            {evaluation.managerComments && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-base font-bold text-gray-900 mb-2">{t.dashboard.managerComments}</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{evaluation.managerComments}</p>
              </div>
            )}
          </div>

          {/* OKRs Section */}
          {okrs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">OKRs ({okrs.length})</h3>
              </div>

              <div className="space-y-3">
                {okrs.map((item) => (
                  <div key={item.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-gray-900 mb-2">{item.title}</h4>
                        <p className="text-sm text-gray-600 mb-2 leading-relaxed">{item.description}</p>
                        {item.level && (
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            item.level === 'company' ? 'bg-primary/10 text-primary' :
                            item.level === 'department' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {item.level === 'company' ? t.dashboard.companyLevel : 
                             item.level === 'department' ? t.dashboard.departmentLevel : t.dashboard.managerLevel}
                          </span>
                        )}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold flex-shrink-0 ${
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
                      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                        <strong>{t.dashboard.feedback}:</strong> <span className="ml-1">{item.comment}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Competencies Section */}
          {competencies.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-yellow-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{t.evaluations.competency} ({competencies.length})</h3>
              </div>

              <div className="space-y-3">
                {competencies.map((item) => (
                  <div key={item.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-gray-900 mb-2">{item.title}</h4>
                        <p className="text-sm text-gray-600 mb-2 leading-relaxed">{item.description}</p>
                        {item.level && (
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            item.level === 'company' ? 'bg-primary/10 text-primary' :
                            item.level === 'department' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {item.level === 'company' ? t.dashboard.companyLevel : 
                             item.level === 'department' ? t.dashboard.departmentLevel : t.dashboard.managerLevel}
                          </span>
                        )}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold flex-shrink-0 ${
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
                      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                        <strong>{t.dashboard.feedback}:</strong> <span className="ml-1">{item.comment}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {okrs.length === 0 && competencies.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
              <div className="text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 712-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Evaluation Items</h3>
                <p className="text-sm text-gray-600">This evaluation doesn&apos;t contain any OKRs or competencies yet.</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}