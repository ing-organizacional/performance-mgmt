'use client'

import { useEffect, useState } from 'react'

interface CycleStatusBannerProps {
  cycleId?: string | null
  userRole?: string
  className?: string
}

interface CycleStatus {
  id: string
  name: string
  status: string
  closedBy?: string
  closedAt?: string
}

export default function CycleStatusBanner({ cycleId, userRole, className = '' }: CycleStatusBannerProps) {
  const [cycle, setCycle] = useState<CycleStatus | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (cycleId) {
      fetchCycleStatus()
    }
  }, [cycleId])

  const fetchCycleStatus = async () => {
    if (!cycleId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/cycles/${cycleId}`)
      if (response.ok) {
        const data = await response.json()
        setCycle(data.cycle)
      }
    } catch (error) {
      console.error('Error fetching cycle status:', error)
    } finally {
      setLoading(false)
    }
  }

  // Don't show banner if cycle is active or loading
  if (loading || !cycle || cycle.status === 'active') {
    return null
  }

  const getBannerColor = () => {
    switch (cycle.status) {
      case 'closed':
        return userRole === 'hr' 
          ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
          : 'bg-red-50 border-red-200 text-red-800'
      case 'archived':
        return 'bg-gray-50 border-gray-200 text-gray-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getBannerIcon = () => {
    switch (cycle.status) {
      case 'closed':
        return userRole === 'hr' ? '⚠️' : '🔒'
      case 'archived':
        return '📁'
      default:
        return '⚠️'
    }
  }

  const getBannerMessage = () => {
    switch (cycle.status) {
      case 'closed':
        if (userRole === 'hr') {
          return `Performance cycle "${cycle.name}" is closed. You can still make partial assessments, but managers cannot edit evaluations.`
        }
        return `Performance cycle "${cycle.name}" is closed. All evaluations are now read-only.`
      case 'archived':
        return `Performance cycle "${cycle.name}" is archived. All data is read-only for historical reference.`
      default:
        return `Performance cycle "${cycle.name}" has restricted access.`
    }
  }

  return (
    <div className={`border rounded-lg p-3 ${getBannerColor()} ${className}`}>
      <div className="flex items-start space-x-2">
        <span className="text-sm flex-shrink-0 mt-0.5">
          {getBannerIcon()}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium">
            Cycle Status: {cycle.status.toUpperCase()}
          </p>
          <p className="text-xs mt-1">
            {getBannerMessage()}
          </p>
          {cycle.closedAt && (
            <p className="text-xs mt-1 opacity-75">
              Closed on {new Date(cycle.closedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}