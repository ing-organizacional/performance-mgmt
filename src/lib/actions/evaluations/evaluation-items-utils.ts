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

  // Get all active evaluations for this company
  const activeEvaluations = await prisma.evaluation.findMany({
    where: {
      companyId: existingItem.companyId,
      status: 'draft'
    }
  })

  // Remove this item from all active evaluations by updating the JSON data
  for (const evaluation of activeEvaluations) {
    if (evaluation.evaluationItemsData) {
      try {
        const itemsData = JSON.parse(evaluation.evaluationItemsData)
        const filteredData = itemsData.filter((item: { id: string }) => item.id !== existingItem.id)
        
        await prisma.evaluation.update({
          where: { id: evaluation.id },
          data: {
            evaluationItemsData: JSON.stringify(filteredData)
          }
        })
      } catch (error) {
        console.error('Error parsing evaluation items data:', error)
      }
    }
  }

  // Remove from individual assignments
  await prisma.evaluationItemAssignment.deleteMany({
    where: {
      evaluationItemId: existingItem.id
    }
  })
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