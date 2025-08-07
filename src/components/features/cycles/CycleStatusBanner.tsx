'use client'

import { useEffect, useState, useCallback } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { getCycle } from '@/lib/actions/cycles'

interface CycleStatusBannerProps {
  cycleId?: string | null
  userRole?: string
  className?: string
}

interface CycleStatus {
  id: string
  name: string
  status: string
  closedBy?: string | null
  closedAt?: string | null
}

export default function CycleStatusBanner({ cycleId, userRole, className = '' }: CycleStatusBannerProps) {
  const { t } = useLanguage()
  const [cycle, setCycle] = useState<CycleStatus | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchCycleStatus = useCallback(async () => {
    if (!cycleId) return

    setLoading(true)
    try {
      const result = await getCycle(cycleId)
      if (result.success && result.cycle) {
        setCycle(result.cycle)
      } else {
        console.error('Error fetching cycle status:', result.error)
      }
    } catch (error) {
      console.error('Error fetching cycle status:', error)
    } finally {
      setLoading(false)
    }
  }, [cycleId])

  useEffect(() => {
    if (cycleId) {
      fetchCycleStatus()
    }
  }, [cycleId, fetchCycleStatus])

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
          return `${cycle.name} ${t.dashboard.performanceCycleClosedHR}`
        }
        return `${cycle.name} ${t.dashboard.performanceCycleClosedManager}`
      case 'archived':
        return `${cycle.name} ${t.dashboard.performanceCycleArchived}`
      default:
        return `${cycle.name} ${t.dashboard.performanceCycleRestricted}`
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
            {t.dashboard.cycleStatus}: {cycle.status === 'active' ? t.dashboard.active :
             cycle.status === 'closed' ? t.dashboard.closed :
             cycle.status === 'archived' ? t.dashboard.archived :
             (cycle.status as string).toUpperCase()}
          </p>
          <p className="text-xs mt-1">
            {getBannerMessage()}
          </p>
          {cycle.closedAt && (
            <p className="text-xs mt-1 opacity-75">
              {t.dashboard.closedOn} {new Date(cycle.closedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}