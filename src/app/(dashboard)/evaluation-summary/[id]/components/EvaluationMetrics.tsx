/**
 * Evaluation Metrics Component
 * 
 * Displays overall rating and performance breakdown with visual indicators
 * including star ratings and color-coded averages.
 */

import { useLanguage } from '@/contexts/LanguageContext'
import { Target, Star } from 'lucide-react'
import { getRatingColor, getRatingLabel } from '../utils'
import type { EvaluationMetricsProps } from '../types'

export function EvaluationMetrics({
  okrAverage,
  competencyAverage,
  totalAverage,
  overallRating
}: EvaluationMetricsProps) {
  const { t } = useLanguage()

  return (
    <>
      {/* Overall Rating - Prominent Display */}
      {overallRating && (
        <div className={`bg-gradient-to-r p-4 rounded-xl text-white mb-4 ${
          getRatingColor(overallRating) === 'green' ? 'from-green-500 to-green-600' :
          getRatingColor(overallRating) === 'blue' ? 'from-blue-500 to-blue-600' :
          getRatingColor(overallRating) === 'gray' ? 'from-gray-500 to-gray-600' :
          getRatingColor(overallRating) === 'orange' ? 'from-orange-500 to-orange-600' :
          'from-red-500 to-red-600'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">{t.evaluations.overallPerformance}</h3>
              <div className="text-2xl font-bold mb-1">
                {overallRating}/5
              </div>
              <div className="text-base font-medium opacity-90">
                {getRatingLabel(overallRating, t)}
              </div>
            </div>
            <div className="flex-shrink-0">
              {/* Star Rating Visual */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 ${
                      star <= (overallRating || 0) ? 'text-white' : 'text-white/30'
                    }`}
                    fill="currentColor"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Breakdown - OKR, Competency, and Total Averages */}
      {(okrAverage > 0 || competencyAverage > 0 || totalAverage > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {/* OKR Average */}
          {okrAverage > 0 && (
            <div className={`p-4 rounded-xl border-2 ${
              getRatingColor(okrAverage) === 'green' ? 'bg-green-50 border-green-200' :
              getRatingColor(okrAverage) === 'blue' ? 'bg-blue-50 border-blue-200' :
              getRatingColor(okrAverage) === 'gray' ? 'bg-gray-50 border-gray-200' :
              getRatingColor(okrAverage) === 'orange' ? 'bg-orange-50 border-orange-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Target className={`w-5 h-5 ${
                  getRatingColor(okrAverage) === 'green' ? 'text-green-600' :
                  getRatingColor(okrAverage) === 'blue' ? 'text-blue-600' :
                  getRatingColor(okrAverage) === 'gray' ? 'text-gray-600' :
                  getRatingColor(okrAverage) === 'orange' ? 'text-orange-600' :
                  'text-red-600'
                }`} />
                <h4 className="font-semibold text-sm text-gray-900">{t.dashboard.okrAverage}</h4>
              </div>
              <div className={`text-2xl font-bold ${
                getRatingColor(okrAverage) === 'green' ? 'text-green-700' :
                getRatingColor(okrAverage) === 'blue' ? 'text-blue-700' :
                getRatingColor(okrAverage) === 'gray' ? 'text-gray-700' :
                getRatingColor(okrAverage) === 'orange' ? 'text-orange-700' :
                'text-red-700'
              }`}>
                {okrAverage}/5
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {getRatingLabel(okrAverage, t)}
              </div>
            </div>
          )}

          {/* Competency Average */}
          {competencyAverage > 0 && (
            <div className={`p-4 rounded-xl border-2 ${
              getRatingColor(competencyAverage) === 'green' ? 'bg-green-50 border-green-200' :
              getRatingColor(competencyAverage) === 'blue' ? 'bg-blue-50 border-blue-200' :
              getRatingColor(competencyAverage) === 'gray' ? 'bg-gray-50 border-gray-200' :
              getRatingColor(competencyAverage) === 'orange' ? 'bg-orange-50 border-orange-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Star className={`w-5 h-5 ${
                  getRatingColor(competencyAverage) === 'green' ? 'text-green-600' :
                  getRatingColor(competencyAverage) === 'blue' ? 'text-blue-600' :
                  getRatingColor(competencyAverage) === 'gray' ? 'text-gray-600' :
                  getRatingColor(competencyAverage) === 'orange' ? 'text-orange-600' :
                  'text-red-600'
                }`} />
                <h4 className="font-semibold text-sm text-gray-900">{t.dashboard.competencyAverage}</h4>
              </div>
              <div className={`text-2xl font-bold ${
                getRatingColor(competencyAverage) === 'green' ? 'text-green-700' :
                getRatingColor(competencyAverage) === 'blue' ? 'text-blue-700' :
                getRatingColor(competencyAverage) === 'gray' ? 'text-gray-700' :
                getRatingColor(competencyAverage) === 'orange' ? 'text-orange-700' :
                'text-red-700'
              }`}>
                {competencyAverage}/5
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {getRatingLabel(competencyAverage, t)}
              </div>
            </div>
          )}

          {/* Total Average */}
          {totalAverage > 0 && (
            <div className={`p-4 rounded-xl border-2 ${
              getRatingColor(totalAverage) === 'green' ? 'bg-green-50 border-green-200' :
              getRatingColor(totalAverage) === 'blue' ? 'bg-blue-50 border-blue-200' :
              getRatingColor(totalAverage) === 'gray' ? 'bg-gray-50 border-gray-200' :
              getRatingColor(totalAverage) === 'orange' ? 'bg-orange-50 border-orange-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-5 h-5 rounded-full ${
                  getRatingColor(totalAverage) === 'green' ? 'bg-green-600' :
                  getRatingColor(totalAverage) === 'blue' ? 'bg-blue-600' :
                  getRatingColor(totalAverage) === 'gray' ? 'bg-gray-600' :
                  getRatingColor(totalAverage) === 'orange' ? 'bg-orange-600' :
                  'bg-red-600'
                }`} />
                <h4 className="font-semibold text-sm text-gray-900">{t.dashboard.totalAverage}</h4>
              </div>
              <div className={`text-2xl font-bold ${
                getRatingColor(totalAverage) === 'green' ? 'text-green-700' :
                getRatingColor(totalAverage) === 'blue' ? 'text-blue-700' :
                getRatingColor(totalAverage) === 'gray' ? 'text-gray-700' :
                getRatingColor(totalAverage) === 'orange' ? 'text-orange-700' :
                'text-red-700'
              }`}>
                {totalAverage}/5
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {getRatingLabel(totalAverage, t)}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}