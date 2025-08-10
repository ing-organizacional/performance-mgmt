'use client'

import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'

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
          <svg className="w-5 h-5 text-amber-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
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
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
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