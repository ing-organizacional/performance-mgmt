'use client'

import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { Clock, AlertTriangle } from 'lucide-react'

interface PendingApproval {
  id: string
  employeeId: string
  employeeName: string
  employeeDepartment: string | null
  managerName: string
  submittedAt: string
  daysPending: number
}

interface PendingApprovalsCardProps {
  pendingApprovals: PendingApproval[]
  overdueApprovalsCount: number
}

export function PendingApprovalsCard({ 
  pendingApprovals, 
  overdueApprovalsCount 
}: PendingApprovalsCardProps) {
  const router = useRouter()
  const { t } = useLanguage()

  // Don't render if no pending approvals
  if (pendingApprovals.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 p-4 lg:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 lg:mb-6 space-y-3 sm:space-y-0">
        <h2 className="text-base lg:text-lg font-bold text-gray-900 flex items-center">
          <Clock className="w-4 lg:w-5 h-4 lg:h-5 text-amber-500 mr-2" />
          <span className="truncate">{t.dashboard.pendingApprovals || 'Pending Employee Approvals'}</span>
        </h2>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className="px-2 lg:px-3 py-1 bg-amber-100 text-amber-700 text-xs lg:text-sm font-semibold rounded-full">
            {pendingApprovals.length}
          </span>
          {overdueApprovalsCount > 0 && (
            <span className="px-2 lg:px-3 py-1 bg-red-100 text-red-700 text-xs lg:text-sm font-semibold rounded-full">
              {overdueApprovalsCount} {t.dashboard.overdueText}
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-2 lg:space-y-3">
        {pendingApprovals.slice(0, 3).map((approval) => (
          <div key={approval.id} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 lg:p-4 border rounded-xl hover:shadow-sm transition-all duration-200 space-y-3 sm:space-y-0 ${
            approval.daysPending > 3 ? 'border-red-200 bg-red-50/50' : 'border-amber-200 bg-amber-50/50'
          }`}>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{approval.employeeName}</p>
              <p className="text-xs lg:text-sm text-gray-600">
                <span className="block sm:inline">Submitted by: {approval.managerName}</span>
                <span className="block sm:inline sm:ml-2">• {approval.daysPending} days ago</span>
              </p>
            </div>
            <div className="flex items-center justify-between sm:justify-end space-x-2 flex-shrink-0">
              {approval.daysPending > 3 && (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              )}
              <button
                onClick={() => router.push(`/evaluation-summary/${approval.id}`)}
                className="flex-1 sm:flex-none px-4 py-3 sm:py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 hover:scale-105 transition-all duration-200 min-h-[44px] sm:min-h-0 text-center"
              >
                Review
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {pendingApprovals.length > 3 && (
        <button
          onClick={() => router.push('/dashboard/pending-approvals')}
          className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-semibold pt-3 lg:pt-4 border-t border-gray-200 mt-3 lg:mt-4 min-h-[44px] flex items-center justify-center"
        >
          View all {pendingApprovals.length} pending approvals →
        </button>
      )}
    </div>
  )
}