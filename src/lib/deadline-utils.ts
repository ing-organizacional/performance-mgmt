/**
 * Utility functions for handling evaluation deadlines
 */

export interface DeadlineInfo {
  daysRemaining: number
  isOverdue: boolean
  isToday: boolean
  formattedDate: string
  urgencyLevel: 'high' | 'medium' | 'low' | 'overdue'
}

/**
 * Calculate days remaining and deadline information
 */
export function calculateDeadlineInfo(deadline: string | null): DeadlineInfo | null {
  if (!deadline) return null

  const deadlineDate = new Date(deadline)
  const today = new Date()
  
  // Reset time components for accurate day calculation
  today.setHours(0, 0, 0, 0)
  deadlineDate.setHours(0, 0, 0, 0)
  
  const timeDiff = deadlineDate.getTime() - today.getTime()
  const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
  
  const isOverdue = daysRemaining < 0
  const isToday = daysRemaining === 0
  
  // Determine urgency level
  let urgencyLevel: 'high' | 'medium' | 'low' | 'overdue'
  if (isOverdue) {
    urgencyLevel = 'overdue'
  } else if (daysRemaining <= 3) {
    urgencyLevel = 'high'
  } else if (daysRemaining <= 7) {
    urgencyLevel = 'medium'
  } else {
    urgencyLevel = 'low'
  }
  
  // Format date for display
  const formattedDate = deadlineDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
  
  return {
    daysRemaining: Math.abs(daysRemaining),
    isOverdue,
    isToday,
    formattedDate,
    urgencyLevel
  }
}

/**
 * Get a human-readable deadline status text
 */
export function getDeadlineStatusText(deadlineInfo: DeadlineInfo, translations?: any): string {
  if (deadlineInfo.isOverdue) {
    const days = deadlineInfo.daysRemaining
    if (translations?.dashboard) {
      return days === 1 ? `1 ${translations.dashboard.dayOverdue}` : `${days} ${translations.dashboard.daysOverdue}`
    }
    return days === 1 ? '1 day overdue' : `${days} days overdue`
  }
  
  if (deadlineInfo.isToday) {
    if (translations?.dashboard) {
      return translations.dashboard.dueToday
    }
    return 'Due today'
  }
  
  const days = deadlineInfo.daysRemaining
  if (translations?.dashboard) {
    return days === 1 ? `1 ${translations.dashboard.dayRemaining}` : `${days} ${translations.dashboard.daysRemaining}`
  }
  return days === 1 ? '1 day remaining' : `${days} days remaining`
}

/**
 * Get CSS classes for deadline styling based on urgency
 */
export function getDeadlineStyleClasses(urgencyLevel: 'high' | 'medium' | 'low' | 'overdue'): string {
  switch (urgencyLevel) {
    case 'overdue':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'high':
      return 'text-orange-600 bg-orange-50 border-orange-200'
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'low':
      return 'text-green-600 bg-green-50 border-green-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

/**
 * Sort items by deadline urgency (overdue first, then by days remaining)
 */
export function sortByDeadlineUrgency<T extends { evaluationDeadline?: string | null }>(
  items: T[]
): T[] {
  return items.sort((a, b) => {
    const aInfo = calculateDeadlineInfo(a.evaluationDeadline || null)
    const bInfo = calculateDeadlineInfo(b.evaluationDeadline || null)
    
    // Items without deadlines go to the end
    if (!aInfo && !bInfo) return 0
    if (!aInfo) return 1
    if (!bInfo) return -1
    
    // Overdue items first
    if (aInfo.isOverdue && !bInfo.isOverdue) return -1
    if (!aInfo.isOverdue && bInfo.isOverdue) return 1
    
    // If both overdue or both not overdue, sort by days remaining
    if (aInfo.isOverdue && bInfo.isOverdue) {
      return bInfo.daysRemaining - aInfo.daysRemaining // More overdue first
    }
    
    return aInfo.daysRemaining - bInfo.daysRemaining // Less days remaining first
  })
}

/**
 * Filter items by deadline urgency level
 */
export function filterByUrgency<T extends { evaluationDeadline?: string | null }>(
  items: T[],
  urgencyLevel: 'high' | 'medium' | 'low' | 'overdue' | 'all'
): T[] {
  if (urgencyLevel === 'all') return items
  
  return items.filter(item => {
    const deadlineInfo = calculateDeadlineInfo(item.evaluationDeadline || null)
    return deadlineInfo?.urgencyLevel === urgencyLevel
  })
}