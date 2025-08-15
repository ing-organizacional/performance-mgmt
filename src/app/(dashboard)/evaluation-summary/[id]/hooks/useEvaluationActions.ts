/**
 * Evaluation Actions Hook
 * 
 * Custom hook for handling evaluation actions including approval,
 * unlocking, and exporting with loading states and error handling.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { useToast } from '@/hooks/useToast'
import { unlockEvaluation, approveEvaluation } from '@/lib/actions/evaluations'

export function useEvaluationActions(evaluationId: string) {
  const { t } = useLanguage()
  const router = useRouter()
  const { error, success } = useToast()
  
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [isApproving, setIsApproving] = useState(false)

  const handleApproveEvaluation = async () => {
    if (!evaluationId) return
    
    setIsApproving(true)
    try {
      const result = await approveEvaluation(evaluationId)
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
    if (!evaluationId) return
    setIsUnlocking(true)
    setUnlockError(null)
    
    try {
      const result = await unlockEvaluation(evaluationId)
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

  return {
    isApproving,
    isUnlocking,
    unlockError,
    handleApproveEvaluation,
    handleUnlockEvaluation
  }
}