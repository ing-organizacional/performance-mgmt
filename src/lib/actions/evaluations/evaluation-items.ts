/**
 * Evaluation Items - Main Export Module
 * 
 * This file serves as the main entry point for all evaluation item operations.
 * It consolidates exports from specialized modules to maintain backward compatibility
 * while providing a clean, maintainable codebase structure.
 * 
 * MODULE ORGANIZATION:
 * 
 * 1. evaluation-items-types.ts - TypeScript interfaces and type definitions
 * 2. evaluation-items-utils.ts - Shared utility functions and validation logic
 * 3. evaluation-items-crud.ts - Create, Read, Update, Delete operations
 * 4. evaluation-items-archive.ts - Archive, unarchive, and deletion operations
 * 
 * FUNCTIONALITY OVERVIEW:
 * 
 * CRUD Operations:
 * - createEvaluationItem: Creates new evaluation items with validation and auto-assignment
 * - updateEvaluationItem: Updates existing items with permission checks
 * - getEvaluationItems: Retrieves items for specific employees with caching
 * - toggleEvaluationItemActive: Activates/deactivates items
 * 
 * Archive Operations:
 * - archiveEvaluationItem: Archives inactive items with audit logging
 * - getArchivedEvaluationItems: Retrieves archived items with metadata
 * - unarchiveEvaluationItem: Restores archived items to active state
 * - deleteArchivedEvaluationItem: Permanently deletes with data integrity checks
 * 
 * SECURITY & PERMISSIONS:
 * - Role-based access control (HR, Manager, Employee)
 * - Company-level data isolation
 * - Comprehensive audit logging for all operations
 * - Data integrity validation before destructive operations
 * 
 * PERFORMANCE FEATURES:
 * - Cached database queries for frequently accessed data
 * - Optimized SQL queries using raw queries where needed
 * - Efficient bulk operations for company-wide assignments
 * 
 * BUSINESS LOGIC:
 * - Company-wide items automatically assigned to all employees
 * - Evaluation reopening when new company items are added
 * - Cascade deactivation handling for item removal
 * - Archive workflow: Active → Inactive → Archived → Deleted
 */

// Re-export all CRUD operations
export {
  createEvaluationItem,
  updateEvaluationItem,
  getEvaluationItems,
  toggleEvaluationItemActive
} from './evaluation-items-crud'

// Re-export all archive operations
export {
  archiveEvaluationItem,
  getArchivedEvaluationItems,
  unarchiveEvaluationItem,
  deleteArchivedEvaluationItem
} from './evaluation-items-archive'

// Re-export utility functions for external use
export {
  validateDeadline,
  checkItemPermission,
  handleItemDeactivation,
  createItemAuditLog,
  transformArchivedItem
} from './evaluation-items-utils'

// Re-export types for external use
export type {
  CreateEvaluationItemData,
  UpdateEvaluationItemData,
  EvaluationItemResult,
  ArchivedEvaluationItem,
  FormattedArchivedItem,
  EvaluationItemWithCreator
} from './evaluation-items-types'