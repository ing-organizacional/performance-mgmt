'use client'

import { useEffect, useState, useTransition } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { updateCycleStatus } from '@/app/dashboard/actions'

interface PerformanceCycle {
  id: string
  name: string
  status: string
  startDate: string
  endDate: string
  closedBy?: string
  closedAt?: string
  _count: {
    evaluations: number
    evaluationItems: number
    partialAssessments: number
  }
}

interface CycleSelectorProps {
  onCycleSelect?: (cycle: PerformanceCycle | null) => void
  showCreateButton?: boolean
  initialCycles?: PerformanceCycle[]
  selectedCycleId?: string | null
}

export default function CycleSelector({ 
  onCycleSelect, 
  showCreateButton = false,
  initialCycles = [],
  selectedCycleId = null
}: CycleSelectorProps) {
  const { t } = useLanguage()
  const [cycles, setCycles] = useState<PerformanceCycle[]>(initialCycles)
  const [selectedCycle, setSelectedCycle] = useState<PerformanceCycle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showActions, setShowActions] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    startDate: '',
    endDate: ''
  })

  // Initialize from server data
  useEffect(() => {
    setCycles(initialCycles)
    
    // Auto-select the cycle based on selectedCycleId or find active cycle
    if (selectedCycleId) {
      const cycle = initialCycles.find(c => c.id === selectedCycleId)
      if (cycle) {
        setSelectedCycle(cycle)
        onCycleSelect?.(cycle)
      }
    } else {
      const activeCycle = initialCycles.find(cycle => cycle.status === 'active')
      if (activeCycle) {
        setSelectedCycle(activeCycle)
        onCycleSelect?.(activeCycle)
      }
    }
  }, [initialCycles, selectedCycleId, onCycleSelect])

  const handleCycleChange = (cycleId: string) => {
    const cycle = cycles.find(c => c.id === cycleId) || null
    setSelectedCycle(cycle)
    onCycleSelect?.(cycle)
  }


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢'
      case 'closed': return '🔴'
      case 'archived': return '⚫'
      default: return '⚪'
    }
  }

  const handleCloseCycle = async () => {
    if (!selectedCycle || isPending) return

    const confirmMessage = `Are you sure you want to close "${selectedCycle.name}"? This will make all evaluations and items read-only for managers.`
    if (!confirm(confirmMessage)) return

    startTransition(async () => {
      const result = await updateCycleStatus(selectedCycle.id, 'closed')
      
      if (!result.success) {
        setError(result.error || 'Failed to close cycle')
      } else {
        // Update local state
        const updatedCycles = cycles.map(cycle => 
          cycle.id === selectedCycle.id 
            ? { ...cycle, status: 'closed' }
            : cycle
        )
        setCycles(updatedCycles)
        
        const updatedSelectedCycle = { ...selectedCycle, status: 'closed' }
        setSelectedCycle(updatedSelectedCycle)
        onCycleSelect?.(updatedSelectedCycle)
        
        setShowActions(false)
      }
    })
  }

  const handleReopenCycle = async () => {
    if (!selectedCycle || isPending) return

    const confirmMessage = `Are you sure you want to reopen "${selectedCycle.name}"? This will allow managers to edit evaluations again.`
    if (!confirm(confirmMessage)) return

    startTransition(async () => {
      const result = await updateCycleStatus(selectedCycle.id, 'active')
      
      if (!result.success) {
        setError(result.error || 'Failed to reopen cycle')
      } else {
        // Update local state
        const updatedCycles = cycles.map(cycle => 
          cycle.id === selectedCycle.id 
            ? { ...cycle, status: 'active' }
            : cycle
        )
        setCycles(updatedCycles)
        
        const updatedSelectedCycle = { ...selectedCycle, status: 'active' }
        setSelectedCycle(updatedSelectedCycle)
        onCycleSelect?.(updatedSelectedCycle)
        
        setShowActions(false)
      }
    })
  }

  const handleCreateCycle = () => {
    setShowCreateModal(true)
  }

  const handleModalSubmit = async () => {
    if (!createForm.name.trim() || !createForm.startDate || !createForm.endDate) {
      setError('Please fill in all fields')
      return
    }

    startTransition(async () => {
      const { createCycle } = await import('@/app/dashboard/actions')
      const result = await createCycle({
        name: createForm.name.trim(),
        startDate: createForm.startDate,
        endDate: createForm.endDate
      })

      if (!result.success) {
        setError(result.error || 'Failed to create cycle')
      } else {
        setShowCreateModal(false)
        setCreateForm({ name: '', startDate: '', endDate: '' })
        // Note: Page will auto-refresh due to revalidatePath in server action
      }
    })
  }

  const handleModalCancel = () => {
    setShowCreateModal(false)
    setCreateForm({ name: '', startDate: '', endDate: '' })
  }


  if (error) {
    return (
      <div className="flex items-center space-x-2">
        <div className="text-xs text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="relative flex items-center space-x-2">
      <select
        value={selectedCycle?.id || ''}
        onChange={(e) => handleCycleChange(e.target.value)}
        className="text-xs bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">Select Cycle</option>
        {cycles.map((cycle) => (
          <option key={cycle.id} value={cycle.id}>
            {getStatusIcon(cycle.status)} {cycle.name} ({cycle.status})
          </option>
        ))}
      </select>

      {selectedCycle && (
        <span className="text-xs text-gray-500">
          {selectedCycle._count.evaluations} evals
        </span>
      )}

      {selectedCycle && (
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
            title="Cycle actions"
            disabled={isPending}
          >
            {isPending ? '...' : '⚙️'}
          </button>

          {showActions && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-40">
              <div className="py-1">
                {selectedCycle.status === 'active' && (
                  <button
                    onClick={handleCloseCycle}
                    className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                    disabled={isPending}
                  >
                    🔒 Close Cycle
                  </button>
                )}
                {selectedCycle.status === 'closed' && (
                  <button
                    onClick={handleReopenCycle}
                    className="w-full text-left px-3 py-2 text-xs text-green-600 hover:bg-green-50 transition-colors"
                    disabled={isPending}
                  >
                    🔓 Reopen Cycle
                  </button>
                )}
                <button
                  onClick={() => setShowActions(false)}
                  className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors border-t"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showCreateButton && (
        <button
          onClick={handleCreateCycle}
          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
          title="Create new performance cycle"
          disabled={actionLoading}
        >
          {actionLoading ? '...' : `+ ${t.dashboard.newCycle}`}
        </button>
      )}

      {/* Close dropdown when clicking outside */}
      {showActions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowActions(false)}
        ></div>
      )}

      {/* Create Cycle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full max-w-md">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">{t.dashboard.newCycle}</h2>
                <button
                  onClick={handleModalCancel}
                  className="p-2 -mr-2 text-gray-400 hover:text-gray-600"
                  disabled={actionLoading}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-4 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t.dashboard.cycleName}
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., 2025 Annual Review"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t.dashboard.startDate}
                </label>
                <input
                  type="date"
                  value={createForm.startDate}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t.dashboard.endDate}
                </label>
                <input
                  type="date"
                  value={createForm.endDate}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={handleModalCancel}
                className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:scale-95 transition-all duration-150 touch-manipulation"
                disabled={actionLoading}
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleModalSubmit}
                className="px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all duration-150 touch-manipulation"
                disabled={actionLoading}
              >
                {actionLoading ? t.dashboard.creating : t.dashboard.createCycle}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}