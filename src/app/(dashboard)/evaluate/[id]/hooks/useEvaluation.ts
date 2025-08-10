import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { useToast } from '@/hooks/useToast'
import { hapticFeedback } from '@/utils/haptics'
import { submitEvaluation, unlockEvaluation, updateEvaluationItem } from '@/lib/actions/evaluations'
import type { 
  EvaluationItem, 
  EvaluationStatus, 
  EvaluationProgress, 
  ItemEditData
} from '../types'
import { MIN_COMMENT_LENGTH } from '../types'

interface UseEvaluationProps {
  employeeId: string
  initialItems: EvaluationItem[]
  initialEvaluationId?: string | null
  initialEvaluationStatus?: EvaluationStatus
  initialOverallRating?: number | null
  initialOverallComment?: string
  userRole: string
}

export function useEvaluation({
  employeeId,
  initialItems,
  initialEvaluationId,
  initialEvaluationStatus = 'draft',
  initialOverallRating,
  initialOverallComment = '',
  userRole
}: UseEvaluationProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const { error, success } = useToast()

  // State management
  const [currentStep, setCurrentStep] = useState(0)
  const [evaluationItems, setEvaluationItems] = useState<EvaluationItem[]>(initialItems)
  const [overallRating, setOverallRating] = useState<number | null>(initialOverallRating || null)
  const [overallComment, setOverallComment] = useState(initialOverallComment)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingItemData, setEditingItemData] = useState<ItemEditData | null>(null)
  const [evaluationStatus, setEvaluationStatus] = useState<EvaluationStatus>(initialEvaluationStatus)
  const [evaluationId, setEvaluationId] = useState<string | null>(initialEvaluationId || null)

  // Check if evaluation is locked (submitted or completed)
  const isEvaluationLocked = useMemo(() => 
    evaluationStatus === 'submitted' || evaluationStatus === 'completed', 
    [evaluationStatus]
  )

  // Calculate progress
  const calculateProgress = useCallback((): EvaluationProgress => {
    let completedCount = 0
    evaluationItems.forEach(item => {
      if (item.rating && item.comment && item.comment.trim().length >= MIN_COMMENT_LENGTH) {
        completedCount++
      }
    })
    if (overallRating && overallComment && overallComment.trim().length >= MIN_COMMENT_LENGTH) {
      completedCount++
    }
    return { completed: completedCount, total: evaluationItems.length + 1 }
  }, [evaluationItems, overallRating, overallComment])

  const progress = calculateProgress()
  const isAllComplete = progress.completed === progress.total

  const totalSteps = evaluationItems.length + 1 // +1 for overall rating
  const currentItem = currentStep < evaluationItems.length 
    ? evaluationItems[currentStep] 
    : null

  const isOverall = currentStep >= evaluationItems.length
  const isOKR = currentItem?.type === 'okr'

  // Check if current item has valid rating and comment
  const isCurrentItemValid = useCallback(() => {
    if (isOverall) {
      return Boolean(overallRating && overallComment.trim().length >= MIN_COMMENT_LENGTH)
    } else if (currentItem) {
      return Boolean(currentItem.rating && currentItem.comment.trim().length >= MIN_COMMENT_LENGTH)
    }
    return false
  }, [isOverall, overallRating, overallComment, currentItem])

  // Handle item editing
  const handleSaveItemEdit = useCallback(async () => {
    if (!editingItemId || !editingItemData) return

    try {
      const result = await updateEvaluationItem(editingItemId, {
        title: editingItemData.title,
        description: editingItemData.description
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to save changes')
      }

      setEvaluationItems(prevItems => prevItems.map(item => 
        item.id === editingItemId 
          ? { ...item, title: editingItemData.title, description: editingItemData.description }
          : item
      ))
      
      setEditingItemId(null)
      setEditingItemData(null)
      success('Item updated successfully')
      
    } catch (updateErr) {
      console.error('Error updating item:', updateErr)
      error('Failed to update item')
    }
  }, [editingItemId, editingItemData, success, error])

  // Event handlers
  const handleRating = useCallback((rating: number) => {
    if (evaluationStatus !== 'draft') return
    
    hapticFeedback.light()
    
    if (currentItem) {
      const updatedItems = evaluationItems.map(item => 
        item.id === currentItem.id ? { ...item, rating } : item
      )
      setEvaluationItems(updatedItems)
    } else if (isOverall) {
      setOverallRating(rating)
    }
  }, [evaluationStatus, currentItem, evaluationItems, isOverall])

  const handleCommentChange = useCallback((comment: string) => {
    if (evaluationStatus !== 'draft') return
    
    if (currentItem) {
      const updatedItems = evaluationItems.map(item => 
        item.id === currentItem.id ? { ...item, comment } : item
      )
      setEvaluationItems(updatedItems)
    } else if (isOverall) {
      setOverallComment(comment)
    }
  }, [evaluationStatus, currentItem, evaluationItems, isOverall])

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
      
      setTimeout(() => {
        const ratingSection = document.querySelector('[data-rating-section]')
        if (ratingSection) {
          ratingSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          })
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }, 100)
    }
  }, [currentStep, totalSteps])

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  // Submit evaluation for approval
  const handleSubmitForApproval = useCallback(async (autoSaveAction: () => Promise<void>) => {
    if (!isAllComplete) return
    
    try {
      setSubmitting(true)
      
      // First save the latest data
      await autoSaveAction()
      
      // Submit for approval - evaluationId must exist at this point
      if (!evaluationId) {
        error('No evaluation to submit. Please save some data first.')
        return
      }
      
      const result = await submitEvaluation(evaluationId)
      
      if (result.success) {
        hapticFeedback.success()
        setEvaluationStatus('submitted')
        
        setShowSuccess(true)
        
        setTimeout(() => {
          success(t.evaluations?.evaluationSubmittedSuccess || 'Evaluation submitted successfully!')
        }, 500)
        
        setTimeout(() => {
          router.push('/evaluations')
        }, 3000)
      } else {
        error(result.error || 'Failed to submit evaluation')
      }
    } catch {
      error('Failed to submit evaluation')
    } finally {
      setSubmitting(false)
    }
  }, [isAllComplete, evaluationId, t, success, error, router])

  // Unlock evaluation (HR only)
  const handleUnlockEvaluation = useCallback(async () => {
    if (!evaluationId) return
    
    try {
      setSubmitting(true)
      const result = await unlockEvaluation(evaluationId, 'Manual unlock by HR')
      
      if (result.success) {
        hapticFeedback.success()
        success(t.evaluations?.evaluationUnlocked || 'Evaluation unlocked')
        setEvaluationStatus('draft')
        router.refresh()
      } else {
        error(result.error || 'Failed to unlock evaluation')
      }
    } catch {
      error('Failed to unlock evaluation')
    } finally {
      setSubmitting(false)
    }
  }, [evaluationId, t, success, error, router])

  const handleStartEditing = useCallback((itemId: string, title: string, description: string) => {
    setEditingItemId(itemId)
    setEditingItemData({ title, description })
  }, [])

  const handleCancelEditing = useCallback(() => {
    setEditingItemId(null)
    setEditingItemData(null)
  }, [])

  const handleUpdateEditingData = useCallback((data: ItemEditData) => {
    setEditingItemData(data)
  }, [])

  return {
    // State
    currentStep,
    evaluationItems,
    overallRating,
    overallComment,
    submitting,
    showSuccess,
    editingItemId,
    editingItemData,
    evaluationStatus,
    evaluationId,
    
    // Computed values
    isEvaluationLocked,
    progress,
    isAllComplete,
    totalSteps,
    currentItem,
    isOverall,
    isOKR,
    
    // Functions
    isCurrentItemValid,
    handleRating,
    handleCommentChange,
    handleNext,
    handlePrevious,
    handleSubmitForApproval,
    handleUnlockEvaluation,
    handleSaveItemEdit,
    handleStartEditing,
    handleCancelEditing,
    handleUpdateEditingData,
    
    // Setters for external use
    setEvaluationId,
    setOverallComment
  }
}