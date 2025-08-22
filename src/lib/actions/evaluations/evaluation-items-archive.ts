/**
 * Evaluation Items - Archive Operations
 * 
 * This file contains all archive-related operations for evaluation items including:
 * - Archiving active items (moving them to archived state)
 * - Retrieving archived items with filtering and search
 * - Unarchiving items (restoring them to active state)
 * - Permanently deleting archived items with data integrity checks
 * 
 * All operations include proper permission checks, audit logging, and data validation.
 */

'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'
import { revalidatePath, revalidateTag } from 'next/cache'
import { toISOStringSafe } from '@/lib/utils/date'
import { createItemAuditLog, transformArchivedItem } from './evaluation-items-utils'
import type { EvaluationItemResult, FormattedArchivedItem } from './evaluation-items-types'

/**
 * Server action to archive an evaluation item
 */
export async function archiveEvaluationItem(itemId: string, reason?: string): Promise<EvaluationItemResult> {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id
    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only HR can archive company-level items
    if (userRole !== 'hr') {
      return { success: false, error: 'Only HR can archive company-wide items' }
    }

    // Check if item exists and is not already archived
    const existingItem = await prisma.evaluationItem.findFirst({
      where: {
        id: itemId,
        companyId,
        active: false // Only allow archiving of inactive items
      }
    })

    if (!existingItem) {
      return { success: false, error: 'Item not found or is still active. Please deactivate the item first.' }
    }

    // Archive the item using raw SQL to handle new schema fields
    await prisma.$executeRaw`
      UPDATE EvaluationItem 
      SET archivedAt = ${new Date()},
          archivedBy = ${userId},
          archivedReason = ${reason || 'Archived by HR'}
      WHERE id = ${itemId}
    `

    // Audit log for archiving
    await createItemAuditLog(
      userId,
      userRole,
      companyId,
      'archive',
      itemId,
      {
        title: existingItem.title,
        active: existingItem.active,
        archived: false
      },
      {
        title: existingItem.title,
        active: existingItem.active,
        archived: true,
        archivedReason: reason || 'Archived by HR'
      }
    )

    revalidatePath('/dashboard/company-items')
    revalidatePath('/dashboard/company-items/archived')
    revalidateTag('company-items') // Invalidate cached company items

    return { success: true }

  } catch (error) {
    console.error('Error archiving evaluation item:', error)
    return { success: false, error: 'Failed to archive item' }
  }
}

/**
 * Server action to get archived evaluation items
 */
export async function getArchivedEvaluationItems(): Promise<EvaluationItemResult & { items?: FormattedArchivedItem[] }> {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only HR can view archived items
    if (userRole !== 'hr') {
      return { success: false, error: 'Only HR can view archived items' }
    }

    // Get archived company-wide items using raw SQL
    const archivedItems = await prisma.$queryRaw`
      SELECT 
        ei.id,
        ei.title,
        ei.description,
        ei.type,
        ei.level,
        ei.active,
        ei.createdAt,
        ei.archivedAt,
        ei.archivedReason,
        c.name as creatorName,
        c.role as creatorRole,
        au.name as archivedByName,
        au.role as archivedByRole
      FROM EvaluationItem ei
      LEFT JOIN User c ON ei.createdBy = c.id
      LEFT JOIN User au ON ei.archivedBy = au.id
      WHERE ei.companyId = ${companyId}
        AND ei.level = 'company'
        AND ei.archivedAt IS NOT NULL
      ORDER BY ei.archivedAt DESC, ei.createdAt DESC
    ` as Array<{
      id: string
      title: string
      description: string
      type: string
      level: string
      active: boolean
      createdAt: Date
      archivedAt: Date | null
      archivedReason: string | null
      creatorName: string | null
      creatorRole: string | null
      archivedByName: string | null
      archivedByRole: string | null
    }>

    // Transform to match expected format
    const formattedItems = await Promise.all(archivedItems.map(transformArchivedItem))

    return { success: true, items: formattedItems }

  } catch (error) {
    console.error('Error fetching archived evaluation items:', error)
    return { success: false, error: 'Failed to fetch archived items' }
  }
}

/**
 * Server action to unarchive an evaluation item
 */
export async function unarchiveEvaluationItem(itemId: string): Promise<EvaluationItemResult> {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id
    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only HR can unarchive company-level items
    if (userRole !== 'hr') {
      return { success: false, error: 'Only HR can unarchive company-wide items' }
    }

    // Check if item exists and is archived using raw SQL
    const existingItems = await prisma.$queryRaw`
      SELECT id, title, description, type, level, active, createdAt, archivedAt, archivedReason
      FROM EvaluationItem 
      WHERE id = ${itemId} 
        AND companyId = ${companyId} 
        AND archivedAt IS NOT NULL
    ` as Array<{
      id: string
      title: string
      description: string
      type: string
      level: string
      active: boolean
      createdAt: Date
      archivedAt: Date | null
      archivedReason: string | null
    }>

    const existingItem = existingItems[0]
    if (!existingItem) {
      return { success: false, error: 'Archived item not found' }
    }

    // Unarchive the item by clearing archive fields but keeping it inactive
    await prisma.$executeRaw`
      UPDATE EvaluationItem 
      SET archivedAt = NULL,
          archivedBy = NULL,
          archivedReason = NULL,
          active = ${false}
      WHERE id = ${itemId}
    `

    // Audit log for unarchiving
    await createItemAuditLog(
      userId,
      userRole,
      companyId,
      'unarchive',
      itemId,
      {
        title: existingItem.title,
        archived: true,
        archivedAt: toISOStringSafe(existingItem.archivedAt),
        archivedReason: existingItem.archivedReason
      },
      {
        title: existingItem.title,
        archived: false,
        active: false
      }
    )

    revalidatePath('/dashboard/company-items')
    revalidatePath('/dashboard/company-items/archived')
    revalidateTag('company-items') // Invalidate cached company items

    return { success: true }

  } catch (error) {
    console.error('Error unarchiving evaluation item:', error)
    return { success: false, error: 'Failed to unarchive item' }
  }
}

/**
 * Server action to permanently delete an archived evaluation item
 */
export async function deleteArchivedEvaluationItem(itemId: string): Promise<EvaluationItemResult> {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id
    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only HR can delete company-level items
    if (userRole !== 'hr') {
      return { success: false, error: 'Only HR can delete company-wide items' }
    }

    // Check if item exists and is archived using raw SQL
    const existingItems = await prisma.$queryRaw`
      SELECT id, title, description, type, level, active, createdAt, archivedAt, archivedReason
      FROM EvaluationItem 
      WHERE id = ${itemId} 
        AND companyId = ${companyId} 
        AND archivedAt IS NOT NULL
    ` as Array<{
      id: string
      title: string
      description: string
      type: string
      level: string
      active: boolean
      createdAt: Date
      archivedAt: Date | null
      archivedReason: string | null
    }>

    const existingItem = existingItems[0]
    if (!existingItem) {
      return { success: false, error: 'Archived item not found' }
    }

    // Check if item has associated evaluations or assessments using raw SQL
    const evaluationCheck = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM Evaluation e
      INNER JOIN EvaluationItemData eid ON e.id = eid.evaluationId
      WHERE e.companyId = ${companyId} AND eid.evaluationItemId = ${itemId}
    ` as Array<{ count: number }>

    const assessmentCheck = await prisma.$queryRaw`
      SELECT COUNT(*) as count  
      FROM PartialAssessment pa
      INNER JOIN PartialAssessmentItem pai ON pa.id = pai.partialAssessmentId
      WHERE pa.companyId = ${companyId} AND pai.evaluationItemId = ${itemId}
    ` as Array<{ count: number }>

    const hasEvaluations = evaluationCheck[0]?.count > 0
    const hasAssessments = assessmentCheck[0]?.count > 0

    if (hasEvaluations || hasAssessments) {
      return { 
        success: false, 
        error: 'Cannot delete item that has associated evaluations or assessments. Data integrity must be preserved.' 
      }
    }

    // Delete individual assignments first (if any) using raw SQL
    await prisma.$executeRaw`
      DELETE FROM IndividualAssignment 
      WHERE evaluationItemId = ${itemId}
    `

    // Audit log before deletion
    await createItemAuditLog(
      userId,
      userRole,
      companyId,
      'delete',
      itemId,
      {
        title: existingItem.title,
        description: existingItem.description,
        type: existingItem.type,
        archived: true,
        archivedAt: toISOStringSafe(existingItem.archivedAt),
        archivedReason: existingItem.archivedReason
      },
      null // No new data for deletion
    )

    // Permanently delete the item
    await prisma.evaluationItem.delete({
      where: { id: itemId }
    })

    revalidatePath('/dashboard/company-items/archived')

    return { success: true }

  } catch (error) {
    console.error('Error deleting archived evaluation item:', error)
    return { success: false, error: 'Failed to delete item' }
  }
}