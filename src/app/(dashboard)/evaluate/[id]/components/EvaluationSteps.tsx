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
  saveSuccess: boolean
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
  saveSuccess,
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
        {/* Mobile-First Header Row */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg active:scale-95 transition-all duration-150 touch-manipulation"
            aria-label={t.common?.back || 'Back'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {employee.name || t.evaluations?.employeeEvaluation || 'Employee Evaluation'}
            </h1>
            <p className="text-sm text-gray-600">
              {t.evaluations?.evaluation || 'Evaluation'} • {currentStep + 1} {t.evaluations?.of || 'of'} {totalSteps}
            </p>
          </div>
          <LanguageSwitcher />
        </div>
        
        {/* Mobile-Optimized Progress Section */}
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="bg-gray-200 rounded-full h-3">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
          
          {/* Progress Info Row */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold text-gray-900">
                {progress.completed} {t.evaluations?.of || 'of'} {progress.total} {t.evaluations?.itemsCompleted || 'completed'}
              </span>
              {autoSaving && (
                <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200">
                  <svg className="animate-spin h-4 w-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-sm font-medium">{t.evaluations?.autoSaving}</span>
                </div>
              )}
              {saveSuccess && (
                <div className="flex items-center bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200">
                  <svg className="h-4 w-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">{t.evaluations?.autoSaved}</span>
                </div>
              )}
            </div>
            
            {/* Action Buttons - Mobile Optimized */}
            <div className="flex flex-col gap-2">
              {evaluationStatus === 'draft' && (
                <button
                  onClick={onSubmitForApproval}
                  disabled={!isAllComplete || submitting}
                  className={`px-4 py-3 min-h-[44px] text-sm font-semibold rounded-xl active:scale-95 transition-all duration-150 touch-manipulation ${
                    isAllComplete
                      ? 'bg-green-500 text-white hover:bg-green-600 shadow-sm'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {submitting ? (t.evaluations?.submitting || 'Submitting') : (t.evaluations?.submitForApproval || 'Submit')}
                </button>
              )}
              
              {evaluationStatus === 'submitted' && (
                <div className="flex flex-col gap-2">
                  <div className="px-3 py-2 bg-amber-100 text-amber-800 text-sm font-medium rounded-lg text-center">
                    {t.evaluations?.awaitingEmployeeApproval || 'Awaiting Approval'}
                  </div>
                  {userRole === 'hr' && (
                    <button
                      onClick={onUnlockEvaluation}
                      disabled={submitting}
                      className="px-4 py-3 min-h-[44px] bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 active:scale-95 transition-all duration-150 touch-manipulation flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      {submitting ? (t.evaluations?.unlocking || 'Unlocking') : (t.evaluations?.unlock || 'Unlock')}
                    </button>
                  )}
                </div>
              )}
              
              {evaluationStatus === 'completed' && (
                <div className="px-3 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-lg text-center">
                  {t.evaluations?.evaluationCompleted || 'Completed'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}