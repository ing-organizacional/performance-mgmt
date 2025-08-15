/**
 * User Archive Management
 * 
 * Handles user archiving operations including individual and bulk archiving,
 * unarchiving, and comprehensive audit trail management.
 */

'use server'

import { prisma } from '@/lib/prisma-client'
import { auditUserManagement } from '@/lib/services/audit-service'
import { requireHRAccess } from './utils'

// Archive user with snapshot
export async function archiveUser(userId: string, reason?: string) {
  try {
    const currentUser = await requireHRAccess()

    // Get user to archive with complete context
    const userToArchive = await prisma.user.findFirst({
      where: {
        id: userId,
        companyId: currentUser.companyId
      },
      include: {
        company: true,
        manager: {
          select: { name: true, email: true }
        }
      }
    })

    if (!userToArchive) {
      return {
        success: false,
        messageKey: 'userNotFound',
        message: 'User not found'
      }
    }

    if (!userToArchive.active) {
      return {
        success: false,
        message: 'User is already archived'
      }
    }

    // Create snapshot data
    const archiveSnapshot = {
      archivedAt: new Date(),
      archivedReason: reason || null,
      archivedManagerName: userToArchive.manager?.name || null,
      archivedManagerEmail: userToArchive.manager?.email || null,
      archivedDepartment: userToArchive.department || null,
      archivedPosition: userToArchive.position || null,
      archivedCompanyName: userToArchive.company.name
    }

    // Archive the user
    await prisma.user.update({
      where: { id: userId },
      data: {
        active: false,
        ...archiveSnapshot
      }
    })

    // Audit the archive action
    await auditUserManagement(
      currentUser.id,
      currentUser.role,
      currentUser.companyId,
      'archive',
      userId,
      { 
        active: true, 
        manager: userToArchive.manager?.name,
        department: userToArchive.department 
      },
      {
        active: false,
        archivedAt: archiveSnapshot.archivedAt.toISOString(),
        archivedReason: archiveSnapshot.archivedReason,
        archivedManagerName: archiveSnapshot.archivedManagerName,
        archivedManagerEmail: archiveSnapshot.archivedManagerEmail,
        archivedDepartment: archiveSnapshot.archivedDepartment,
        archivedPosition: archiveSnapshot.archivedPosition,
        archivedCompanyName: archiveSnapshot.archivedCompanyName
      },
      reason ? `Archived: ${reason}` : 'User archived'
    )

    return {
      success: true,
      message: 'User archived successfully'
    }
  } catch (error) {
    console.error('Error archiving user:', error)
    return {
      success: false,
      message: 'Failed to archive user'
    }
  }
}

// Bulk archive users
export async function bulkArchiveUsers(userIds: string[], reason?: string) {
  try {
    const currentUser = await requireHRAccess()

    // Get all users to archive
    const usersToArchive = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        companyId: currentUser.companyId,
        active: true
      },
      include: {
        company: true,
        manager: {
          select: { name: true, email: true }
        }
      }
    })

    if (usersToArchive.length === 0) {
      return {
        success: false,
        message: 'No active users found to archive'
      }
    }

    // Check for manager dependencies
    const managersBeingArchived = usersToArchive.filter(user => user.role === 'manager')
    const dependentCount = await prisma.user.count({
      where: {
        managerId: { in: managersBeingArchived.map(m => m.id) },
        active: true
      }
    })

    if (dependentCount > 0) {
      return {
        success: false,
        message: `Cannot archive ${managersBeingArchived.length} manager(s) - they have ${dependentCount} active employee(s). Please reassign their reports first.`
      }
    }

    const archiveTimestamp = new Date()

    // Bulk update all users
    const archivePromises = usersToArchive.map(user =>
      prisma.user.update({
        where: { id: user.id },
        data: {
          active: false,
          archivedAt: archiveTimestamp,
          archivedReason: reason || null,
          archivedManagerName: user.manager?.name || null,
          archivedManagerEmail: user.manager?.email || null,
          archivedDepartment: user.department || null,
          archivedPosition: user.position || null,
          archivedCompanyName: user.company.name
        }
      })
    )

    await Promise.all(archivePromises)

    // Audit the bulk archive action
    await auditUserManagement(
      currentUser.id,
      currentUser.role,
      currentUser.companyId,
      'bulk_archive',
      '', // No single entity ID for bulk action
      {},
      {
        archivedUserIds: userIds,
        archivedCount: usersToArchive.length,
        reason: reason,
        archivedAt: archiveTimestamp.toISOString()
      },
      reason ? `Bulk archived ${usersToArchive.length} users: ${reason}` : `Bulk archived ${usersToArchive.length} users`
    )

    return {
      success: true,
      message: `Successfully archived ${usersToArchive.length} user(s)`
    }
  } catch (error) {
    console.error('Error bulk archiving users:', error)
    return {
      success: false,
      message: 'Failed to archive users'
    }
  }
}

// Unarchive user (restore)
export async function unarchiveUser(userId: string) {
  try {
    const currentUser = await requireHRAccess()

    // Check if user exists and is archived
    const userToUnarchive = await prisma.user.findFirst({
      where: {
        id: userId,
        companyId: currentUser.companyId,
        active: false
      }
    })

    if (!userToUnarchive) {
      return {
        success: false,
        message: 'Archived user not found'
      }
    }

    // Store archive data for audit
    const archiveData = {
      archivedAt: userToUnarchive.archivedAt,
      archivedReason: userToUnarchive.archivedReason,
      archivedManagerName: userToUnarchive.archivedManagerName,
      archivedDepartment: userToUnarchive.archivedDepartment
    }

    // Unarchive the user (clear archive data)
    await prisma.user.update({
      where: { id: userId },
      data: {
        active: true,
        archivedAt: null,
        archivedReason: null,
        archivedManagerName: null,
        archivedManagerEmail: null,
        archivedDepartment: null,
        archivedPosition: null,
        archivedCompanyName: null
      }
    })

    // Audit the unarchive action
    await auditUserManagement(
      currentUser.id,
      currentUser.role,
      currentUser.companyId,
      'unarchive',
      userId,
      { 
        active: false, 
        archivedAt: archiveData.archivedAt ? archiveData.archivedAt.toISOString() : null,
        archivedReason: archiveData.archivedReason,
        archivedManagerName: archiveData.archivedManagerName,
        archivedDepartment: archiveData.archivedDepartment
      },
      { active: true },
      'User unarchived (restored)'
    )

    return {
      success: true,
      message: 'User unarchived successfully'
    }
  } catch (error) {
    console.error('Error unarchiving user:', error)
    return {
      success: false,
      message: 'Failed to unarchive user'
    }
  }
}