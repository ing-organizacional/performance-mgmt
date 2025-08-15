/**
 * Core Translation Types
 * 
 * Defines the fundamental types used throughout the translation system,
 * including language definitions and common status/rating translations.
 */

export type Language = 'en' | 'es'

export interface StatusTranslations {
  active: string
  inactive: string
  completed: string
  pending: string
  draft: string
  draftReopened: string
  submitted: string
  approved: string
  inProgress: string
  notStarted: string
  overdue: string
  archived: string
  closed: string
}

export interface RatingsTranslations {
  outstanding: string
  exceedsExpectations: string
  meetsExpectations: string
  belowExpectations: string
  needsImprovement: string
  notRated: string
}