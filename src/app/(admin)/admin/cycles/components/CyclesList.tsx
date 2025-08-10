'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { CheckCircle, XCircle, Archive, Circle } from 'lucide-react'

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

interface CyclesListProps {
  cycles: PerformanceCycle[]
  onStatusUpdate: (cycleId: string, status: string) => void
  onDeleteClick: (cycle: PerformanceCycle) => void
  isPending: boolean
}

export function CyclesList({ cycles, onStatusUpdate, onDeleteClick, isPending }: CyclesListProps) {
  const { t } = useLanguage()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'closed': return <XCircle className="h-6 w-6 text-red-500" />
      case 'archived': return <Archive className="h-6 w-6 text-gray-500" />
      default: return <Circle className="h-6 w-6 text-gray-400" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <main className="max-w-8xl mx-auto px-6 lg:px-8 pb-8">
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm">
        <div className="px-8 py-6 border-b border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {t.dashboard.cycles || 'Performance Cycles'} ({cycles.length})
              </h2>
              <p className="text-sm text-gray-600">
                {t.dashboard.manageCycles || 'Manage evaluation periods and their lifecycle status'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100">
          {cycles.map((cycle) => (
            <div key={cycle.id} className="px-8 py-6 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 flex-1 min-w-0">
                  {/* Enhanced Status Icon */}
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      cycle.status === 'active' ? 'bg-green-100' : 
                      cycle.status === 'closed' ? 'bg-red-100' : 
                      'bg-gray-100'
                    }`}>
                      {getStatusIcon(cycle.status)}
                    </div>
                  </div>
                  
                  {/* Enhanced Cycle Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-lg font-bold text-gray-900 truncate">{cycle.name}</h3>
                      <span className={`px-3 py-1 rounded-lg text-sm font-semibold shrink-0 border ${
                        cycle.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 
                        cycle.status === 'closed' ? 'bg-red-50 text-red-700 border-red-200' : 
                        cycle.status === 'archived' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {cycle.status === 'active' ? t.dashboard.activeCycle : 
                         cycle.status === 'closed' ? t.dashboard.closedCycle : 
                         cycle.status === 'archived' ? t.dashboard.archivedCycle :
                         cycle.status.charAt(0).toUpperCase() + cycle.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4M8 7l4 4m0 0l4-4m-4 4v11" />
                        </svg>
                        <span className="font-semibold">
                          {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
                        </span>
                      </div>
                    </div>
                    
                    {cycle.closedByUser && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>
                            {t.dashboard.cycleClosedBy || 'Closed by'}: <span className="font-semibold">{cycle.closedByUser.name}</span>
                          </span>
                        </div>
                        {cycle.closedAt && (
                          <span className="text-gray-400">• {formatDate(cycle.closedAt)}</span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg border border-blue-100">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold text-blue-800">
                          {cycle._count.evaluations} {t.dashboard.evaluationsText || 'evaluations'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-lg border border-green-100">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="font-semibold text-green-800">
                          {cycle._count.evaluationItems} {t.dashboard.itemsText || 'items'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-lg border border-amber-100">
                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="font-semibold text-amber-800">
                          {cycle._count.partialAssessments} {t.dashboard.assessmentsText || 'assessments'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Action Buttons */}
                <div className="flex items-center gap-2 ml-6 shrink-0">
                  {cycle.status === 'active' && (
                    <button
                      onClick={() => onStatusUpdate(cycle.id, 'closed')}
                      disabled={isPending}
                      className="flex items-center justify-center min-w-[44px] min-h-[44px] text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                      title={t.dashboard.closeCycle || 'Close Cycle'}
                      aria-label={t.dashboard.closeCycle || 'Close Cycle'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </button>
                  )}
                  {cycle.status === 'closed' && (
                    <button
                      onClick={() => onStatusUpdate(cycle.id, 'active')}
                      disabled={isPending}
                      className="flex items-center justify-center min-w-[44px] min-h-[44px] text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                      title={t.dashboard.reopenCycle || 'Reopen Cycle'}
                      aria-label={t.dashboard.reopenCycle || 'Reopen Cycle'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                  {(cycle.status === 'closed' || cycle.status === 'archived') && (
                    <button
                      onClick={() => onStatusUpdate(cycle.id, 'archived')}
                      disabled={isPending || cycle.status === 'archived'}
                      className="flex items-center justify-center min-w-[44px] min-h-[44px] text-gray-500 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                      title={t.dashboard.archiveCycle || 'Archive Cycle'}
                      aria-label={t.dashboard.archiveCycle || 'Archive Cycle'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l4 4 4-4" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteClick(cycle)}
                    disabled={isPending}
                    className="flex items-center justify-center min-w-[44px] min-h-[44px] text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    title={t.dashboard.deleteCycle || 'Delete Cycle'}
                    aria-label={t.dashboard.deleteCycle || 'Delete Cycle'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}