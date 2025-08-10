import { useRef, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { SpeechTextarea, StarRating } from '@/components/ui'
import type { SpeechTextareaRef } from '@/components/ui/SpeechTextarea'
import { DeadlineDisplay } from '@/components/features/evaluation'
import type { EvaluationItem, ItemEditData, EvaluationStatus } from '../types'
import { MIN_COMMENT_LENGTH } from '../types'
import { Target, Star, Building2, MapPin, User } from 'lucide-react'

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
      {/* Mobile-First OKR/Competency Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mx-4 mb-3 flex-shrink-0">
        {/* Simplified Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            {/* Type and Level Row */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
{isOKR ? (
                  <Target className="w-5 h-5 text-primary" />
                ) : (
                  <Star className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-gray-900">
                    {isOKR ? (t.evaluations?.okr || 'OKR') : (t.evaluations?.competency || 'Competency')}
                  </span>
                  {/* Level Indicator - moved to right of title */}
                  {item.level && (
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium ${
                      item.level === 'company' ? 'bg-gray-100 text-gray-700' :
                      item.level === 'department' ? 'bg-gray-100 text-gray-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.level === 'company' ? (
                        <Building2 className="w-4 h-4" />
                      ) : item.level === 'department' ? (
                        <MapPin className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                      {item.level === 'company' ? (t.common?.company || 'Company') :
                       item.level === 'department' ? (t.common?.department || 'Department') :
                       (t.common?.manager || 'Manager')}
                    </div>
                  )}
                  {evaluationStatus === 'completed' && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-semibold">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {t.status?.completed || 'Done'}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Creator Info - Compact */}
            {(item.createdBy || (item.evaluationDeadline && item.deadlineSetBy)) && (
              <div className="text-xs text-gray-500 space-y-0.5">
                {item.createdBy && (
                  <p>{t.dashboard.createdBy} {item.createdBy}</p>
                )}
                {item.evaluationDeadline && item.deadlineSetBy && (
                  <div className="flex items-center gap-1.5">
                    <DeadlineDisplay 
                      deadline={item.evaluationDeadline} 
                      showIcon={true}
                      showDate={false}
                      compact={true}
                    />
                    <span>{t.dashboard.deadlineSetBy} {item.deadlineSetBy}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Mobile-Optimized Edit Button */}
          {item.level !== 'company' && (
            <button
              onClick={() => {
                if (editingItemId === item.id) {
                  onCancelEditing()
                } else {
                  onStartEditing(item.id, item.title, item.description)
                }
              }}
              className={`flex items-center justify-center min-w-[44px] min-h-[44px] p-2 rounded-xl font-medium transition-all duration-200 flex-shrink-0 touch-manipulation ${
                editingItemId === item.id 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 active:scale-95' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
              }`}
              aria-label={editingItemId === item.id ? (t.common?.cancel || 'Cancel') : (t.common?.edit || 'Edit')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {editingItemId === item.id ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                )}
              </svg>
            </button>
          )}
        </div>
        
        {editingItemId === item.id && editingItemData ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                {t.okrs?.objective || 'Objective'}
              </label>
              <input
                type="text"
                value={editingItemData.title}
                onChange={(e) => {
                  onUpdateEditingData({ ...editingItemData, title: e.target.value })
                }}
                className="w-full text-base font-semibold text-gray-900 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                placeholder={t.okrs?.objective || 'Title'}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                {t.okrs?.keyResults || 'Key Results'}
              </label>
              <textarea
                value={editingItemData.description}
                onChange={(e) => {
                  onUpdateEditingData({ ...editingItemData, description: e.target.value })
                }}
                className="w-full text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                rows={2}
                placeholder={t.okrs?.keyResults || 'Description'}
              />
            </div>
            <div>
              <button
                onClick={onSaveItemEdit}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-green-500 text-white font-semibold text-sm rounded-lg hover:bg-green-600 active:scale-95 transition-all duration-200 shadow-sm touch-manipulation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t.common?.save || 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {isOKR ? (t.okrs?.objective || 'Objective') : (t.evaluations?.competency || 'Competency')}
              </label>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                {item.title}
              </h2>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {isOKR ? (t.okrs?.keyResults || 'Key Results') : 'Description'}
              </label>
              <p className="text-sm text-gray-700 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Rating and Comments Section */}
      <div className="flex-1 overflow-y-auto px-4 pb-20">
        <div className="space-y-3">
          {/* Mobile-Optimized Rating Section - UX/UI Compliant */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm" data-rating-section>
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t.evaluations?.ratePerformance || 'Rate Performance'}</h3>
              <p className="text-base text-gray-600">
                {isEvaluationLocked ? 
                  (evaluationStatus === 'submitted' ? (t.evaluations?.awaitingEmployeeApproval || 'Awaiting Approval') : (t.evaluations?.evaluationCompleted || 'Completed')) :
                  (t.evaluations?.tapToRate || 'Tap to rate')
                }
              </p>
            </div>
            
            <div className="mb-2">
              <StarRating
                rating={item.rating}
                onRatingChange={onRating}
                disabled={isEvaluationLocked}
                size="large"
              />
            </div>
            {item.rating && (
              <div className="text-center mt-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-base ${
                  item.rating === 1 ? 'bg-red-100 text-red-700' :
                  item.rating === 2 ? 'bg-amber-100 text-amber-700' :
                  item.rating === 3 ? 'bg-gray-100 text-gray-700' :
                  item.rating === 4 ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className={`w-4 h-4 ${star <= (item.rating || 0) ? 'text-yellow-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-1.5">
                    {item.rating === 1 && (t.ratings?.needsImprovement || 'Needs Improvement')}
                    {item.rating === 2 && (t.ratings?.belowExpectations || 'Below Expectations')}
                    {item.rating === 3 && (t.ratings?.meetsExpectations || 'Meets Expectations')}
                    {item.rating === 4 && (t.ratings?.exceedsExpectations || 'Exceeds Expectations')}
                    {item.rating === 5 && (t.ratings?.outstanding || 'Outstanding')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Mobile-Optimized Comments Section - UX/UI Compliant */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-900">
                  {t.evaluations?.comments || 'Comments'} <span className="text-red-500">*</span>
                </h3>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-xs border ${
                  (item?.comment.trim().length || 0) >= MIN_COMMENT_LENGTH 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    (item?.comment.trim().length || 0) >= MIN_COMMENT_LENGTH ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  {item?.comment.trim().length || 0}/{MIN_COMMENT_LENGTH}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-0.5">
                {(t.evaluations?.minimumCharacters?.replace('{count}', MIN_COMMENT_LENGTH.toString()) || `Minimum ${MIN_COMMENT_LENGTH} characters`)}
              </p>
              <p className="text-xs text-gray-500">
                {t.evaluations?.commentGuidance || 'Provide detailed, specific feedback on performance, achievements, and areas for improvement.'}
              </p>
            </div>
            
            <div className="relative">
              <SpeechTextarea
                ref={commentTextareaRef}
                value={item.comment}
                onChange={(value) => !isEvaluationLocked && onCommentChange(value)}
                placeholder={isEvaluationLocked ? "" : (t.evaluations?.commentPlaceholder || 'Share specific examples of performance, achievements, and areas for development...')}
                disabled={isEvaluationLocked}
                rows={6}
                maxLength={1000}
                showCharCount={true}
                className={`w-full px-3 py-3 text-base leading-relaxed border-2 rounded-lg shadow-sm transition-all duration-200 resize-none focus:outline-none ${
                  isEvaluationLocked 
                    ? 'bg-gray-50 border-gray-300 cursor-not-allowed text-gray-500'
                    : (item?.comment.trim().length || 0) >= MIN_COMMENT_LENGTH
                    ? 'bg-white border-green-300 focus:border-green-500 focus:ring-4 focus:ring-green-200/50 text-gray-900'
                    : 'bg-white border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-200/50 text-gray-900'
                } placeholder:text-gray-400`}
              />
              {!isEvaluationLocked && (
                <div className="absolute bottom-2 right-2 pointer-events-none">
                  <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    (item?.comment.trim().length || 0) >= MIN_COMMENT_LENGTH
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {(item?.comment.trim().length || 0) >= MIN_COMMENT_LENGTH ? '✓' : '!'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}