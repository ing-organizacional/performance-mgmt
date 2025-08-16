'use client'

import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { ToastContainer, RedirectingPage } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { useEvaluation, useAutosave } from './hooks'
import { EvaluationSteps, ItemRating, OverallRating, SubmissionControls } from './components'
import type { EvaluateClientProps } from './types'

export default function EvaluateClient({ 
  employeeId, 
  employee, 
  initialItems, 
  userRole,
  evaluationId: initialEvaluationId,
  evaluationStatus: initialEvaluationStatus = 'draft',
  initialOverallRating,
  initialOverallComment = ''
}: EvaluateClientProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const { toasts, removeToast } = useToast()
  
  // Use custom hooks for state management
  const evaluation = useEvaluation({
    initialItems,
    initialEvaluationId,
    initialEvaluationStatus,
    initialOverallRating,
    initialOverallComment
  })

  // Auto-save hook
  const { autoSaving, saveSuccess, triggerAutoSave, autoSaveEvaluationAction } = useAutosave({
    employeeId,
    evaluationStatus: evaluation.evaluationStatus,
    evaluationItems: evaluation.evaluationItems,
    overallRating: evaluation.overallRating,
    overallComment: evaluation.overallComment,
    evaluationId: evaluation.evaluationId,
    onEvaluationIdChange: evaluation.setEvaluationId
  })

  // Enhanced event handlers with auto-save integration
  const handleRatingWithAutoSave = (rating: number) => {
    evaluation.handleRating(rating)
    triggerAutoSave()
  }

  const handleCommentChangeWithAutoSave = (comment: string) => {
    evaluation.handleCommentChange(comment)
    triggerAutoSave()
  }

  // Back to list
  const handleBackToList = () => {
    router.back()
  }

  // Submit evaluation with auto-save integration
  const handleSubmitForApproval = () => {
    evaluation.handleSubmitForApproval(autoSaveEvaluationAction)
  }

  // Success screen
  if (evaluation.showSuccess) {
    return (
      <RedirectingPage
        message={t.evaluations?.evaluationSubmitted || 'Evaluation Submitted'}
        destination="evaluations page"
        showSuccess={true}
      />
    )
  }

  // No items screen
  if (evaluation.evaluationItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Evaluation Items</h3>
          <p className="text-gray-600">There are no evaluation items assigned to this employee.</p>
          <button 
            onClick={handleBackToList}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t.common?.back || 'Back'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <EvaluationSteps
        employee={employee}
        currentStep={evaluation.currentStep}
        totalSteps={evaluation.totalSteps}
        progress={evaluation.progress}
        evaluationStatus={evaluation.evaluationStatus}
        userRole={userRole}
        autoSaving={autoSaving}
        saveSuccess={saveSuccess}
        isAllComplete={evaluation.isAllComplete}
        submitting={evaluation.submitting}
        onBack={handleBackToList}
        onSubmitForApproval={handleSubmitForApproval}
        onUnlockEvaluation={evaluation.handleUnlockEvaluation}
      />

      {/* Content */}
      <div className="flex flex-col h-[calc(100vh-140px)]">
        {!evaluation.isOverall && evaluation.currentItem && evaluation.evaluationItems.length > 0 && (
          <ItemRating
            item={evaluation.currentItem}
            evaluationStatus={evaluation.evaluationStatus}
            isOKR={evaluation.isOKR}
            editingItemId={evaluation.editingItemId}
            editingItemData={evaluation.editingItemData}
            onRating={handleRatingWithAutoSave}
            onCommentChange={handleCommentChangeWithAutoSave}
            onStartEditing={evaluation.handleStartEditing}
            onCancelEditing={evaluation.handleCancelEditing}
            onSaveItemEdit={evaluation.handleSaveItemEdit}
            onUpdateEditingData={evaluation.handleUpdateEditingData}
          />
        )}

        {evaluation.isOverall && evaluation.evaluationItems.length > 0 && (
          <OverallRating
            overallRating={evaluation.overallRating}
            overallComment={evaluation.overallComment}
            evaluationStatus={evaluation.evaluationStatus}
            onRating={handleRatingWithAutoSave}
            onCommentChange={handleCommentChangeWithAutoSave}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <SubmissionControls
        currentStep={evaluation.currentStep}
        totalSteps={evaluation.totalSteps}
        isCurrentItemValid={evaluation.isCurrentItemValid}
        onPrevious={evaluation.handlePrevious}
        onNext={evaluation.handleNext}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}