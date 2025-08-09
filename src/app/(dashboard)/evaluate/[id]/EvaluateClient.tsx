'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useCallback, useMemo } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { ToastContainer, SpeechTextarea, StarRating, RedirectingPage } from '@/components/ui'
import type { SpeechTextareaRef } from '@/components/ui/SpeechTextarea'
import { DeadlineDisplay } from '@/components/features/evaluation'
import { useToast } from '@/hooks/useToast'
import { hapticFeedback } from '@/utils/haptics'
import { submitEvaluation, autosaveEvaluation, unlockEvaluation, updateEvaluationItem } from '@/lib/actions/evaluations'

interface EvaluationItem {
  id: string
  title: string
  description: string
  type: string
  rating: number | null
  comment: string
  level?: string
  createdBy?: string
  creatorRole?: string
  evaluationDeadline?: string | null
  deadlineSetBy?: string | null
  deadlineSetByRole?: string | null
}

interface Employee {
  id: string
  name: string
  role: string
  position: string
}

interface EvaluateClientProps {
  employeeId: string
  employee: Employee
  initialItems: EvaluationItem[]
  userRole: string
  companyId: string
  evaluationId?: string | null
  evaluationStatus?: 'draft' | 'submitted' | 'completed'
  initialOverallRating?: number | null
  initialOverallComment?: string
}

// Minimum comment length (approximately 2-3 sentences - around 100 characters minimum)
const MIN_COMMENT_LENGTH = 100

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
  const { toasts, error, success, removeToast } = useToast()
  
  // State management
  const [currentStep, setCurrentStep] = useState(0)
  const [evaluationItems, setEvaluationItems] = useState<EvaluationItem[]>(initialItems)
  const [overallRating, setOverallRating] = useState<number | null>(initialOverallRating || null)
  const [overallComment, setOverallComment] = useState(initialOverallComment)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingItemData, setEditingItemData] = useState<{ title: string; description: string } | null>(null)
  const [evaluationStatus, setEvaluationStatus] = useState<'draft' | 'submitted' | 'completed'>(initialEvaluationStatus)
  const [autoSaving, setAutoSaving] = useState(false)
  const [evaluationId, setEvaluationId] = useState<string | null>(initialEvaluationId || null)
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const commentTextareaRef = useRef<SpeechTextareaRef>(null)
  
  // Check if evaluation is locked (submitted or completed)
  const isEvaluationLocked = useMemo(() => 
    evaluationStatus === 'submitted' || evaluationStatus === 'completed', 
    [evaluationStatus]
  )
  
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
        setEvaluationId(result.evaluationId)
      }
    } catch (err) {
      console.error('Auto-save error:', err)
    } finally {
      setAutoSaving(false)
    }
  }, [evaluationStatus, employeeId, evaluationItems, overallRating, overallComment, evaluationId])

  const triggerAutoSave = useCallback(() => {
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    
    // Set new timeout for auto-save (1 second delay)
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveEvaluationAction()
    }, 1000)
  }, [autoSaveEvaluationAction])

  // Handle item editing
  const handleSaveItemEdit = async () => {
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
  }

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
    
    setTimeout(() => {
      commentTextareaRef.current?.focus()
    }, 100)
    
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
    
    triggerAutoSave()
  }, [evaluationStatus, currentItem, evaluationItems, isOverall, triggerAutoSave])

  const handleNext = () => {
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
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Submit evaluation for approval
  const handleSubmitForApproval = async () => {
    if (!isAllComplete) return
    
    try {
      setSubmitting(true)
      
      // First save the latest data
      await autoSaveEvaluationAction()
      
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
  }

  // Unlock evaluation (HR only)
  const handleUnlockEvaluation = async () => {
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
  }

  // Back to list
  const handleBackToList = () => {
    router.back()
  }

  // Success screen
  if (showSuccess) {
    return (
      <RedirectingPage
        message={t.evaluations?.evaluationSubmitted || 'Evaluation Submitted'}
        destination="evaluations page"
        showSuccess={true}
      />
    )
  }

  if (evaluationItems.length === 0) {
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
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={handleBackToList}
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
                  onClick={handleSubmitForApproval}
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
                      onClick={handleUnlockEvaluation}
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

      {/* Content */}
      <div className="flex flex-col h-[calc(100vh-140px)]">
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
                        {isOKR ? (t.evaluations?.okr || 'OKR') : (t.evaluations?.competency || 'Competency')}
                      </span>
                      {currentItem.level && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${
                          currentItem.level === 'company' ? 'bg-purple-100 text-purple-700' :
                          currentItem.level === 'department' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {currentItem.level === 'company' ? (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              {t.common?.company || 'Company'}
                            </>
                          ) : currentItem.level === 'department' ? (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {t.common?.department || 'Department'}
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {t.common?.manager || 'Manager'}
                            </>
                          )}
                        </span>
                      )}
                      {evaluationStatus === 'completed' ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium bg-green-50 border-green-200 text-green-700">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="font-semibold">{t.status?.completed || 'Completed'}</span>
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
                        {t.dashboard.createdBy} {currentItem.createdBy}
                      </p>
                    )}
                    {currentItem.evaluationDeadline && currentItem.deadlineSetBy && (
                      <p className="text-xs text-gray-500">
                        {t.dashboard.deadlineSetBy} {currentItem.deadlineSetBy}
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
                      {editingItemId === currentItem.id ? (t.common?.cancel || 'Cancel') : (t.common?.edit || 'Edit')}
                    </span>
                  </button>
                )}
              </div>
              
              {editingItemId === currentItem.id && editingItemData ? (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {t.okrs?.objective || 'Objective'}
                    </label>
                    <input
                      type="text"
                      value={editingItemData.title}
                      onChange={(e) => setEditingItemData({
                        ...editingItemData,
                        title: e.target.value
                      })}
                      className="w-full text-xl font-semibold text-gray-900 bg-blue-50 border border-blue-200 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t.okrs?.objective || 'Title'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {t.okrs?.keyResults || 'Key Results'}
                    </label>
                    <textarea
                      value={editingItemData.description}
                      onChange={(e) => setEditingItemData({
                        ...editingItemData,
                        description: e.target.value
                      })}
                      className="w-full text-gray-900 bg-blue-50 border border-blue-200 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder={t.okrs?.keyResults || 'Description'}
                    />
                  </div>
                  <div>
                    <button
                      onClick={() => handleSaveItemEdit()}
                      className="group flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold text-sm rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-sm shadow-green-200"
                    >
                      <span className="text-lg group-hover:scale-110 transition-transform duration-200">✓</span>
                      <span>{t.common?.save || 'Save'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {isOKR ? (t.okrs?.objective || 'Objective') : (t.evaluations?.competency || 'Competency')}
                    </label>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {currentItem.title}
                    </h2>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {isOKR ? (t.okrs?.keyResults || 'Key Results') : (t.evaluations?.competency || 'Competency')}
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
                    <p className="text-lg font-bold text-gray-800 mb-1">{t.evaluations?.ratePerformance || 'Rate Performance'}</p>
                    <p className="text-sm text-gray-600">
                      {isEvaluationLocked ? 
                        (evaluationStatus === 'submitted' ? (t.evaluations?.awaitingEmployeeApproval || 'Awaiting Employee Approval') : (t.evaluations?.evaluationCompleted || 'Evaluation Completed')) :
                        (t.evaluations?.tapToRate || 'Tap to rate')
                      }
                    </p>
                  </div>
                  
                  <div className="mb-1 px-4">
                    <StarRating
                      rating={currentItem.rating}
                      onRatingChange={handleRating}
                      disabled={isEvaluationLocked}
                      size="large"
                    />
                  </div>
                  {currentItem.rating && (
                    <p className="text-center text-lg font-semibold text-gray-800 mt-3">
                      {currentItem.rating === 1 && (t.ratings?.needsImprovement || 'Needs Improvement')}
                      {currentItem.rating === 2 && (t.ratings?.belowExpectations || 'Below Expectations')}
                      {currentItem.rating === 3 && (t.ratings?.meetsExpectations || 'Meets Expectations')}
                      {currentItem.rating === 4 && (t.ratings?.exceedsExpectations || 'Exceeds Expectations')}
                      {currentItem.rating === 5 && (t.ratings?.outstanding || 'Outstanding')}
                    </p>
                  )}
                </div>

                {/* Comments Section */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-lg font-semibold text-gray-800">
                      {t.evaluations?.comments || 'Comments'} <span className="text-red-500">*</span>
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
                    {(t.evaluations?.minimumCharacters?.replace('{count}', MIN_COMMENT_LENGTH.toString()) || `Minimum ${MIN_COMMENT_LENGTH} characters`)}. {t.evaluations?.commentGuidance || 'Provide detailed, specific feedback.'}
                  </p>
                  
                  <SpeechTextarea
                    ref={commentTextareaRef}
                    value={currentItem.comment}
                    onChange={(value) => !isEvaluationLocked && handleCommentChange(value)}
                    placeholder={isEvaluationLocked ? "" : (t.evaluations?.commentPlaceholder || 'Provide detailed feedback on performance, achievements, and areas for improvement...')}
                    disabled={isEvaluationLocked}
                    rows={8}
                    maxLength={1000}
                    showCharCount={true}
                    className={`px-4 py-3 border-2 rounded-xl shadow-sm transition-all duration-200 ${
                      isEvaluationLocked 
                        ? 'bg-gray-50 border-gray-300 cursor-not-allowed'
                        : (currentItem?.comment.trim().length || 0) >= MIN_COMMENT_LENGTH
                        ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                        : 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    } focus:ring-4`}
                  />
                </div>

              </div>
            </div>
          </>
        )}

        {isOverall && evaluationItems.length > 0 && (
          <div className="px-4 pb-20">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">📊</span>
                  <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                    {t.evaluations?.overallRating || 'Overall Rating'}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {t.evaluations?.overallPerformance || 'Overall Performance'}
                </h2>
                <p className="text-gray-600">
                  {t.evaluations?.provideFeedback || 'Provide an overall assessment based on all evaluation items'}
                </p>
              </div>

              {/* Rating Stars */}
              <div className="mb-6">
                <p className="text-sm font-bold text-gray-700 mb-3">{t.evaluations?.overallRating || 'Overall Rating'}</p>
                <StarRating
                  rating={overallRating}
                  onRatingChange={handleRating}
                  disabled={isEvaluationLocked}
                  size="large"
                />
                {overallRating && (
                  <p className="text-center text-sm text-gray-600 mt-2">
                    {overallRating === 1 && (t.ratings?.needsImprovement || 'Needs Improvement')}
                    {overallRating === 2 && (t.ratings?.belowExpectations || 'Below Expectations')}
                    {overallRating === 3 && (t.ratings?.meetsExpectations || 'Meets Expectations')}
                    {overallRating === 4 && (t.ratings?.exceedsExpectations || 'Exceeds Expectations')}
                    {overallRating === 5 && (t.ratings?.outstanding || 'Outstanding')}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.evaluations?.overallComments || 'Overall Comments'} <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({t.evaluations?.minimumCharacters?.replace('{count}', MIN_COMMENT_LENGTH.toString()) || `Minimum ${MIN_COMMENT_LENGTH} characters`} - {overallComment.trim().length}/{MIN_COMMENT_LENGTH})
                  </span>
                </label>
                <SpeechTextarea
                  value={overallComment}
                  onChange={(value) => !isEvaluationLocked && setOverallComment(value)}
                  placeholder={isEvaluationLocked ? "" : (t.evaluations?.commentPlaceholder || "Provide comprehensive overall feedback...")}
                  disabled={isEvaluationLocked}
                  rows={6}
                  maxLength={2000}
                  showCharCount={true}
                  className={`px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    isEvaluationLocked ? 'bg-gray-50 cursor-not-allowed' : ''
                  }`}
                />
              </div>
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
              {t.common?.previous || 'Previous'}
            </button>
          )}
          {currentStep < totalSteps - 1 && (
            <button
              onClick={handleNext}
              disabled={!isCurrentItemValid()}
              className="flex-1 py-4 px-6 min-h-[50px] bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:scale-95 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-150 touch-manipulation"
            >
              {t.common?.next || 'Next'}
            </button>
          )}
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}