// CSV Import Module Index
// Centralized exports for the refactored CSV import system

// Type exports
export type {
  ImportPreviewUser,
  ImportPreviewResult,
  ImportExecutionResult,
  RecoverableError,
  CriticalError,
  ImportAuditEntry,
  UpsertOptions,
  BatchProcessingResult,
  ImportHistoryEntry,
  ExistingUser,
  ManagerUser,
  TransactionContext,
  BatchedImportExecutionResult,
  ErrorReportResult,
  RetryImportResult
} from './types'

// Core functionality exports
export {
  previewCSVImport,
  executeCSVImport
} from './core'

// Batch processing exports
export {
  executeCSVImportWithBatching
} from './batch'

// Error recovery exports
export {
  retryFailedRows,
  generateErrorReport,
  generateRecoverySuggestions,
  validateFixes,
  bulkApplyCommonFixes
} from './recovery'

// History and rollback exports
export {
  getImportHistory,
  rollbackImport,
  getImportStatistics,
  cleanupOldImportLogs
} from './history'

// Validation and utility function exports
export {
  categorizeError,
  autoFixPassword,
  convertToCsv,
  parseCSVManually,
  getRecommendedAction,
  generateRecommendations,
  hashPasswordsInParallel,
  validateRequiredFields,
  validatePasswordRequirements,
  calculateOptimalBatchSize
} from './validation-helpers'

// Default import for backward compatibility
export { previewCSVImport as default } from './core'