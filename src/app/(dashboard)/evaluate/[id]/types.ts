export interface EvaluationItem {
  id: string
  title: string
  description: string
  type: string
  rating: number | null
  comment: string
  level?: string
  createdBy?: string
  creatorRole?: string
  evaluationDeadline?: string | null
  deadlineSetBy?: string | null
  deadlineSetByRole?: string | null
}

export interface Employee {
  id: string
  name: string
  role: string
  position: string
}

export interface EvaluateClientProps {
  employeeId: string
  employee: Employee
  initialItems: EvaluationItem[]
  userRole: string
  companyId: string
  evaluationId?: string | null
  evaluationStatus?: 'draft' | 'submitted' | 'completed'
  initialOverallRating?: number | null
  initialOverallComment?: string
  isViewingOwnEvaluation: boolean
}

export type EvaluationStatus = 'draft' | 'submitted' | 'completed'

export interface EvaluationProgress {
  completed: number
  total: number
}

export interface ItemEditData {
  title: string
  description: string
}

// Minimum comment length (approximately 2-3 sentences - around 100 characters minimum)
export const MIN_COMMENT_LENGTH = 100