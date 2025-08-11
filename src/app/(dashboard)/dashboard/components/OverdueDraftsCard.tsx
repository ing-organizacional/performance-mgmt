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
    <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900 flex items-center">
          <FileText className="w-5 h-5 text-red-500 mr-2" />
          {t.dashboard.overdueDrafts || 'Overdue Draft Evaluations'}
        </h2>
        <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
          {overdueDrafts.length}
        </span>
      </div>
      
      <div className="space-y-3">
        {overdueDrafts.slice(0, 3).map((draft) => (
          <div key={draft.id} className="flex items-center justify-between p-4 border border-red-200 bg-red-50/50 rounded-xl hover:bg-red-50 transition-colors">
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{draft.employeeName}</p>
              <p className="text-sm text-gray-600">
                {t.dashboard.managerLabel}: {draft.managerName} • {draft.daysOverdue} {t.dashboard.daysOverdueText}
              </p>
            </div>
            <button
              onClick={() => router.push(`/evaluate/${draft.id}`)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 hover:scale-105 transition-all duration-200"
            >
              Review
            </button>
          </div>
        ))}
      </div>
      
      {overdueDrafts.length > 3 && (
        <button
          onClick={() => router.push('/dashboard/overdue')}
          className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-semibold pt-4 border-t border-gray-200 mt-4"
        >
          {t.dashboard.viewAllOverdue.replace('{count}', overdueDrafts.length.toString())}
        </button>
      )}
    </div>
  )
}