'use client'

import { useLanguage } from '@/contexts/LanguageContext'

interface PerformanceCycle {
  id: string
  name: string
  status: string
  startDate: string
  endDate: string
  closedBy?: string | null
  closedAt?: string | null
  createdAt: string
  updatedAt: string
  _count: {
    evaluations: number
    evaluationItems: number
    partialAssessments: number
  }
  closedByUser?: {
    name: string
    email: string | null
  } | null
}

interface DeleteCycleModalProps {
  cycle: PerformanceCycle
  onClose: () => void
  onConfirm: (cycleId: string) => void
  isPending: boolean
}

export function DeleteCycleModal({ cycle, onClose, onConfirm, isPending }: DeleteCycleModalProps) {
  const { t } = useLanguage()

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl">
        <div className="px-8 py-6 border-b border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {t.dashboard.deleteCycle || 'Delete Cycle'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                This action cannot be undone
              </p>
            </div>
          </div>
        </div>
        
        <div className="px-8 py-6">
          <div className="mb-6">
            <p className="text-gray-600 text-base">
              {t.dashboard.confirmDelete || 'Are you sure you want to delete'} <span className="font-bold text-gray-900">&ldquo;{cycle.name}&rdquo;</span>?
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">This cycle contains:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold text-blue-800">
                  {cycle._count.evaluations} {t.dashboard.evaluationsText || 'evaluations'}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-100">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-sm font-semibold text-green-800">
                  {cycle._count.evaluationItems} {t.dashboard.itemsText || 'items'}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-semibold text-amber-800">
                  {cycle._count.partialAssessments} {t.dashboard.assessmentsText || 'assessments'}
                </span>
              </div>
            </div>
          </div>
          
          {(cycle._count.evaluations > 0 || 
            cycle._count.evaluationItems > 0 || 
            cycle._count.partialAssessments > 0) && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-sm font-bold text-red-800">
                  {t.dashboard.deleteWarning || 'All associated data will be permanently deleted.'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-6 border-t border-gray-200/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-6 py-3 min-h-[44px] text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            {t.common?.cancel || 'Cancel'}
          </button>
          <button
            onClick={() => onConfirm(cycle.id)}
            disabled={isPending}
            className="px-6 py-3 min-h-[44px] bg-red-600 text-white rounded-xl hover:bg-red-700 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation shadow-sm"
          >
            {isPending ? 'Deleting...' : (t.dashboard.deleteCycle || 'Delete Cycle')}
          </button>
        </div>
      </div>
    </div>
  )
}