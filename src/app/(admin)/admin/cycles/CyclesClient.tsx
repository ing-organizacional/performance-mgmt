'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState, useTransition } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { ToastContainer } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { createCycle, updateCycleStatus, deleteCycle } from '@/lib/actions/cycles'

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

interface CyclesClientProps {
  cycles: PerformanceCycle[]
}

export default function CyclesClient({ cycles: initialCycles }: CyclesClientProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const { toasts, success, error, removeToast } = useToast()
  const [isPending, startTransition] = useTransition()
  
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ cycle: PerformanceCycle } | null>(null)

  const handleCreateSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await createCycle(formData)

      if (result.success) {
        success(result.message)
        setShowCreateForm(false)
        router.refresh() // Refresh server data
      } else {
        error(result.message)
      }
    })
  }

  const handleStatusUpdate = async (cycleId: string, status: string) => {
    const confirmMessage = status === 'closed' 
      ? t.dashboard.confirmClose
      : status === 'active'
      ? t.dashboard.confirmReopen
      : 'Are you sure you want to update this cycle status?'

    if (!confirm(confirmMessage)) return

    startTransition(async () => {
      const formData = new FormData()
      formData.append('status', status)
      
      const result = await updateCycleStatus(cycleId, formData)
      
      if (result.success) {
        success(result.message)
        router.refresh() // Refresh server data
      } else {
        error(result.message)
      }
    })
  }

  const handleDeleteCycle = async (cycleId: string) => {
    if (!showDeleteConfirm) return

    startTransition(async () => {
      const result = await deleteCycle(cycleId)
      
      if (result.success) {
        success(result.message)
        setShowDeleteConfirm(null)
        router.refresh() // Refresh server data
      } else {
        error(result.message)
      }
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-red-100 text-red-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢'
      case 'closed': return '🔴'
      case 'archived': return '⚫'
      default: return '⚪'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 py-3">
          {/* Title Section */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-gray-900 truncate">{t.dashboard.performanceCycles}</h1>
                <p className="text-xs text-gray-500">{t.dashboard.cycleManagement}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center justify-center w-9 h-9 bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-95 transition-all duration-150 touch-manipulation ml-3"
              title={t.auth.signOut}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <button
                onClick={() => setShowCreateForm(true)}
                disabled={isPending}
                className="flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 active:scale-95 transition-all duration-150 touch-manipulation whitespace-nowrap disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>{t.dashboard.newCycle}</span>
              </button>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Cycles List */}
      <div className="px-4 py-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {t.dashboard.cycles} ({initialCycles.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {initialCycles.map((cycle) => (
              <div key={cycle.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      <div className="text-2xl">
                        {getStatusIcon(cycle.status)}
                      </div>
                    </div>
                    
                    {/* Cycle Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{cycle.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${getStatusColor(cycle.status)}`}>
                          {cycle.status === 'active' ? t.dashboard.activeCycle : 
                           cycle.status === 'closed' ? t.dashboard.closedCycle : 
                           cycle.status === 'archived' ? t.dashboard.archivedCycle :
                           cycle.status.charAt(0).toUpperCase() + cycle.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <span className="truncate">
                          {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
                        </span>
                      </div>
                      
                      {cycle.closedByUser && (
                        <p className="text-xs text-gray-500 mb-1 truncate">
                          {t.dashboard.cycleClosedBy}: {cycle.closedByUser.name} {t.dashboard.cycleClosedAt} {cycle.closedAt ? formatDate(cycle.closedAt) : 'Unknown'}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {cycle._count.evaluations} {t.dashboard.evaluationsText}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {cycle._count.evaluationItems} {t.dashboard.itemsText}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {cycle._count.partialAssessments} {t.dashboard.assessmentsText}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 ml-4 shrink-0">
                    {cycle.status === 'active' && (
                      <button
                        onClick={() => handleStatusUpdate(cycle.id, 'closed')}
                        disabled={isPending}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                        title={t.dashboard.closeCycle}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </button>
                    )}
                    {cycle.status === 'closed' && (
                      <button
                        onClick={() => handleStatusUpdate(cycle.id, 'active')}
                        disabled={isPending}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all disabled:opacity-50"
                        title={t.dashboard.reopenCycle}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                    {(cycle.status === 'closed' || cycle.status === 'archived') && (
                      <button
                        onClick={() => handleStatusUpdate(cycle.id, 'archived')}
                        disabled={isPending || cycle.status === 'archived'}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all disabled:opacity-50"
                        title={t.dashboard.archiveCycle}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l4 4 4-4" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => setShowDeleteConfirm({ cycle })}
                      disabled={isPending}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                      title={t.dashboard.deleteCycle}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">{t.dashboard.createCycle}</h3>
            </div>
            
            <form action={handleCreateSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.dashboard.cycleName} *</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g., 2025 Annual Review"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.dashboard.startDate} *</label>
                <input
                  name="startDate"
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.dashboard.endDate} *</label>
                <input
                  name="endDate"
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  disabled={isPending}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isPending ? t.dashboard.creating : t.dashboard.createCycle}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">{t.dashboard.deleteCycle}</h3>
            </div>
            
            <div className="px-6 py-4">
              <p className="text-gray-600">
                {t.dashboard.confirmDelete} <strong>{showDeleteConfirm.cycle.name}</strong>? 
              </p>
              <div className="mt-2 text-sm text-gray-500">
                This cycle contains:
                <ul className="list-disc list-inside mt-1">
                  <li>{showDeleteConfirm.cycle._count.evaluations} {t.dashboard.evaluationsText}</li>
                  <li>{showDeleteConfirm.cycle._count.evaluationItems} {t.dashboard.itemsText}</li>
                  <li>{showDeleteConfirm.cycle._count.partialAssessments} {t.dashboard.assessmentsText}</li>
                </ul>
                {(showDeleteConfirm.cycle._count.evaluations > 0 || 
                  showDeleteConfirm.cycle._count.evaluationItems > 0 || 
                  showDeleteConfirm.cycle._count.partialAssessments > 0) && (
                  <p className="text-red-600 font-medium mt-2">
                    {t.dashboard.deleteWarning}
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={isPending}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={() => handleDeleteCycle(showDeleteConfirm.cycle.id)}
                disabled={isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Deleting...' : t.dashboard.deleteCycle}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}