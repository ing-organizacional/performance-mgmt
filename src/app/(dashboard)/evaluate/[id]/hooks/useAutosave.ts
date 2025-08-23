import { useRef, useCallback, useState, useEffect } from 'react'
import { autosaveEvaluation } from '@/lib/actions/evaluations'
import type { EvaluationItem, EvaluationStatus } from '../types'

interface UseAutosaveProps {
  employeeId: string
  evaluationStatus: EvaluationStatus
  evaluationItems: EvaluationItem[]
  overallRating: number | null
  overallComment: string
  evaluationId: string | null
  onEvaluationIdChange: (id: string) => void
}

export function useAutosave({
  employeeId,
  evaluationStatus,
  evaluationItems,
  overallRating,
  overallComment,
  evaluationId,
  onEvaluationIdChange
}: UseAutosaveProps) {
  const [autoSaving, setAutoSaving] = useState(false)
  const [pendingSave, setPendingSave] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const savingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-save functionality
  const autoSaveEvaluationAction = useCallback(async () => {
    if (evaluationStatus !== 'draft') return // Only auto-save drafts
    
    
    try {
      setAutoSaving(true)
      setPendingSave(false)
      
      const dataToSend = {
        employeeId,
        evaluationItems: evaluationItems.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          type: item.type as 'okr' | 'competency',
          rating: item.rating,
          comment: item.comment
        })),
        overallRating,
        overallComment
      }
      
      
      const result = await autosaveEvaluation(dataToSend)
      
      // Update evaluationId if it was created during auto-save
      if (result.success && result.evaluationId && !evaluationId) {
        onEvaluationIdChange(result.evaluationId)
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
  }, [evaluationStatus, employeeId, evaluationItems, overallRating, overallComment, evaluationId, onEvaluationIdChange])

  const triggerAutoSave = useCallback(() => {
    // Clear existing timeouts
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    if (savingTimeoutRef.current) {
      clearTimeout(savingTimeoutRef.current)
    }
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current)
    }
    
    // Hide success message and show pending save indicator immediately
    setSaveSuccess(false)
    setPendingSave(true)
    
    // Set new timeout for auto-save (1 second delay like original)
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveEvaluationAction()
    }, 1000)
  }, [autoSaveEvaluationAction])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      if (savingTimeoutRef.current) {
        clearTimeout(savingTimeoutRef.current)
      }
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
      }
    }
  }, [])

  return {
    autoSaving: autoSaving || pendingSave,
    saveSuccess,
    triggerAutoSave,
    autoSaveEvaluationAction
  }
}