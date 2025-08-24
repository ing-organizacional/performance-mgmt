export interface EvaluationItem {
  id: string
  title: string
  description: string
  type: 'okr' | 'competency'
  level: 'company' | 'department'
  createdBy: string
  creatorRole: string
  assignedTo?: string | null
  evaluationDeadline?: string | null
  deadlineSetBy?: string | null
  deadlineSetByRole?: string | null
  active: boolean
}

export interface Employee {
  id: string
  name: string
  email?: string
  username?: string
  department?: string
  assignedItems: string[]
}

export interface EditingItem {
  id: string
  title: string
  description: string
  evaluationDeadline?: string
}

export type ActiveTab = 'company' | 'department'

export interface AssignmentsClientProps {
  evaluationItems: EvaluationItem[]
  employees: Employee[]
  userRole: string
  userName: string
  userDepartment?: string
  aiEnabled?: boolean
}