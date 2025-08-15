/**
 * Evaluation Summary Types
 * 
 * Type definitions for the evaluation summary display system
 * including evaluation data structures and component props.
 */

export interface EvaluationSummary {
  id: string
  employee: {
    id: string
    name: string
    department: string | null
    role: string
  }
  manager: {
    name: string
    email: string | null
  }
  status: string
  overallRating: number | null
  managerComments: string | null
  createdAt: string
  evaluationItems: {
    id: string
    title: string
    description: string
    type: string
    rating: number | null
    comment: string
    level?: string
    createdBy?: string
  }[]
}

export interface EvaluationSummaryClientProps {
  evaluation: EvaluationSummary
  userRole: string
  currentUserId: string
}

export interface EvaluationHeaderProps {
  evaluation: EvaluationSummary
  userRole: string
  currentUserId: string
  onApprove: () => void
  onUnlock: () => void
  onExport: () => void
  isApproving: boolean
  isUnlocking: boolean
  isExporting: boolean
  unlockError: string | null
}

export interface EvaluationMetricsProps {
  okrAverage: number
  competencyAverage: number
  totalAverage: number
  overallRating: number | null
}

export interface EvaluationItemsProps {
  okrs: EvaluationSummary['evaluationItems']
  competencies: EvaluationSummary['evaluationItems']
}