// Form data types and validation schemas
// Types for form handling and user input

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

export interface EvaluationFormData {
  id: string
  title: string
  description: string
  type: 'okr' | 'competency'
  rating: number | null
  comment: string
  level?: 'company' | 'department' | 'manager'
  createdBy?: string
  evaluationDeadline?: string | null
}

export interface CycleFormData {
  name: string
  startDate: string
  endDate: string
}

export interface LoginFormData {
  identifier: string
  password: string
  companyCode?: string
}

export interface AssignmentFormData {
  itemId: string
  employeeIds: string[]
  deadlineDate?: string
}

// Traditional evaluation items (legacy JSON structure)
export interface OKRItem {
  id: string
  title: string
  description: string
  type: 'okr'
  rating: number | null
  comment: string
  level?: 'company' | 'department' | 'manager'
  evaluationDeadline?: string | null
  deadlineSetBy?: string | null
  deadlineSetByRole?: string | null
}

export interface CompetencyItem {
  id: string
  title: string
  description: string
  type: 'competency'
  rating: number | null
  comment: string
  level?: 'company' | 'department' | 'manager'
  evaluationDeadline?: string | null
  deadlineSetBy?: string | null
  deadlineSetByRole?: string | null
}

// Form validation types
export interface FormErrors {
  [key: string]: string | string[]
}

export interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'date'
  placeholder?: string
  required?: boolean
  options?: Array<{ value: string; label: string }>
  value?: string | number
  onChange?: (value: string | number) => void
  error?: string
}