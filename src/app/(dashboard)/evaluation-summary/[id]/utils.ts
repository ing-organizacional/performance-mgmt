/**
 * Evaluation Summary Utilities
 * 
 * Utility functions for evaluation display including rating colors,
 * status labels, and average calculations.
 */

import type { Translations } from '@/lib/translations/types'

export const getRatingColor = (rating: number | null) => {
  if (!rating) return 'gray'
  if (rating >= 5) return 'green'
  if (rating >= 4) return 'blue' 
  if (rating >= 3) return 'gray'
  if (rating >= 2) return 'orange'
  return 'red'
}

export const getRatingLabel = (rating: number | null, t: Translations) => {
  if (!rating) return t.status.notStarted
  switch (rating) {
    case 5: return t.ratings.outstanding
    case 4: return t.ratings.exceedsExpectations
    case 3: return t.ratings.meetsExpectations
    case 2: return t.ratings.belowExpectations
    case 1: return t.ratings.needsImprovement
    default: return `${rating}/5`
  }
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'green'
    case 'submitted': return 'green'
    case 'approved': return 'purple'
    case 'draft': return 'yellow'
    default: return 'gray'
  }
}

export const getStatusLabel = (status: string, t: Translations) => {
  switch (status) {
    case 'completed': return t.status.completed
    case 'submitted': return t.status.submitted
    case 'approved': return t.status.approved
    case 'draft': return t.status.draft
    default: return status
  }
}

export const calculateAverage = (items: { rating: number | null }[]) => {
  const ratingsWithValues = items.filter(item => item.rating && item.rating > 0)
  if (ratingsWithValues.length === 0) return 0
  const sum = ratingsWithValues.reduce((acc, item) => acc + (item.rating || 0), 0)
  return Math.round((sum / ratingsWithValues.length) * 10) / 10 // Round to 1 decimal
}

export const groupEvaluationItems = (evaluationItems: {
  id: string
  title: string
  description: string
  type: string
  rating: number | null
  comment: string
  level?: string
  createdBy?: string
}[]) => {
  const okrs = evaluationItems.filter(item => item.type === 'okr')
  const competencies = evaluationItems.filter(item => item.type === 'competency')
  return { okrs, competencies }
}