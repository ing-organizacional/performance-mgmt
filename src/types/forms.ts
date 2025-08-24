/**
 * Form Data Type Definitions
 * 
 * Comprehensive type definitions for form handling, user input validation, and data transfer
 * objects used throughout the application. Provides type safety for all form operations
 * and ensures consistent data structures between frontend and backend processing.
 * 
 * Key Features:
 * - Strongly typed form data structures for all major entities
 * - Support for both new and existing record operations (create/update)
 * - Legacy evaluation item support for backward compatibility
 * - Flexible form field configuration with validation metadata
 * - Generic error handling types for consistent UX
 * 
 * Form Categories:
 * - User Management: User creation, updates, and authentication forms
 * - Evaluation Management: Evaluation items, ratings, and assignments
 * - Cycle Management: Performance cycle configuration and lifecycle
 * - Authentication: Login and credential management forms
 * 
 * Legacy Support:
 * - OKRItem and CompetencyItem types for JSON-based evaluation storage
 * - Backward compatibility with existing evaluation data structures
 * - Migration support for transitioning to new evaluation system
 * 
 * Validation Integration:
 * - Form field props with built-in validation support
 * - Error handling types for user feedback
 * - Flexible input types supporting various form controls
 */

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
  level?: 'company' | 'department'
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
  level?: 'company' | 'department'
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
  level?: 'company' | 'department'
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