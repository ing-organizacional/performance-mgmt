import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import type { Employee, EvaluationProgress, EvaluationStatus } from '../types'

interface EvaluationStepsProps {
  employee: Employee
  currentStep: number
  totalSteps: number
  progress: EvaluationProgress
  evaluationStatus: EvaluationStatus
  userRole: string
  autoSaving: boolean
  isAllComplete: boolean
  submitting: boolean
  onBack: () => void
  onSubmitForApproval: () => void
  onUnlockEvaluation: () => void
}

export function EvaluationSteps({
  employee,
  currentStep,
  totalSteps,
  progress,
  evaluationStatus,
  userRole,
  autoSaving,
  isAllComplete,
  submitting,
  onBack,
  onSubmitForApproval,
  onUnlockEvaluation
}: EvaluationStepsProps) {
  const { t } = useLanguage()

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="min-w-0 flex-1 text-center">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {employee.name ? `${employee.name} - ${t.evaluations?.evaluation || 'Evaluation'}` : t.evaluations?.employeeEvaluation || 'Employee Evaluation'}
              </h1>
              <p className="text-sm text-gray-600">
                {currentStep + 1} {t.evaluations?.of || 'of'} {totalSteps}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-3">
            <LanguageSwitcher />
          </div>
        </div>
        
        {/* Progress Indicator and Submit Button */}
        <div className="mt-4 space-y-3">
          {/* Progress Bar */}
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
          
          {/* Progress Text and Submit Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                {t.evaluations?.progress || 'Progress'}: {progress.completed} {t.evaluations?.of || 'of'} {progress.total} {t.evaluations?.itemsCompleted || 'items completed'}
              </span>
              {autoSaving && (
                <span className="text-xs text-gray-500 flex items-center">
                  <svg className="animate-spin h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Auto-saving...
                </span>
              )}
            </div>
            
            {evaluationStatus === 'draft' && (
              <button
                onClick={onSubmitForApproval}
                disabled={!isAllComplete || submitting}
                className={`px-3 py-2 text-xs font-medium rounded-lg active:scale-95 transition-all duration-150 touch-manipulation ${
                  isAllComplete
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {submitting ? (t.evaluations?.submitting || 'Submitting') : (t.evaluations?.submitForApproval || 'Submit for Approval')}
              </button>
            )}
            
            {evaluationStatus === 'submitted' && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                  {t.evaluations?.awaitingEmployeeApproval || 'Awaiting Employee Approval'}
                </span>
                {userRole === 'hr' && (
                  <button
                    onClick={onUnlockEvaluation}
                    disabled={submitting}
                    className="px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-700 active:scale-95 transition-all flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    {submitting ? (t.evaluations?.unlocking || 'Unlocking') : (t.evaluations?.unlock || 'Unlock')}
                  </button>
                )}
              </div>
            )}
            
            {evaluationStatus === 'completed' && (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                {t.evaluations?.evaluationCompleted || 'Evaluation Completed'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}