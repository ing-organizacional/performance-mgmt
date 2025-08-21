/**
 * Evaluation Items - Type Definitions
 * 
 * This file contains TypeScript interfaces and types used across all evaluation
 * item operations including CRUD, archive, and utility functions.
 */

export interface CreateEvaluationItemData {
  title: string
  description: string
  type: 'okr' | 'competency'
  level: 'company' | 'department' | 'manager'
  evaluationDeadline?: string
}

export interface UpdateEvaluationItemData {
  title?: string
  description?: string
  evaluationDeadline?: string | null
  active?: boolean
}

export interface EvaluationItemResult {
  success: boolean
  error?: string
  evaluationId?: string
}

export interface ArchivedEvaluationItem {
  id: string
  title: string
  description: string
  type: string
  level: string
  active: boolean
  createdAt: Date
  archivedAt: Date | null
  archivedReason: string | null
  creatorName: string | null
  creatorRole: string | null
  archivedByName: string | null
  archivedByRole: string | null
}

export interface FormattedArchivedItem {
  id: string
  title: string
  description: string
  type: 'okr' | 'competency'
  level: 'company'
  createdBy: string
  creatorRole: string
  active: boolean
  createdAt: string
  archivedAt: string | null
  archivedBy: string
  archivedReason: string
}

export interface EvaluationItemWithCreator {
  id: string
  title: string
  description: string
  type: string
  level: string
  active: boolean
  sortOrder: number
  evaluationDeadline: Date | null
  deadlineSetBy: string | null
  createdBy: string
  assignedTo: string | null
  creator: {
    name: string
    role: string
  } | null
  deadlineSetByUser: {
    name: string
    role: string
  } | null
}