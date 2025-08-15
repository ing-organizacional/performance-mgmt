/**
 * Evaluation Actions Entry Point
 * 
 * Re-exports all evaluation-related Server Actions from the modular evaluation structure.
 * This provides a single import point for all evaluation functionality including:
 * - evaluation-assignments.ts: Assignment and bulk operations
 * - evaluation-data.ts: Data fetching and filtering
 * - evaluation-items.ts: Item management (OKRs and competencies)
 * - evaluation-workflow.ts: Status transitions and approvals
 * 
 * Server Actions handle all evaluation business logic with proper authentication,
 * authorization, and data validation for the performance management system.
 */

// Re-export all functions from the modular evaluation structure
export * from './evaluations/'


