/**
 * Scheduled Import Manager Utilities
 * 
 * Utility functions for the scheduled import management system
 * including status badges, frequency labels, and formatting helpers.
 */

import { CheckCircle, Pause, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ScheduledImportConfig } from '@/lib/actions/scheduled-import'

export const getStatusBadge = (status: string) => {
  const statusConfig = {
    active: { variant: 'default' as const, label: 'Active', icon: CheckCircle },
    paused: { variant: 'secondary' as const, label: 'Paused', icon: Pause },
    error: { variant: 'destructive' as const, label: 'Error', icon: AlertCircle },
    disabled: { variant: 'outline' as const, label: 'Disabled', icon: Pause }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
  const Icon = config.icon

  return (
    <Badge variant={config.variant}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  )
}

export const getFrequencyLabel = (schedule: ScheduledImportConfig['schedule']) => {
  const { frequency, time, dayOfWeek, dayOfMonth } = schedule
  
  switch (frequency) {
    case 'daily':
      return `Daily at ${time}`
    case 'weekly':
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      return `Weekly on ${days[dayOfWeek || 0]} at ${time}`
    case 'monthly':
      return `Monthly on day ${dayOfMonth || 1} at ${time}`
    default:
      return `${frequency} at ${time}`
  }
}