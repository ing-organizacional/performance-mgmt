/**
 * Scheduled Import Manager Types
 * 
 * Type definitions for the scheduled import management system
 * including interfaces for configurations, display objects, and props.
 */

import type { ScheduledImportConfig } from '@/lib/actions/scheduled-import'

export interface ScheduledImportManagerProps {
  onImportComplete?: () => void
}

export interface ScheduledImportDisplay extends Omit<ScheduledImportConfig, 'description' | 'status' | 'lastRun' | 'nextRun' | 'errorMessage'> {
  description: string | null
  status: string
  lastRun: Date | null
  nextRun: Date | null
  errorMessage: string | null
  createdAt?: Date
  createdBy?: string
}

export interface ScheduledImportFormProps {
  isEditing: boolean
  config: Partial<ScheduledImportConfig>
  onConfigChange: (config: Partial<ScheduledImportConfig>) => void
  onSubmit: () => void
  onCancel: () => void
  isLoading: boolean
}

export interface ScheduledImportListProps {
  imports: ScheduledImportDisplay[]
  isLoading: boolean
  onEdit: (importConfig: ScheduledImportConfig) => void
  onDelete: (id: string, name: string) => void
  onExecute: (id: string, name: string) => void
  onToggleEnabled: (scheduledImport: ScheduledImportDisplay) => void
}

export interface ScheduledImportCardProps {
  scheduledImport: ScheduledImportDisplay
  onEdit: (importConfig: ScheduledImportConfig) => void
  onDelete: (id: string, name: string) => void
  onExecute: (id: string, name: string) => void
  onToggleEnabled: (scheduledImport: ScheduledImportDisplay) => void
}