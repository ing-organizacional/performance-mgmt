// CSV Import Type Definitions
// Centralized type definitions for the CSV import system

export interface ImportPreviewUser {
  name: string
  email?: string | null
  username?: string | null
  role: string
  department?: string | null
  userType: string
  employeeId?: string | null
  personID: string
  managerPersonID?: string | null
  managerEmployeeId?: string | null
  companyCode?: string | null
  position?: string | null
  shift?: string | null
  password?: string
  action: 'create' | 'update'
  existingUserId?: string | null
  validationErrors: string[]
  managerFound?: boolean
}

export interface ImportPreviewResult {
  success: boolean
  totalRows: number
  validRows: number
  invalidRows: number
  createCount: number
  updateCount: number
  users: ImportPreviewUser[]
  globalErrors: string[]
  parseErrors: string[]
}

export interface ImportExecutionResult {
  success: boolean
  message: string
  created: number
  updated: number
  failed: number
  errors: string[]
  auditLogId?: string
  partialSuccess?: boolean | undefined
  recoverableErrors?: RecoverableError[]
  criticalErrors?: CriticalError[]
}

export interface RecoverableError {
  rowIndex: number
  name: string
  email?: string
  errorType: 'validation' | 'duplicate' | 'manager_not_found' | 'password_weak'
  errorMessage: string
  suggestedFix?: string
  canRetry: boolean
}

export interface CriticalError {
  errorType: 'database_connection' | 'permission_denied' | 'system_error'
  errorMessage: string
  timestamp: Date
  requiresAdminAction: boolean
}

export interface ImportAuditEntry {
  id: string
  userId: string
  operation: 'csv_import_preview' | 'csv_import_execute'
  timestamp: Date
  details: {
    fileName: string
    totalRows: number
    createCount: number
    updateCount: number
    failedCount: number
    executionTimeMs: number
  }
  changes?: {
    created: string[]
    updated: { userId: string; field: string; oldValue: unknown; newValue: unknown }[]
  }
}

export interface UpsertOptions {
  selectedFields?: string[]
  updateExisting: boolean
  createNew: boolean
  requireConfirmation: boolean
  skipOnError?: boolean
  continueOnValidationError?: boolean
  autoFixPasswords?: boolean
  batchSize?: number
  useBatching?: boolean
}

export interface BatchProcessingResult {
  batchId: string
  totalBatches: number
  completed: boolean
  progress: {
    batchesCompleted: number
    totalUsers: number
    processedUsers: number
    created: number
    updated: number
    failed: number
  }
  currentBatch?: {
    batchNumber: number
    size: number
    status: 'processing' | 'completed' | 'failed'
    errors?: string[]
  }
  estimatedTimeRemaining?: number
}

export interface ImportHistoryEntry {
  id: string
  userId: string
  userName: string
  userEmail: string | null
  operation: string
  timestamp: Date | string
  fileName?: string
  totalRows?: number
  created?: number
  updated?: number
  failed?: number
  canRollback?: boolean
  details?: {
    fileName: string
    totalRows: number
    createCount: number
    updateCount: number
    failedCount: number
    executionTimeMs: number
  }
}

// User lookup types for performance
export interface ExistingUser {
  id: string
  email: string | null
  username: string | null
  employeeId: string | null
  personID: string | null
}

export interface ManagerUser {
  id: string
  personID: string | null
  employeeId: string | null
  name: string
}

// Database transaction context
export interface TransactionContext {
  user: {
    id: string
    companyId: string
    role: string
  }
  startTime: number
  fileName: string
}

// Enhanced result types
export interface BatchedImportExecutionResult extends ImportExecutionResult {
  batchProcessingResult?: BatchProcessingResult
}

export interface ErrorReportResult {
  success: boolean
  error?: string
  report?: {
    timestamp: string
    summary: {
      totalRecoverableErrors: number
      totalCriticalErrors: number
      errorCategories: Record<string, number>
    }
    recoverableErrors: (RecoverableError & { recommendedAction: string })[]
    criticalErrors: CriticalError[]
    recommendations: string[]
  }
}

export interface RetryImportResult extends ImportExecutionResult {
  retriedRows: number
  originalErrors: RecoverableError[]
}