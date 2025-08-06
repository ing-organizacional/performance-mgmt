// UI component prop types and interface definitions
// React component types and styling definitions

import React from 'react'
import { User, Company } from './database'
import { UserFormData } from './forms'

// Component prop types
export interface UserFormProps {
  user?: Partial<User>
  onSave: (user: UserFormData) => void
  onCancel: () => void
  companies: Pick<Company, 'id' | 'name' | 'code'>[]
  managers: Pick<User, 'id' | 'name' | 'email'>[]
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'danger' | 'warning' | 'info'
}

export interface ToastProps {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose: (id: string) => void
}

export interface CycleSelectorProps {
  onCycleSelect?: (cycle: PerformanceCycleUI | null) => void
  showCreateButton?: boolean
  initialCycles?: PerformanceCycleUI[]
  selectedCycleId?: string | null
}

export interface CycleStatusBannerProps {
  cycle?: {
    status: string
    name: string
  }
  className?: string
}

export interface DeadlineDisplayProps {
  deadline?: Date | string | null
  urgency?: 'overdue' | 'high' | 'medium' | 'low' | null
  compact?: boolean
  className?: string
}

// UI-specific data types
export interface PerformanceCycleUI {
  id: string
  name: string
  status: string
  startDate: string
  endDate: string
  createdBy: string
  closedBy?: string | null
  closedAt?: string | null
  _count: {
    evaluations: number
    evaluationItems: number
    partialAssessments: number
  }
}

export interface NavigationItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: number
  isActive?: boolean
}

export interface CompletionStats {
  total: number
  completed: number
  percentage: number
}

export interface DashboardCard {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}

// Event handlers
export type ChangeHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
export type ClickHandler = (e: React.MouseEvent<HTMLButtonElement>) => void
export type FormHandler = (e: React.FormEvent<HTMLFormElement>) => void

// Button variants and sizes
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

export interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  className?: string
  children: React.ReactNode
  onClick?: ClickHandler
  type?: 'button' | 'submit' | 'reset'
}