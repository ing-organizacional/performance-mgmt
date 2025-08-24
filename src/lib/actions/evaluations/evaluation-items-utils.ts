/**
 * Evaluation Items - Utility Functions
 * 
 * This file contains shared utility functions used across evaluation item
 * operations including validation, permission checks, and data transformations.
 */

'use server'

import { prisma } from '@/lib/prisma-client'
// toISOStringSafe import removed as it's not used in this file
import { auditEvaluationItem } from '@/lib/services/audit-service'
import type { ArchivedEvaluationItem } from './evaluation-items-types'

/**
 * Validates evaluation deadline date
 */
export async function validateDeadline(evaluationDeadline: string): Promise<{ isValid: boolean; date?: Date; error?: string }> {
  const deadlineDate = new Date(evaluationDeadline)
  
  if (isNaN(deadlineDate.getTime())) {
    return { isValid: false, error: 'Invalid deadline date format. Please provide a valid date and time.' }
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (deadlineDate <= today) {
    return { isValid: false, error: 'Deadline must be tomorrow or later.' }
  }

  const twoYearsFromNow = new Date(today.getTime() + 2 * 365 * 24 * 60 * 60 * 1000)
  if (deadlineDate > twoYearsFromNow) {
    return { isValid: false, error: 'Deadline cannot be more than 2 years in the future.' }
  }

  return { isValid: true, date: deadlineDate }
}

/**
 * Checks if user has permission to perform action on evaluation item
 */
export async function checkItemPermission(
  userRole: string, 
  userId: string, 
  itemLevel: string, 
  itemCreatedBy?: string, 
  itemAssignedTo?: string,
  userDepartment?: string
): Promise<{ hasPermission: boolean; error?: string }> {
  if (userRole === 'hr') {
    return { hasPermission: true } // HR can edit everything
  }
  
  if (userRole === 'manager') {
    if (itemLevel === 'company') {
      return { hasPermission: false, error: 'Company-level items can only be edited by HR' }
    }
    
    // Managers can edit items they created or are assigned to their department
    if (itemCreatedBy === userId || itemAssignedTo === userId || itemAssignedTo === userDepartment) {
      return { hasPermission: true }
    }
    
    return { hasPermission: false, error: 'You can only edit items you created or manage' }
  }
  
  return { hasPermission: false, error: 'Access denied - Manager or HR role required' }
}

/**
 * Handles item deactivation by removing from active evaluations and assignments
 */
export async function handleItemDeactivation(
  existingItem: { id: string; companyId: string; level: string; createdBy: string },
  userId: string,
  userName: string,
  userRole: string
) {
  // If this is a company-level item and user is HR, or if this is the creator
  const canDeactivate = (
    userRole === 'hr' && existingItem.level === 'company'
  ) || (
    existingItem.createdBy === userId
  )

  if (!canDeactivate) {
    return
  }

  // NOTE: We DO NOT remove evaluation data when deactivating items
  // This preserves any manager evaluation work (ratings, comments)
  // Deactivated items will be hidden from new evaluations due to active: false filter
  // but existing evaluation data remains intact for audit/reactivation purposes

  // Remove from individual assignments
  await prisma.evaluationItemAssignment.deleteMany({
    where: {
      evaluationItemId: existingItem.id
    }
  })
}

/**
 * Handles reactivation of evaluation items by restoring assignments
 */
export async function handleItemReactivation(
  existingItem: { id: string; companyId: string; level: string; createdBy: string; assignedTo: string | null },
  userId: string,
  companyId: string,
  userRole: string
) {
  // Verify user has permission to reactivate this item
  const canReactivate = (
    userRole === 'hr' && existingItem.level === 'company'
  ) || (
    existingItem.createdBy === userId
  )
  
  if (!canReactivate) {
    return
  }

  // Handle company-wide items: assign to all employees
  if (existingItem.level === 'company') {
    const employees = await prisma.user.findMany({
      where: {
        companyId,
        role: { in: ['employee', 'manager'] }
      },
      select: { id: true }
    })

    // Create assignments for all employees
    const assignments = employees.map(employee => ({
      evaluationItemId: existingItem.id,
      employeeId: employee.id,
      companyId,
      assignedBy: userId
    }))

    // Create assignments, skipping any that might already exist
    for (const assignment of assignments) {
      try {
        await prisma.evaluationItemAssignment.create({
          data: assignment
        })
      } catch {
        // Skip if assignment already exists (unique constraint)
        console.log('Assignment already exists, skipping:', assignment)
      }
    }

    // Reopen evaluations for all employees
    const { reopenEvaluationsForNewItems } = await import('./evaluation-workflow')
    const employeeIds = employees.map(emp => emp.id)
    await reopenEvaluationsForNewItems(employeeIds, 'Company-wide item reactivated')

  } 
  // Handle department items: assign to department employees
  else if (existingItem.level === 'department' && existingItem.assignedTo) {
    const employees = await prisma.user.findMany({
      where: {
        companyId,
        department: existingItem.assignedTo,
        role: { in: ['employee', 'manager'] }
      },
      select: { id: true }
    })

    // Create assignments for department employees
    const assignments = employees.map(employee => ({
      evaluationItemId: existingItem.id,
      employeeId: employee.id,
      companyId,
      assignedBy: userId
    }))

    // Create assignments, skipping any that might already exist
    for (const assignment of assignments) {
      try {
        await prisma.evaluationItemAssignment.create({
          data: assignment
        })
      } catch {
        // Skip if assignment already exists (unique constraint)
        console.log('Assignment already exists, skipping:', assignment)
      }
    }

    // Reopen evaluations for department employees
    const { reopenEvaluationsForNewItems } = await import('./evaluation-workflow')
    const employeeIds = employees.map(emp => emp.id)
    await reopenEvaluationsForNewItems(employeeIds, 'Department item reactivated')
  }
}

/**
 * Creates audit log for evaluation item action
 */
export async function createItemAuditLog(
  userId: string,
  userRole: string,
  companyId: string,
  action: 'create' | 'update' | 'delete' | 'archive' | 'unarchive',
  itemId: string,
  oldData: Record<string, string | number | boolean | null> | null,
  newData: Record<string, string | number | boolean | null> | null
) {
  await auditEvaluationItem(
    userId,
    userRole,
    companyId,
    action,
    itemId,
    oldData,
    newData
  )
}

/**
 * Transforms archived item data to formatted structure
 */
export async function transformArchivedItem(item: ArchivedEvaluationItem) {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    type: item.type as 'okr' | 'competency',
    level: 'company' as const,
    createdBy: item.creatorName || 'Unknown',
    creatorRole: item.creatorRole || 'unknown',
    active: item.active,
    createdAt: item.createdAt.toISOString(),
    archivedAt: item.archivedAt?.toISOString() || null,
    archivedBy: item.archivedByName || 'Unknown',
    archivedReason: item.archivedReason || 'No reason provided'
  }
}