'use client'

import { 
  calculateDeadlineInfo, 
  getDeadlineStatusText, 
  getDeadlineStyleClasses 
} from '@/lib/deadline-utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react'

interface DeadlineDisplayProps {
  deadline: string | null
  showIcon?: boolean
  showDate?: boolean
  className?: string
  compact?: boolean
}

export default function DeadlineDisplay({ 
  deadline, 
  showIcon = true, 
  showDate = true, 
  className = '',
  compact = false 
}: DeadlineDisplayProps) {
  const { t } = useLanguage()
  
  if (!deadline) return null

  const deadlineInfo = calculateDeadlineInfo(deadline)
  if (!deadlineInfo) return null

  const statusText = getDeadlineStatusText(deadlineInfo, t)
  const styleClasses = getDeadlineStyleClasses(deadlineInfo.urgencyLevel)
  
  const IconComponent = deadlineInfo.isOverdue 
    ? AlertTriangle 
    : deadlineInfo.urgencyLevel === 'low' 
      ? CheckCircle 
      : Clock

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${styleClasses} ${className}`}>
      {showIcon && (
        <IconComponent 
          size={compact ? 12 : 14} 
          className={deadlineInfo.isOverdue ? 'animate-pulse' : ''} 
        />
      )}
      
      <div className="flex flex-col">
        <span className="font-semibold">
          {statusText}
        </span>
        
        {showDate && !compact && (
          <span className="text-xs opacity-80">
            {deadlineInfo.formattedDate}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Compact version for use in tight spaces like table cells
 */
export function CompactDeadlineDisplay({ deadline, className = '' }: { deadline: string | null, className?: string }) {
  return (
    <DeadlineDisplay 
      deadline={deadline} 
      showIcon={true} 
      showDate={false} 
      compact={true}
      className={className}
    />
  )
}

/**
 * Badge version for use in cards and headers
 */
export function DeadlineBadge({ deadline, className = '' }: { deadline: string | null, className?: string }) {
  const { t } = useLanguage()
  
  if (!deadline) return null

  const deadlineInfo = calculateDeadlineInfo(deadline)
  if (!deadlineInfo) return null

  const statusText = getDeadlineStatusText(deadlineInfo, t)
  const styleClasses = getDeadlineStyleClasses(deadlineInfo.urgencyLevel)

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styleClasses} ${className}`}>
      <Clock size={12} />
      {statusText}
    </span>
  )
}