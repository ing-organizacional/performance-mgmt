// Centralized server actions export
// Following Next.js 15 best practices for server actions organization

// Cycle management actions
export {
  createCycle,
  updateCycleStatus,
  deleteCycle,
  createCycleFromObject
} from './cycles'

// User management actions
export {
  createUser,
  updateUser,
  deleteUser
} from './users'

// Team management actions
export {
  getManagerTeam,
  revalidateManagerTeam
} from './team'

// Evaluation and assignment actions
export {
  assignItemsToEmployees,
  unassignItemsFromEmployees,
  createEvaluationItem,
  updateEvaluationItem
} from './evaluations'

// Export actions with role-based permissions
export {
  exportEvaluation,
  exportTeamEvaluations,
  exportDepartmentEvaluations,
  exportCompanyEvaluations,
  exportSelectedEmployees,
  exportTopPerformers,
  exportNeedsAttention,
  exportSelectedDepartments
} from './exports'

// Enhanced CSV import actions with error recovery and batch processing (modular)
export {
  previewCSVImport,
  executeCSVImport,
  executeCSVImportWithBatching,
  getImportHistory,
  rollbackImport,
  retryFailedRows,
  generateErrorReport,
  generateRecoverySuggestions,
  validateFixes,
  bulkApplyCommonFixes,
  getImportStatistics,
  cleanupOldImportLogs
} from './csv-import'

// CSV import types
export type {
  ImportPreviewUser,
  ImportPreviewResult,
  ImportExecutionResult,
  RecoverableError,
  CriticalError,
  UpsertOptions,
  BatchProcessingResult,
  ImportHistoryEntry
} from './csv-import'

// Scheduled import actions
export {
  createScheduledImport,
  updateScheduledImport,
  getScheduledImports,
  deleteScheduledImport,
  executeScheduledImport
} from './scheduled-import'

// Admin actions
export {
  resetDatabase
} from './admin'