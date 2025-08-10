import { useRef, useCallback, useState } from 'react'
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
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-save functionality
  const autoSaveEvaluationAction = useCallback(async () => {
    if (evaluationStatus !== 'draft') return // Only auto-save drafts
    
    try {
      setAutoSaving(true)
      const result = await autosaveEvaluation({
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
      })
      
      // Update evaluationId if it was created during auto-save
      if (result.success && result.evaluationId && !evaluationId) {
        onEvaluationIdChange(result.evaluationId)
      }
    } catch (err) {
      console.error('Auto-save error:', err)
    } finally {
      setAutoSaving(false)
    }
  }, [evaluationStatus, employeeId, evaluationItems, overallRating, overallComment, evaluationId, onEvaluationIdChange])

  const triggerAutoSave = useCallback(() => {
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    
    // Set new timeout for auto-save (2 second delay as per requirements)
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveEvaluationAction()
    }, 2000)
  }, [autoSaveEvaluationAction])

  return {
    autoSaving,
    triggerAutoSave,
    autoSaveEvaluationAction
  }
}