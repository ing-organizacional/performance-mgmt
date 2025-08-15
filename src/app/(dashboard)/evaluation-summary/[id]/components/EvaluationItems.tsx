/**
 * Evaluation Items Component
 * 
 * Displays OKRs and competencies sections with ratings, comments,
 * and level indicators in a structured format.
 */

import { useLanguage } from '@/contexts/LanguageContext'
import { Target, Star } from 'lucide-react'
import { getRatingColor } from '../utils'
import type { EvaluationItemsProps } from '../types'

export function EvaluationItems({ okrs, competencies }: EvaluationItemsProps) {
  const { t } = useLanguage()

  // Empty state
  if (okrs.length === 0 && competencies.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
        <div className="text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 712-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Evaluation Items</h3>
          <p className="text-sm text-gray-600">This evaluation doesn&apos;t contain any OKRs or competencies yet.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* OKRs Section */}
      {okrs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">OKRs ({okrs.length})</h3>
          </div>

          <div className="space-y-3">
            {okrs.map((item) => (
              <div key={item.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-600 mb-2 leading-relaxed">{item.description}</p>
                    {item.level && (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        item.level === 'company' ? 'bg-primary/10 text-primary' :
                        item.level === 'department' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {item.level === 'company' ? t.dashboard.companyLevel : 
                         item.level === 'department' ? t.dashboard.departmentLevel : t.dashboard.managerLevel}
                      </span>
                    )}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold flex-shrink-0 ${
                    getRatingColor(item.rating) === 'green' ? 'bg-green-100 text-green-700' :
                    getRatingColor(item.rating) === 'blue' ? 'bg-blue-100 text-blue-700' :
                    getRatingColor(item.rating) === 'gray' ? 'bg-gray-100 text-gray-700' :
                    getRatingColor(item.rating) === 'orange' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {item.rating || 0}/5
                  </div>
                </div>
                {item.comment && (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                    <strong>{t.dashboard.feedback}:</strong> <span className="ml-1">{item.comment}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competencies Section */}
      {competencies.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-4 h-4 text-yellow-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{t.evaluations.competency} ({competencies.length})</h3>
          </div>

          <div className="space-y-3">
            {competencies.map((item) => (
              <div key={item.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-600 mb-2 leading-relaxed">{item.description}</p>
                    {item.level && (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        item.level === 'company' ? 'bg-primary/10 text-primary' :
                        item.level === 'department' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {item.level === 'company' ? t.dashboard.companyLevel : 
                         item.level === 'department' ? t.dashboard.departmentLevel : t.dashboard.managerLevel}
                      </span>
                    )}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold flex-shrink-0 ${
                    getRatingColor(item.rating) === 'green' ? 'bg-green-100 text-green-700' :
                    getRatingColor(item.rating) === 'blue' ? 'bg-blue-100 text-blue-700' :
                    getRatingColor(item.rating) === 'gray' ? 'bg-gray-100 text-gray-700' :
                    getRatingColor(item.rating) === 'orange' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {item.rating || 0}/5
                  </div>
                </div>
                {item.comment && (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                    <strong>{t.dashboard.feedback}:</strong> <span className="ml-1">{item.comment}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}