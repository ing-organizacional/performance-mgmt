/**
 * Export system type definitions
 */

export interface EvaluationItem {
  id: string
  title: string
  description: string
  type: 'okr' | 'competency'
  rating: number | null
  comment: string
  level?: 'company' | 'department' | 'manager'
  evaluationDeadline?: string | null
  deadlineSetBy?: string | null
  deadlineSetByRole?: string | null
}

export interface AnalyticsData {
  department: string
  avgRating: number
  completionRate: number
}

export interface EvaluationData {
  id: string
  managerId: string
  employeeId: string
  employee: {
    name: string
    email: string | null
    username: string | null
    department: string | null
    employeeId: string | null
  }
  manager: {
    name: string
    email: string | null
  }
  company: {
    name: string
    code: string
  }
  cycle: {
    name: string
  } | null
  periodType: string
  periodDate: string
  evaluationItemsData: EvaluationItem[]
  overallRating: number | null
  overallComment: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface PDFLabels {
  title: string
  employee: string
  manager: string
  department: string
  company: string
  cycle: string
  period: string
  overallRating: string
  overallComment: string
  objectives: string
  competencies: string
  rating: string
  comment: string
  noComment: string
  outstanding: string
  exceeds: string
  meets: string
  below: string
  needs: string
  notRated: string
  avgOkr: string
  avgComp: string
}

export interface RatingColor {
  r: number
  g: number
  b: number
}