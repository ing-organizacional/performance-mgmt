/**
 * Evaluation Summary Client
 * 
 * Main component for displaying evaluation summaries with metrics,
 * action buttons, and detailed item breakdowns using modular components.
 */

'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { useExport } from '@/hooks/useExport'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui'
import { useEvaluationActions } from './hooks/useEvaluationActions'
import { EvaluationHeader, EvaluationMetrics, EvaluationItems } from './components'
import { calculateAverage, groupEvaluationItems } from './utils'
import type { EvaluationSummaryClientProps } from './types'

export default function EvaluationSummaryClient({ 
  evaluation, 
  userRole, 
  currentUserId 
}: EvaluationSummaryClientProps) {
  const { t } = useLanguage()
  const { toasts, removeToast } = useToast()
  const { isExporting, exportError, exportEvaluationById } = useExport()
  
  const {
    isApproving,
    isUnlocking,
    unlockError,
    handleApproveEvaluation,
    handleUnlockEvaluation
  } = useEvaluationActions(evaluation.id)

  // Group items by type
  const { okrs, competencies } = groupEvaluationItems(evaluation.evaluationItems)

  // Calculate averages
  const okrAverage = calculateAverage(okrs)
  const competencyAverage = calculateAverage(competencies)
  const totalAverage = calculateAverage([...okrs, ...competencies])

  const handleExport = () => {
    exportEvaluationById(evaluation.id, 'pdf')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EvaluationHeader
        evaluation={evaluation}
        userRole={userRole}
        currentUserId={currentUserId}
        onApprove={handleApproveEvaluation}
        onUnlock={handleUnlockEvaluation}
        onExport={handleExport}
        isApproving={isApproving}
        isUnlocking={isUnlocking}
        isExporting={isExporting}
        unlockError={unlockError}
      />

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

          {/* Main Evaluation Content */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <EvaluationMetrics
              okrAverage={okrAverage}
              competencyAverage={competencyAverage}
              totalAverage={totalAverage}
              overallRating={evaluation.overallRating}
            />

            {/* Manager Comments */}
            {evaluation.managerComments && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-base font-bold text-gray-900 mb-2">{t.dashboard.managerComments}</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{evaluation.managerComments}</p>
              </div>
            )}
          </div>

          {/* Evaluation Items */}
          <EvaluationItems
            okrs={okrs}
            competencies={competencies}
          />
        </div>
      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}