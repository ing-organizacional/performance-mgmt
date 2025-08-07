'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { ToastContainer } from '@/components/ui'
import { DeadlineDisplay } from '@/components/features/evaluation'
import { useToast } from '@/hooks/useToast'
import { hapticFeedback } from '@/utils/haptics'
import { submitEvaluation, autosaveEvaluation, getEvaluation, getTeamData, getEvaluationItems, unlockEvaluation } from '@/lib/actions/evaluations'

interface EvaluationItem {
  id: string
  title: string
  description: string
  type: string // 'okr' or 'competency'
  rating: number | null
  comment: string
  level?: string
  createdBy?: string
  creatorRole?: string
  evaluationDeadline?: string | null
  deadlineSetBy?: string | null
  deadlineSetByRole?: string | null
}

// These will be populated with translated content in the component

// Minimum comment length (approximately 2-3 sentences - around 100 characters minimum)
const MIN_COMMENT_LENGTH = 100

export default function EvaluatePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const { t } = useLanguage()
  const { toasts, error, success, removeToast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [evaluationItems, setEvaluationItems] = useState<EvaluationItem[]>([])
  const [overallRating, setOverallRating] = useState<number | null>(null)
  const [overallComment, setOverallComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [employeeName, setEmployeeName] = useState('')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingItemData, setEditingItemData] = useState<{ title: string; description: string } | null>(null)
  const [isCompletedEvaluation, setIsCompletedEvaluation] = useState(false)
  const [evaluationId, setEvaluationId] = useState<string | null>(null)
  const [evaluationStatus, setEvaluationStatus] = useState<'draft' | 'submitted' | 'completed'>('draft')
  const [autoSaving, setAutoSaving] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Ref for focusing on comment textarea
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Calculate progress
  const calculateProgress = () => {
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
  }
  
  const progress = calculateProgress()
  const isAllComplete = progress.completed === progress.total

  const totalSteps = evaluationItems.length + 1 // +1 for overall rating
  const currentItem = currentStep < evaluationItems.length 
    ? evaluationItems[currentStep] 
    : null

  const isOverall = currentStep >= evaluationItems.length
  const isOKR = currentItem?.type === 'okr'
  
  // Check if current item has valid rating and comment
  const isCurrentItemValid = () => {
    if (isOverall) {
      return overallRating && overallComment.trim().length >= MIN_COMMENT_LENGTH
    } else if (currentItem) {
      return currentItem.rating && currentItem.comment.trim().length >= MIN_COMMENT_LENGTH
    }
    return false
  }

  const fetchEvaluationData = useCallback(async () => {
    try {
      // Fetch evaluation items for this specific employee
      const itemsResult = await getEvaluationItems(params.id as string)
      if (itemsResult.success) {
        setEvaluationItems(itemsResult.items || [])
      }

      // Fetch employee data
      const teamResult = await getTeamData()
      if (teamResult.success) {
        const employee = teamResult.employees?.find((emp: { id: string }) => emp.id === params.id)
        if (employee) {
          setEmployeeName(employee.name)
          
          // Check if employee has existing evaluation
          const latestEval = employee.evaluationsReceived?.[0]
          if (latestEval && (latestEval.status === 'submitted' || latestEval.status === 'draft' || latestEval.status === 'completed')) {
            setIsCompletedEvaluation(latestEval.status === 'completed')
            setEvaluationId(latestEval.id)
            setEvaluationStatus(latestEval.status)
            await loadExistingEvaluation(latestEval.id)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching evaluation data:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    // Reset current step when switching employees
    setCurrentStep(0)
    
    // Fetch evaluation items and employee data
    fetchEvaluationData()
  }, [session, status, router, fetchEvaluationData])

  // Refresh data when component comes into focus (user navigates back)
  useEffect(() => {
    const handleFocus = () => {
      // Refetch data when user returns to this page
      if (!loading) {
        fetchEvaluationData()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [fetchEvaluationData, loading])

  // Reset current step when evaluation items change (new employee)
  useEffect(() => {
    if (evaluationItems.length > 0) {
      setCurrentStep(0)
    }
  }, [params.id])

  const loadExistingEvaluation = async (evaluationId: string) => {
    try {
      const result = await getEvaluation(evaluationId)
      if (result.success && result.data) {
        const evaluation = result.data
        
        // Parse and load existing evaluation items data
        if (evaluation.evaluationItemsData) {
          const savedItems = JSON.parse(evaluation.evaluationItemsData)
          setEvaluationItems(prevItems => prevItems.map(item => {
            // Find the corresponding saved item by ID
            const savedItem = savedItems.find((saved: { id: string; rating?: number; comment?: string }) => saved.id === item.id)
            return {
              ...item,
              title: savedItem?.title || item.title,
              description: savedItem?.description || item.description,
              rating: savedItem?.rating || null,
              comment: savedItem?.comment || '',
              // Preserve deadline information from the original item
              evaluationDeadline: item.evaluationDeadline,
              deadlineSetBy: item.deadlineSetBy,
              deadlineSetByRole: item.deadlineSetByRole
            }
          }))
        }
        
        // Load overall rating and comments
        if (evaluation.overallRating) {
          setOverallRating(evaluation.overallRating)
        }
        if (evaluation.managerComments) {
          setOverallComment(evaluation.managerComments)
        }
      } else {
        console.error('Failed to load evaluation:', result.error)
      }
    } catch (error) {
      console.error('Error loading existing evaluation:', error)
    }
  }

  const handleSaveItemEdit = async () => {
    if (!editingItemId || !editingItemData) return

    try {
      // Save to database
      const response = await fetch(`/api/evaluation-items/${editingItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editingItemData.title,
          description: editingItemData.description
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save changes')
      }

      // Update the item in local state
      setEvaluationItems(prevItems => prevItems.map(item => 
        item.id === editingItemId 
          ? { ...item, title: editingItemData.title, description: editingItemData.description }
          : item
      ))
      
      // Exit edit mode
      setEditingItemId(null)
      setEditingItemData(null)
      
    } catch (err) {
      console.error('Error updating item:', err)
      error('Failed to update item')
    }
  }

  const handleRating = (rating: number) => {
    // Add haptic feedback for rating selection
    hapticFeedback.light()
    
    if (currentItem) {
      const updatedItems = evaluationItems.map(item => 
        item.id === currentItem.id ? { ...item, rating } : item
      )
      setEvaluationItems(updatedItems)
    } else if (isOverall) {
      setOverallRating(rating)
    }
    
    // Focus on comment textarea after rating (small delay for smooth UX)
    setTimeout(() => {
      commentTextareaRef.current?.focus()
    }, 100)
    
    // Trigger auto-save
    triggerAutoSave()
  }
  
  const handleCommentChange = (comment: string) => {
    if (currentItem) {
      const updatedItems = evaluationItems.map(item => 
        item.id === currentItem.id ? { ...item, comment } : item
      )
      setEvaluationItems(updatedItems)
    } else if (isOverall) {
      setOverallComment(comment)
    }
    
    // Trigger auto-save
    triggerAutoSave()
  }
  
  // Auto-save functionality
  const triggerAutoSave = () => {
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    
    // Set new timeout for auto-save (2 seconds delay)
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveEvaluationAction()
    }, 2000)
  }
  
  const autoSaveEvaluationAction = async () => {
    if (evaluationStatus !== 'draft') return // Only auto-save drafts
    
    try {
      setAutoSaving(true)
      const result = await autosaveEvaluation({
        employeeId: params.id as string,
        evaluationItems: evaluationItems.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          type: item.type as 'okr' | 'competency',
          rating: item.rating,
          comment: item.comment
        })),
        overallRating,
        overallComment,
        periodType: 'quarterly',
        periodDate: '2024-Q1'
      })
      
      if (result.success && result.evaluationId && !evaluationId) {
        setEvaluationId(result.evaluationId)
      }
      
      if (!result.success) {
        console.error('Auto-save failed:', result.error)
      }
    } catch (err) {
      console.error('Auto-save failed:', err)
    } finally {
      setAutoSaving(false)
    }
  }
  
  // Submit evaluation for approval
  const handleSubmitForApproval = async () => {
    if (!evaluationId || !isAllComplete) return
    
    try {
      setSubmitting(true)
      
      // First save the latest data
      await autoSaveEvaluationAction()
      
      // Then submit for approval
      const result = await submitEvaluation(evaluationId)
      
      if (result.success) {
        hapticFeedback.success()
        setEvaluationStatus('submitted')
        
        // Show success toast with a short delay for better UX
        setTimeout(() => {
          success(t.evaluations.evaluationSubmittedSuccess)
        }, 500)
        
        setTimeout(() => {
          router.push('/evaluations')
        }, 3000)
      } else {
        error(result.error || 'Failed to submit evaluation')
      }
    } catch (err) {
      error('Failed to submit evaluation')
    } finally {
      setSubmitting(false)
    }
  }

  // Unlock evaluation (HR only)
  const handleUnlockEvaluation = async () => {
    if (!evaluationId) return
    
    try {
      setSubmitting(true)
      const result = await unlockEvaluation(evaluationId)
      
      if (result.success) {
        hapticFeedback.success()
        success(t.evaluations.evaluationUnlocked)
        setEvaluationStatus('draft')
        // Refresh the evaluation data
        await fetchEvaluationData()
        router.refresh()
      } else {
        error(result.error || 'Failed to unlock evaluation')
      }
    } catch (err) {
      error('Failed to unlock evaluation')
    } finally {
      setSubmitting(false)
    }
  }
  

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
      
      // Auto-scroll to top of rating section for better UX
      setTimeout(() => {
        const ratingSection = document.querySelector('[data-rating-section]')
        if (ratingSection) {
          ratingSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          })
        } else {
          // Fallback: scroll to top of page
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }, 100)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t.common.loading}</div>
      </div>
    )
  }

  // Success screen
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-lg text-center max-w-md w-full animate-in fade-in-0 zoom-in-95 duration-500">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-4 animate-in zoom-in-0 duration-700 delay-200">
              <svg className="h-10 w-10 text-green-600 animate-in scale-in-0 duration-500 delay-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2 animate-in slide-in-from-bottom-4 duration-500 delay-300">
              {t.evaluations.evaluationSubmitted}
            </h2>
            <p className="text-gray-600 animate-in slide-in-from-bottom-4 duration-500 delay-400">
              {t.evaluations.evaluationSubmittedDesc.replace('{name}', employeeName)}
            </p>
          </div>
          
          <div className="flex items-center justify-center animate-in slide-in-from-bottom-4 duration-500 delay-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-500">{t.evaluations.redirecting}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-900">
                {employeeName ? `${employeeName} - ${t.evaluations.evaluation}` : t.evaluations.employeeEvaluation}
              </h1>
              <p className="text-sm text-gray-600">
                {currentStep + 1} of {totalSteps}
              </p>
            </div>
            <LanguageSwitcher />
            <div className="w-9" />
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
                  {t.evaluations.progress}: {progress.completed} {t.evaluations.of} {progress.total} {t.evaluations.itemsCompleted}
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
                  onClick={handleSubmitForApproval}
                  disabled={!isAllComplete || submitting}
                  className={`px-3 py-2 text-xs font-medium rounded-lg active:scale-95 transition-all duration-150 touch-manipulation ${
                    isAllComplete
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {submitting ? t.evaluations.submitting : t.evaluations.submitForApproval}
                </button>
              )}
              
              {evaluationStatus === 'submitted' && (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                    {t.evaluations.awaitingEmployeeApproval}
                  </span>
                  {session?.user?.role === 'hr' && (
                    <button
                      onClick={handleUnlockEvaluation}
                      disabled={submitting}
                      className="px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-700 active:scale-95 transition-all flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      {submitting ? t.evaluations.unlocking : t.evaluations.unlock}
                    </button>
                  )}
                </div>
              )}
              
              {evaluationStatus === 'completed' && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  {t.evaluations.evaluationCompleted}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col h-[calc(100vh-140px)]">
        {evaluationItems.length === 0 && !loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Evaluation Items</h3>
              <p className="text-gray-600">There are no evaluation items assigned to this employee.</p>
            </div>
          </div>
        )}
        
        {!isOverall && currentItem && evaluationItems.length > 0 && (
          <>
            {/* Fixed OKR/Competency Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-lg mx-4 mb-4 flex-shrink-0">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">
                      {isOKR ? '🎯' : '⭐'}
                    </span>
                    <div className="flex items-center space-x-2 flex-wrap gap-2">
                      <span className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                        {isOKR ? t.evaluations.okr : t.evaluations.competency}
                      </span>
                      {currentItem.level && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          currentItem.level === 'company' ? 'bg-purple-100 text-purple-700' :
                          currentItem.level === 'department' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {currentItem.level === 'company' ? `🏢 ${t.common.company}` :
                           currentItem.level === 'department' ? `🏬 ${t.common.department}` :
                           `👤 ${t.common.manager}`}
                        </span>
                      )}
                      {isCompletedEvaluation ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium bg-green-50 border-green-200 text-green-700">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="font-semibold">{t.status.completed}</span>
                        </div>
                      ) : currentItem.evaluationDeadline && (
                        <DeadlineDisplay 
                          deadline={currentItem.evaluationDeadline} 
                          showIcon={true}
                          showDate={false}
                          compact={true}
                        />
                      )}
                    </div>
                  </div>
                  <div className="ml-11 space-y-1">
                    {currentItem.createdBy && (
                      <p className="text-xs text-gray-500">
                        by {currentItem.createdBy}
                      </p>
                    )}
                    {currentItem.evaluationDeadline && currentItem.deadlineSetBy && (
                      <p className="text-xs text-gray-500">
                        deadline set by {currentItem.deadlineSetBy}
                      </p>
                    )}
                  </div>
                </div>
                {currentItem.level !== 'company' && (
                  <button
                    onClick={() => {
                      if (editingItemId === currentItem.id) {
                        setEditingItemId(null)
                        setEditingItemData(null)
                      } else {
                        setEditingItemId(currentItem.id)
                        setEditingItemData({
                          title: currentItem.title,
                          description: currentItem.description
                        })
                      }
                    }}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex-shrink-0 ${
                      editingItemId === currentItem.id 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-sm">
                      {editingItemId === currentItem.id ? '✕' : '✏️'}
                    </span>
                    <span>
                      {editingItemId === currentItem.id ? t.common.cancel : t.common.edit}
                    </span>
                  </button>
                )}
              </div>
              
              {editingItemId === currentItem.id && editingItemData ? (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {t.okrs.objective}
                    </label>
                    <input
                      type="text"
                      value={editingItemData.title}
                      onChange={(e) => setEditingItemData({
                        ...editingItemData,
                        title: e.target.value
                      })}
                      className="w-full text-xl font-semibold text-gray-900 bg-blue-50 border border-blue-200 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Title"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {t.okrs.keyResults}
                    </label>
                    <textarea
                      value={editingItemData.description}
                      onChange={(e) => setEditingItemData({
                        ...editingItemData,
                        description: e.target.value
                      })}
                      className="w-full text-gray-900 bg-blue-50 border border-blue-200 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="Description"
                    />
                  </div>
                  <div>
                    <button
                      onClick={() => handleSaveItemEdit()}
                      className="group flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold text-sm rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-sm shadow-green-200"
                    >
                      <span className="text-lg group-hover:scale-110 transition-transform duration-200">✓</span>
                      <span>{t.common.save}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {isOKR ? t.okrs.objective : t.evaluations.competency}
                    </label>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {currentItem.title}
                    </h2>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {isOKR ? t.okrs.keyResults : t.evaluations.competency}
                    </label>
                    <p className="text-gray-600">
                      {currentItem.description}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable Rating and Comments Section */}
<div className="flex-1 overflow-y-auto px-4 pb-20">
              <div className="space-y-4">
                {/* Rating Section */}
                <div className="bg-gray-50 rounded-xl p-6" data-rating-section>
                  <div className="text-center mb-3">
                    <p className="text-lg font-bold text-gray-800 mb-1">{t.evaluations.ratePerformance}</p>
                    <p className="text-sm text-gray-600">{t.evaluations.tapToRate}</p>
                  </div>
                  
                  <div className="flex gap-2 justify-center mb-1 px-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={isCompletedEvaluation ? undefined : () => handleRating(star)}
                        disabled={isCompletedEvaluation}
                        className={`flex items-center justify-center p-3 min-h-[44px] min-w-[44px] rounded-lg transition-colors duration-150 touch-manipulation ${
                          currentItem.rating && currentItem.rating >= star
                            ? 'text-yellow-500 bg-yellow-100'
                            : isCompletedEvaluation 
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-50 active:bg-yellow-100'
                        }`}
                      >
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  {currentItem.rating && (
                    <p className="text-center text-lg font-semibold text-gray-800 mt-3">
                      {currentItem.rating === 1 && t.ratings.needsImprovement}
                      {currentItem.rating === 2 && t.ratings.belowExpectations}
                      {currentItem.rating === 3 && t.ratings.meetsExpectations}
                      {currentItem.rating === 4 && t.ratings.exceedsExpectations}
                      {currentItem.rating === 5 && t.ratings.outstanding}
                    </p>
                  )}
                </div>

                {/* Comments Section */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-lg font-semibold text-gray-800">
                      {t.evaluations.comments} <span className="text-red-500">*</span>
                    </label>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      (currentItem?.comment.trim().length || 0) >= MIN_COMMENT_LENGTH 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {currentItem?.comment.trim().length || 0}/{MIN_COMMENT_LENGTH}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    {t.evaluations.minimumCharacters.replace('{count}', MIN_COMMENT_LENGTH.toString())}. {t.evaluations.commentGuidance}
                  </p>
                  
                  <textarea
                    ref={commentTextareaRef}
                    value={currentItem.comment}
                    onChange={isCompletedEvaluation ? undefined : (e) => handleCommentChange(e.target.value)}
                    placeholder={isCompletedEvaluation ? "" : t.evaluations.commentPlaceholder}
                    readOnly={isCompletedEvaluation}
                    className={`w-full px-4 py-3 border-2 rounded-xl shadow-sm transition-all duration-200 resize-none text-gray-900 ${
                      isCompletedEvaluation 
                        ? 'bg-gray-50 border-gray-300 cursor-not-allowed'
                        : (currentItem?.comment.trim().length || 0) >= MIN_COMMENT_LENGTH
                        ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                        : 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    } focus:ring-4`}
                    rows={8}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {isOverall && evaluationItems.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">📊</span>
                <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                  {t.evaluations.overallRating}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t.evaluations.overallPerformance}
              </h2>
              <p className="text-gray-600">
                {t.evaluations.provideFeedback}
              </p>
            </div>

            {/* Rating Stars */}
            <div className="mb-6">
              <p className="text-sm font-bold text-gray-700 mb-3">{t.evaluations.overallRating}</p>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={isCompletedEvaluation ? undefined : () => handleRating(star)}
                    disabled={isCompletedEvaluation}
                    className={`flex items-center justify-center p-3 min-h-[44px] min-w-[44px] rounded-lg transition-colors duration-150 touch-manipulation ${
                      overallRating && overallRating >= star
                        ? 'text-yellow-500 bg-yellow-100'
                        : isCompletedEvaluation
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-50 active:bg-yellow-100'
                    }`}
                  >
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
              {overallRating && (
                <p className="text-center text-sm text-gray-600 mt-2">
                  {overallRating === 1 && t.ratings.needsImprovement}
                  {overallRating === 2 && t.ratings.belowExpectations}
                  {overallRating === 3 && t.ratings.meetsExpectations}
                  {overallRating === 4 && t.ratings.exceedsExpectations}
                  {overallRating === 5 && t.ratings.outstanding}
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.evaluations.overallComments} <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-1">
                  ({t.evaluations.minimumCharacters.replace('{count}', MIN_COMMENT_LENGTH.toString())} - {overallComment.trim().length}/{MIN_COMMENT_LENGTH})
                </span>
              </label>
              <textarea
                value={overallComment}
                onChange={isCompletedEvaluation ? undefined : (e) => handleCommentChange(e.target.value)}
                placeholder={isCompletedEvaluation ? "" : "Provide comprehensive overall feedback..."}
                readOnly={isCompletedEvaluation}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                  isCompletedEvaluation ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
                rows={6}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={handlePrevious}
              className="flex-1 py-4 px-6 min-h-[50px] border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 active:scale-95 active:bg-gray-100 transition-all duration-150 touch-manipulation"
            >
              {t.common.previous}
            </button>
          )}
          {currentStep < totalSteps - 1 && (
            <button
              onClick={handleNext}
              disabled={!isCurrentItemValid()}
              className="flex-1 py-4 px-6 min-h-[50px] bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:scale-95 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-150 touch-manipulation"
            >
              {t.common.next}
            </button>
          )}
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}