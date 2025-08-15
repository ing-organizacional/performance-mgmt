/**
 * Evaluation Header Component
 * 
 * Header section displaying employee information, status, and action buttons
 * for evaluation management (approve, unlock, export).
 */

import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { useRouter } from 'next/navigation'
import { getStatusColor, getStatusLabel } from '../utils'
import type { EvaluationHeaderProps } from '../types'

export function EvaluationHeader({
  evaluation,
  userRole,
  currentUserId,
  onApprove,
  onUnlock,
  onExport,
  isApproving,
  isUnlocking,
  isExporting,
  unlockError
}: EvaluationHeaderProps) {
  const { t } = useLanguage()
  const router = useRouter()

  return (
    <>
      {/* Mobile-First Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg active:scale-95 transition-all duration-150 touch-manipulation"
                aria-label={t.common.back}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-gray-900 truncate">Mi evaluación</h1>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Unlock Error Display */}
      {unlockError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-base font-bold text-red-800 mb-2">Unlock Error</h3>
              <p className="text-sm text-red-600 leading-relaxed">{unlockError}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Employee & Overall Performance Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col space-y-3 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold text-lg">
                  {evaluation.employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-gray-900 truncate">{evaluation.employee.name}</h2>
                <div className="text-sm text-gray-600">
                  {evaluation.employee.department && `${evaluation.employee.department} • `}
                  {evaluation.employee.role}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {t.evaluations.evaluation} by {evaluation.manager.name} • 
              {new Date(evaluation.createdAt).toLocaleDateString()}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* HR Unlock Button - Only for submitted evaluations */}
            {userRole === 'hr' && evaluation.status === 'submitted' && (
              <button
                onClick={onUnlock}
                disabled={isUnlocking}
                className={`flex items-center gap-2 px-4 py-3 min-h-[44px] text-orange-700 text-sm font-medium rounded-lg active:scale-95 transition-all duration-150 touch-manipulation whitespace-nowrap ${
                  isUnlocking 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-orange-100 hover:bg-orange-200'
                }`}
                title="Unlock this evaluation for editing"
              >
                {isUnlocking ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                )}
                <span>{isUnlocking ? t.evaluations.unlocking : t.evaluations.unlock}</span>
              </button>
            )}

            {/* Employee Approve Button - Only for employees on submitted evaluations */}
            {evaluation.employee.id === currentUserId && evaluation.status === 'submitted' && (
              <button
                onClick={onApprove}
                disabled={isApproving}
                className={`flex items-center gap-2 px-4 py-3 min-h-[44px] text-green-700 text-sm font-medium rounded-lg active:scale-95 transition-all duration-150 touch-manipulation whitespace-nowrap ${
                  isApproving 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-green-100 hover:bg-green-200'
                }`}
                title="Approve this evaluation"
              >
                {isApproving ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span>{isApproving ? t.common.approving : t.common.approve}</span>
              </button>
            )}

            {/* Context-Aware Export Button */}
            <button
              onClick={onExport}
              disabled={isExporting}
              className={`flex items-center gap-2 px-4 py-3 min-h-[44px] text-blue-700 text-sm font-medium rounded-lg active:scale-95 transition-all duration-150 touch-manipulation whitespace-nowrap ${
                isExporting 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-blue-100 hover:bg-blue-200'
              }`}
              title={t.dashboard.exportPDF}
            >
              {isExporting ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              <span>{isExporting ? t.dashboard.exporting : t.dashboard.exportPDF}</span>
            </button>

            {/* Status Badge */}
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
              getStatusColor(evaluation.status) === 'green' ? 'bg-green-100 text-green-800' :
              getStatusColor(evaluation.status) === 'purple' ? 'bg-primary/10 text-primary' :
              getStatusColor(evaluation.status) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {getStatusLabel(evaluation.status, t)}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}