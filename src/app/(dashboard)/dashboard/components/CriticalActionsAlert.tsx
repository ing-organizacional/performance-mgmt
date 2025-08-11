'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { AlertTriangle } from 'lucide-react'

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
        <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
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