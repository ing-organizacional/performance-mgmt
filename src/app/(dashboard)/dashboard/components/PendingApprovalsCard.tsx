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
    <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900 flex items-center">
          <Clock className="w-5 h-5 text-amber-500 mr-2" />
          {t.dashboard.pendingApprovals || 'Pending Employee Approvals'}
        </h2>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-semibold rounded-full">
            {pendingApprovals.length}
          </span>
          {overdueApprovalsCount > 0 && (
            <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
              {overdueApprovalsCount} {t.dashboard.overdueText}
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        {pendingApprovals.slice(0, 3).map((approval) => (
          <div key={approval.id} className={`flex items-center justify-between p-4 border rounded-xl hover:shadow-sm transition-all duration-200 ${
            approval.daysPending > 3 ? 'border-red-200 bg-red-50/50' : 'border-amber-200 bg-amber-50/50'
          }`}>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{approval.employeeName}</p>
              <p className="text-sm text-gray-600">
                Submitted by: {approval.managerName} • {approval.daysPending} days ago
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {approval.daysPending > 3 && (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              )}
              <button
                onClick={() => router.push(`/evaluation-summary/${approval.id}`)}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 hover:scale-105 transition-all duration-200"
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
          className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-semibold pt-4 border-t border-gray-200 mt-4"
        >
          View all {pendingApprovals.length} pending approvals →
        </button>
      )}
    </div>
  )
}