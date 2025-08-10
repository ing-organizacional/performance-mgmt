import { useRef, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { SpeechTextarea, StarRating } from '@/components/ui'
import type { SpeechTextareaRef } from '@/components/ui/SpeechTextarea'
import { DeadlineDisplay } from '@/components/features/evaluation'
import type { EvaluationItem, ItemEditData, EvaluationStatus } from '../types'
import { MIN_COMMENT_LENGTH } from '../types'

interface ItemRatingProps {
  item: EvaluationItem
  evaluationStatus: EvaluationStatus
  isOKR: boolean
  editingItemId: string | null
  editingItemData: ItemEditData | null
  onRating: (rating: number) => void
  onCommentChange: (comment: string) => void
  onStartEditing: (itemId: string, title: string, description: string) => void
  onCancelEditing: () => void
  onSaveItemEdit: () => void
  onUpdateEditingData: (data: ItemEditData) => void
}

export function ItemRating({
  item,
  evaluationStatus,
  isOKR,
  editingItemId,
  editingItemData,
  onRating,
  onCommentChange,
  onStartEditing,
  onCancelEditing,
  onSaveItemEdit,
  onUpdateEditingData
}: ItemRatingProps) {
  const { t } = useLanguage()
  const commentTextareaRef = useRef<SpeechTextareaRef>(null)
  const isEvaluationLocked = evaluationStatus === 'submitted' || evaluationStatus === 'completed'

  // Focus comment textarea after rating is set
  useEffect(() => {
    if (item.rating && !isEvaluationLocked) {
      const timer = setTimeout(() => {
        commentTextareaRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [item.rating, isEvaluationLocked])

  return (
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
                {item.level && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${
                    item.level === 'company' ? 'bg-purple-100 text-purple-700' :
                    item.level === 'department' ? 'bg-green-100 text-green-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {item.level === 'company' ? (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {t.common?.company || 'Company'}
                      </>
                    ) : item.level === 'department' ? (
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
                ) : item.evaluationDeadline && (
                  <DeadlineDisplay 
                    deadline={item.evaluationDeadline} 
                    showIcon={true}
                    showDate={false}
                    compact={true}
                  />
                )}
              </div>
            </div>
            <div className="ml-11 space-y-1">
              {item.createdBy && (
                <p className="text-xs text-gray-500">
                  {t.dashboard.createdBy} {item.createdBy}
                </p>
              )}
              {item.evaluationDeadline && item.deadlineSetBy && (
                <p className="text-xs text-gray-500">
                  {t.dashboard.deadlineSetBy} {item.deadlineSetBy}
                </p>
              )}
            </div>
          </div>
          {item.level !== 'company' && (
            <button
              onClick={() => {
                if (editingItemId === item.id) {
                  onCancelEditing()
                } else {
                  onStartEditing(item.id, item.title, item.description)
                }
              }}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex-shrink-0 ${
                editingItemId === item.id 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-sm">
                {editingItemId === item.id ? '✕' : '✏️'}
              </span>
              <span>
                {editingItemId === item.id ? (t.common?.cancel || 'Cancel') : (t.common?.edit || 'Edit')}
              </span>
            </button>
          )}
        </div>
        
        {editingItemId === item.id && editingItemData ? (
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t.okrs?.objective || 'Objective'}
              </label>
              <input
                type="text"
                value={editingItemData.title}
                onChange={(e) => {
                  onUpdateEditingData({ ...editingItemData, title: e.target.value })
                }}
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
                onChange={(e) => {
                  onUpdateEditingData({ ...editingItemData, description: e.target.value })
                }}
                className="w-full text-gray-900 bg-blue-50 border border-blue-200 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder={t.okrs?.keyResults || 'Description'}
              />
            </div>
            <div>
              <button
                onClick={onSaveItemEdit}
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
                {item.title}
              </h2>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {isOKR ? (t.okrs?.keyResults || 'Key Results') : (t.evaluations?.competency || 'Competency')}
              </label>
              <p className="text-gray-600">
                {item.description}
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
                rating={item.rating}
                onRatingChange={onRating}
                disabled={isEvaluationLocked}
                size="large"
              />
            </div>
            {item.rating && (
              <p className="text-center text-lg font-semibold text-gray-800 mt-3">
                {item.rating === 1 && (t.ratings?.needsImprovement || 'Needs Improvement')}
                {item.rating === 2 && (t.ratings?.belowExpectations || 'Below Expectations')}
                {item.rating === 3 && (t.ratings?.meetsExpectations || 'Meets Expectations')}
                {item.rating === 4 && (t.ratings?.exceedsExpectations || 'Exceeds Expectations')}
                {item.rating === 5 && (t.ratings?.outstanding || 'Outstanding')}
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
                (item?.comment.trim().length || 0) >= MIN_COMMENT_LENGTH 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {item?.comment.trim().length || 0}/{MIN_COMMENT_LENGTH}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              {(t.evaluations?.minimumCharacters?.replace('{count}', MIN_COMMENT_LENGTH.toString()) || `Minimum ${MIN_COMMENT_LENGTH} characters`)}. {t.evaluations?.commentGuidance || 'Provide detailed, specific feedback.'}
            </p>
            
            <SpeechTextarea
              ref={commentTextareaRef}
              value={item.comment}
              onChange={(value) => !isEvaluationLocked && onCommentChange(value)}
              placeholder={isEvaluationLocked ? "" : (t.evaluations?.commentPlaceholder || 'Provide detailed feedback on performance, achievements, and areas for improvement...')}
              disabled={isEvaluationLocked}
              rows={8}
              maxLength={1000}
              showCharCount={true}
              className={`px-4 py-3 border-2 rounded-xl shadow-sm transition-all duration-200 ${
                isEvaluationLocked 
                  ? 'bg-gray-50 border-gray-300 cursor-not-allowed'
                  : (item?.comment.trim().length || 0) >= MIN_COMMENT_LENGTH
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                  : 'border-red-300 focus:border-red-500 focus:ring-red-200'
              } focus:ring-4`}
            />
          </div>
        </div>
      </div>
    </>
  )
}