'use client'

import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { FileText } from 'lucide-react'

interface OverdueDraft {
  id: string
  employeeName: string
  employeeDepartment: string | null
  managerName: string
  createdAt: string
  daysOverdue: number
}

interface OverdueDraftsCardProps {
  overdueDrafts: OverdueDraft[]
}

export function OverdueDraftsCard({ overdueDrafts }: OverdueDraftsCardProps) {
  const router = useRouter()
  const { t } = useLanguage()

  // Don't render if no overdue drafts
  if (overdueDrafts.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 p-4 lg:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <h2 className="text-base lg:text-lg font-bold text-gray-900 flex items-center">
          <FileText className="w-4 lg:w-5 h-4 lg:h-5 text-red-500 mr-2" />
          <span className="truncate">{t.dashboard.overdueDrafts || 'Overdue Draft Evaluations'}</span>
        </h2>
        <span className="px-2 lg:px-3 py-1 bg-red-100 text-red-700 text-xs lg:text-sm font-semibold rounded-full flex-shrink-0">
          {overdueDrafts.length}
        </span>
      </div>
      
      <div className="space-y-2 lg:space-y-3">
        {overdueDrafts.slice(0, 3).map((draft) => (
          <div key={draft.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 lg:p-4 border border-red-200 bg-red-50/50 rounded-xl hover:bg-red-50 transition-colors space-y-3 sm:space-y-0">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{draft.employeeName}</p>
              <p className="text-xs lg:text-sm text-gray-600">
                <span className="block sm:inline">{t.dashboard.managerLabel}: {draft.managerName}</span>
                <span className="block sm:inline sm:ml-2">• {draft.daysOverdue} {t.dashboard.daysOverdueText}</span>
              </p>
            </div>
            <button
              onClick={() => router.push(`/evaluate/${draft.id}`)}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 hover:scale-105 transition-all duration-200 min-h-[44px] sm:min-h-0 flex-shrink-0"
            >
              Review
            </button>
          </div>
        ))}
      </div>
      
      {overdueDrafts.length > 3 && (
        <button
          onClick={() => router.push('/dashboard/overdue')}
          className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-semibold pt-3 lg:pt-4 border-t border-gray-200 mt-3 lg:mt-4 min-h-[44px] flex items-center justify-center"
        >
          {t.dashboard.viewAllOverdue.replace('{count}', overdueDrafts.length.toString())}
        </button>
      )}
    </div>
  )
}