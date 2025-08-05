// Core Database Types
export interface Company {
  id: string
  name: string
  code: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  companyId: string
  email: string | null
  username: string | null
  name: string
  role: 'employee' | 'manager' | 'hr'
  managerId: string | null
  active: boolean
  passwordHash: string | null
  pinCode: string | null
  userType: 'office' | 'operational'
  loginMethod: string
  requiresPinOnly: boolean
  employeeId: string | null
  department: string | null
  shift: string | null
  lastLogin: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface UserWithDetails extends User {
  company?: Pick<Company, 'name' | 'code'>
  manager?: Pick<User, 'name' | 'email'> | null
  _count?: {
    employees: number
    evaluationsReceived: number
  }
}

export interface UserFormData {
  id?: string
  companyId: string
  email: string | null
  username: string | null
  name: string
  role: 'employee' | 'manager' | 'hr'
  managerId: string | null
  active: boolean
  passwordHash: string | null
  pinCode: string | null
  userType: 'office' | 'operational'
  loginMethod: string
  requiresPinOnly: boolean
  employeeId: string | null
  department: string | null
  shift: string | null
  lastLogin: Date | null
  password?: string
}

export interface Evaluation {
  id: string
  employeeId: string
  managerId: string
  companyId: string
  cycleId: string | null
  periodType: string
  periodDate: string
  evaluationItemsData: string | null
  overallRating: number | null
  managerComments: string | null
  status: 'draft' | 'submitted' | 'approved'
  createdAt: Date
  updatedAt: Date
}

export interface EvaluationItem {
  id: string
  companyId: string
  cycleId: string | null
  title: string
  description: string
  type: 'okr' | 'competency'
  level: 'company' | 'department' | 'manager'
  createdBy: string
  assignedTo: string | null
  active: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface PerformanceCycle {
  id: string
  companyId: string
  name: string
  startDate: Date
  endDate: Date
  status: 'active' | 'closed' | 'archived'
  closedBy: string | null
  closedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// Extended types for UI components
export interface EvaluationCycle {
  id: string
  companyId: string
  name: string
  startDate: Date
  endDate: Date
  status: 'active' | 'closed' | 'archived'
  closedBy: string | null
  closedAt: Date | null
  createdAt: Date
  updatedAt: Date
  _count?: {
    evaluations: number
    evaluationItems: number
    partialAssessments: number
  }
}

// Form and component types
export interface EvaluationFormData {
  id: string
  title: string
  description: string
  type: 'okr' | 'competency'
  rating: number | null
  comment: string
  level?: 'company' | 'department' | 'manager'
  createdBy?: string
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface TeamMember {
  id: string
  name: string
  email: string | null
  department: string | null
  status: 'completed' | 'pending' | 'not_started'
}

// Session and Authentication types
export interface SessionUser {
  id: string
  name: string
  email: string
  role: 'employee' | 'manager' | 'hr'
  companyId: string
  userType: 'office' | 'operational'
  department?: string
}

// Component Props
export interface UserFormProps {
  user?: Partial<User>
  onSave: (user: UserFormData) => void
  onCancel: () => void
  companies: Pick<Company, 'id' | 'name' | 'code'>[]
  managers: Pick<User, 'id' | 'name' | 'email'>[]
}

export type ChangeHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void

// Additional types needed
export interface PartialAssessment {
  id: string
  cycleId: string
  employeeId: string
  evaluationItemId: string
  rating: number | null
  comment: string | null
  assessedBy: string
  assessedAt: Date
  evaluationDate: Date
  isActive: boolean
  assessmentType: string
  companyId: string
  createdAt: Date
  updatedAt: Date
}

export interface OKRItem {
  id: string
  title: string
  description: string
  type: 'okr'
  rating: number | null
  comment: string
}

export interface CompetencyItem {
  id: string
  title: string
  description: string
  type: 'competency'
  rating: number | null
  comment: string
}