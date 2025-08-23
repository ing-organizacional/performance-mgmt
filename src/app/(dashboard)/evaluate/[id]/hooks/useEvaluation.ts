import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { useToast } from '@/hooks/useToast'
import { hapticFeedback } from '@/lib/utils/haptics'
import { submitEvaluation, unlockEvaluation, updateEvaluationItem, autosaveEvaluation } from '@/lib/actions/evaluations'
import type { 
  EvaluationItem, 
  EvaluationStatus, 
  EvaluationProgress, 
  ItemEditData
} from '../types'
import { MIN_COMMENT_LENGTH } from '../types'

interface UseEvaluationProps {
  initialItems: EvaluationItem[]
  initialEvaluationId?: string | null
  initialEvaluationStatus?: EvaluationStatus
  initialOverallRating?: number | null
  initialOverallComment?: string
  employeeId: string
}

export function useEvaluation({
  initialItems,
  initialEvaluationId,
  initialEvaluationStatus = 'draft',
  initialOverallRating,
  initialOverallComment = '',
  employeeId
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
  
  // Autosave state
  const [autoSaving, setAutoSaving] = useState(false)
  const [pendingSave, setPendingSave] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Use ref to store latest state values to avoid closure issues
  const latestStateRef = useRef({
    evaluationItems,
    overallRating,
    overallComment,
    evaluationId,
    evaluationStatus
  })
  
  // Update ref whenever state changes
  latestStateRef.current = {
    evaluationItems,
    overallRating,
    overallComment,
    evaluationId,
    evaluationStatus
  }

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

  // Allow navigation between items without validation (items can be completed later)
  const isCurrentItemValid = useCallback(() => {
    // Always allow navigation between items
    // Validation will be enforced only when submitting the entire evaluation
    return true
  }, [])

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

  // Auto-save functionality using refs to avoid closure issues
  const autoSaveEvaluationAction = useCallback(async () => {
    const currentState = latestStateRef.current
    
    if (currentState.evaluationStatus !== 'draft') return // Only auto-save drafts
    
    try {
      setAutoSaving(true)
      setPendingSave(false)
      
      const result = await autosaveEvaluation({
        employeeId,
        evaluationItems: currentState.evaluationItems.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          type: item.type as 'okr' | 'competency',
          rating: item.rating,
          comment: item.comment
        })),
        overallRating: currentState.overallRating,
        overallComment: currentState.overallComment
      })
      
      // Update evaluationId if it was created during auto-save
      if (result.success && result.evaluationId && !currentState.evaluationId) {
        setEvaluationId(result.evaluationId)
      }
      
      // Show success state if save was successful
      if (result.success) {
        setAutoSaving(false)
        setSaveSuccess(true)
        
        // Hide success message after 2 seconds
        successTimeoutRef.current = setTimeout(() => {
          setSaveSuccess(false)
        }, 2000)
      } else {
        // If save failed, just hide the saving indicator
        setAutoSaving(false)
      }
      
    } catch (err) {
      console.error('Auto-save error:', err)
      setAutoSaving(false)
    }
  }, [employeeId]) // Minimal dependencies

  const triggerAutoSave = useCallback(() => {
    // Clear existing timeouts
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current)
    }
    
    // Hide success message and show pending save indicator immediately
    setSaveSuccess(false)
    setPendingSave(true)
    
    // Set new timeout for auto-save (1 second delay)
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveEvaluationAction()
    }, 1000)
  }, [autoSaveEvaluationAction])

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
    
    // Trigger autosave after state update
    triggerAutoSave()
  }, [evaluationStatus, currentItem, evaluationItems, isOverall, triggerAutoSave])

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
    
    // Trigger autosave after state update
    triggerAutoSave()
  }, [evaluationStatus, currentItem, evaluationItems, isOverall, triggerAutoSave])

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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
      }
    }
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
    
    // Autosave state
    autoSaving: autoSaving || pendingSave,
    saveSuccess,
    
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
    
    // Autosave functions
    triggerAutoSave,
    autoSaveEvaluationAction,
    
    // Setters for external use
    setEvaluationId,
    setOverallComment
  }
}