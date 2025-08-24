'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { AlertTriangle, Star, X } from 'lucide-react'

interface EvaluatedEmployee {
  id: string
  name: string
  rating: number | null
  comment: string
}

interface HROverrideModalProps {
  isOpen: boolean
  itemTitle: string
  evaluatedEmployees: EvaluatedEmployee[]
  onConfirm: (reason: string) => void
  onCancel: () => void
  isPending?: boolean
}

export function HROverrideModal({
  isOpen,
  itemTitle,
  evaluatedEmployees,
  onConfirm,
  onCancel,
  isPending = false
}: HROverrideModalProps) {
  const { t } = useLanguage()
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason.trim())
      setReason('')
    }
  }

  const handleCancel = () => {
    onCancel()
    setReason('')
  }

  const formatRating = (rating: number | null): string => {
    if (rating === null) return '—'
    return `${rating}/5 ⭐`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t.assignments.hrOverrideRequired}</h2>
                <p className="text-orange-100 text-sm">{t.assignments.confirmHROverride}</p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t.assignments.removeEvaluatedItem}
            </h3>
            <p className="text-gray-600 mb-4">
              Remove &ldquo;{itemTitle}&rdquo; from {evaluatedEmployees.length} employee{evaluatedEmployees.length !== 1 ? 's' : ''}?
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-red-800 font-medium mb-2">{t.assignments.willPermanentlyDelete}</h4>
                  <div className="space-y-3">
                    {evaluatedEmployees.map((employee) => (
                      <div key={employee.id} className="bg-white rounded-lg p-3 border border-red-100">
                        <div className="font-medium text-gray-900 mb-1">{employee.name}</div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-amber-500" />
                            <span>Rating: {formatRating(employee.rating)}</span>
                          </div>
                          {employee.comment && (
                            <div className="text-gray-700 bg-gray-50 p-2 rounded text-xs">
                              &ldquo;{employee.comment.length > 100 
                                ? `${employee.comment.substring(0, 100)}...` 
                                : employee.comment}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Reason Input */}
            <div>
              <label htmlFor="override-reason" className="block text-sm font-medium text-gray-700 mb-2">
                {t.assignments.reasonForRemoval}
              </label>
              <textarea
                id="override-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t.assignments.reasonRequired}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                rows={3}
                disabled={isPending}
                required
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t">
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending || !reason.trim()}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                {t.common.saving}
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                {t.assignments.confirmOverride}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}