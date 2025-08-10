'use client'

import { useLanguage } from '@/contexts/LanguageContext'

interface CompletionStats {
  total: number
  completed: number
  inProgress: number
  pending: number
  overdue: number
  duesSoon: number
}

interface CriticalActionsAlertProps {
  completionStats: CompletionStats
}

export function CriticalActionsAlert({ completionStats }: CriticalActionsAlertProps) {
  const { t } = useLanguage()

  // Only show if there are critical actions needed
  if (completionStats.overdue <= 0 && completionStats.duesSoon <= 0) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
        <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        {t.dashboard.attentionRequired}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {completionStats.overdue > 0 && (
          <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-4"></div>
              <div>
                <h3 className="font-semibold text-red-800">
                  {completionStats.overdue} {t.dashboard.overdueEvaluationsCount}
                </h3>
                <p className="text-sm text-red-600">{t.dashboard.pastDueDate}</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
              {t.dashboard.sendReminders}
            </button>
          </div>
        )}

        {completionStats.duesSoon > 0 && (
          <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full mr-4"></div>
              <div>
                <h3 className="font-semibold text-amber-800">
                  {completionStats.duesSoon} {t.dashboard.dueSoonCount}
                </h3>
                <p className="text-sm text-amber-600">{t.dashboard.dueWithinDays}</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors">
              {t.dashboard.viewList}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}