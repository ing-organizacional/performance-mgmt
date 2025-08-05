'use client'

import { useEffect, useState, useCallback } from 'react'

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
}

export default function CycleSelector({ onCycleSelect, showCreateButton = false }: CycleSelectorProps) {
  const [cycles, setCycles] = useState<PerformanceCycle[]>([])
  const [selectedCycle, setSelectedCycle] = useState<PerformanceCycle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showActions, setShowActions] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchCycles = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/cycles')
      if (response.ok) {
        const data = await response.json()
        setCycles(data.cycles || [])
        
        // Auto-select the active cycle
        const activeCycle = data.cycles?.find((cycle: PerformanceCycle) => cycle.status === 'active')
        if (activeCycle) {
          setSelectedCycle(activeCycle)
          onCycleSelect?.(activeCycle)
        }
      } else {
        setError('Failed to load performance cycles')
      }
    } catch (err) {
      setError('Error loading cycles')
      console.error('Error fetching cycles:', err)
    } finally {
      setLoading(false)
    }
  }, [onCycleSelect])

  useEffect(() => {
    fetchCycles()
  }, [fetchCycles])

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
    if (!selectedCycle || actionLoading) return

    const confirmMessage = `Are you sure you want to close "${selectedCycle.name}"? This will make all evaluations and items read-only for managers.`
    if (!confirm(confirmMessage)) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/cycles/${selectedCycle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'closed'
        })
      })

      if (response.ok) {
        await fetchCycles() // Refresh the cycles list
        setShowActions(false)
        alert('Performance cycle closed successfully!')
      } else {
        const errorData = await response.json()
        alert(`Failed to close cycle: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error closing cycle:', error)
      alert('Error closing cycle. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReopenCycle = async () => {
    if (!selectedCycle || actionLoading) return

    const confirmMessage = `Are you sure you want to reopen "${selectedCycle.name}"? This will allow managers to edit evaluations again.`
    if (!confirm(confirmMessage)) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/cycles/${selectedCycle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'active'
        })
      })

      if (response.ok) {
        await fetchCycles() // Refresh the cycles list
        setShowActions(false)
        alert('Performance cycle reopened successfully!')
      } else {
        const errorData = await response.json()
        alert(`Failed to reopen cycle: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error reopening cycle:', error)
      alert('Error reopening cycle. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="text-xs text-gray-500">Loading cycles...</div>
      </div>
    )
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
            disabled={actionLoading}
          >
            {actionLoading ? '...' : '⚙️'}
          </button>

          {showActions && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-40">
              <div className="py-1">
                {selectedCycle.status === 'active' && (
                  <button
                    onClick={handleCloseCycle}
                    className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                    disabled={actionLoading}
                  >
                    🔒 Close Cycle
                  </button>
                )}
                {selectedCycle.status === 'closed' && (
                  <button
                    onClick={handleReopenCycle}
                    className="w-full text-left px-3 py-2 text-xs text-green-600 hover:bg-green-50 transition-colors"
                    disabled={actionLoading}
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
          onClick={() => {/* TODO: Open create cycle modal */}}
          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
          title="Create new performance cycle"
        >
          + New Cycle
        </button>
      )}

      {/* Close dropdown when clicking outside */}
      {showActions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowActions(false)}
        ></div>
      )}
    </div>
  )
}