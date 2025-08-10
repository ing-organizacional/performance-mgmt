import { useLanguage } from '@/contexts/LanguageContext'
import { SpeechTextarea, StarRating } from '@/components/ui'
import type { EvaluationStatus } from '../types'
import { MIN_COMMENT_LENGTH } from '../types'
import { BarChart3 } from 'lucide-react'

interface OverallRatingProps {
  overallRating: number | null
  overallComment: string
  evaluationStatus: EvaluationStatus
  onRating: (rating: number) => void
  onCommentChange: (comment: string) => void
}

export function OverallRating({
  overallRating,
  overallComment,
  evaluationStatus,
  onRating,
  onCommentChange
}: OverallRatingProps) {
  const { t } = useLanguage()
  const isEvaluationLocked = evaluationStatus === 'submitted' || evaluationStatus === 'completed'

  return (
    <div className="px-4 pb-20">
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <BarChart3 className="h-5 w-5 mr-2 text-primary" />
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
            onRatingChange={onRating}
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
            onChange={(value) => !isEvaluationLocked && onCommentChange(value)}
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
  )
}