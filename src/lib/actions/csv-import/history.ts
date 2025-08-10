// CSV Import History and Rollback Functions
// Audit trail and rollback functionality for CSV imports

'use server'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'
import { requireHRRole } from '@/lib/auth-middleware'
import { revalidatePath } from 'next/cache'
import type { ImportHistoryEntry } from './types'

// Get comprehensive import history
export async function getImportHistory(): Promise<{
  success: boolean
  error?: string
  history: ImportHistoryEntry[]
}> {
  try {
    const authResult = await requireHRRole()
    if (authResult instanceof NextResponse) {
      return { success: false, error: 'Authentication failed', history: [] }
    }
    
    const { user } = authResult

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        companyId: user.companyId,
        action: {
          in: ['csv_import_execute', 'csv_import_batch_execute', 'csv_import_rollback']
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 50 // Limit to recent imports
    })

    const history: ImportHistoryEntry[] = auditLogs.map(log => ({
      id: log.id,
      userId: log.userId,
      userName: log.user.name,
      userEmail: log.user.email,
      operation: log.action,
      timestamp: log.timestamp,
      fileName: (log.metadata as { fileName?: string })?.fileName,
      totalRows: (log.metadata as { totalProcessed?: number })?.totalProcessed || 
                (log.metadata as { totalRows?: number })?.totalRows,
      created: (log.metadata as { created?: number })?.created,
      updated: (log.metadata as { updated?: number })?.updated,
      failed: (log.metadata as { failed?: number })?.failed,
      canRollback: log.action.includes('execute') && 
                  log.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
    }))

    return { success: true, history }

  } catch (error) {
    console.error('Error fetching import history:', error)
    return { success: false, error: 'Failed to fetch import history', history: [] }
  }
}

// Rollback a previous import
export async function rollbackImport(auditLogId: string): Promise<{
  success: boolean
  error?: string
  message?: string
}> {
  try {
    const authResult = await requireHRRole()
    if (authResult instanceof NextResponse) {
      return { success: false, error: 'Authentication failed' }
    }
    
    const { user } = authResult
    
    // Find the import audit log
    const auditLog = await prisma.auditLog.findUnique({
      where: { id: auditLogId }
    })
    
    if (!auditLog || (!auditLog.action.includes('csv_import_execute'))) {
      return { success: false, error: 'Import record not found' }
    }
    
    if (auditLog.companyId !== user.companyId) {
      return { success: false, error: 'Import record not found' }
    }

    // Check if rollback is within 24 hours
    const hoursSinceImport = (Date.now() - auditLog.timestamp.getTime()) / (1000 * 60 * 60)
    if (hoursSinceImport > 24) {
      return { success: false, error: 'Rollback is only available within 24 hours of import' }
    }

    // Check if already rolled back
    const existingRollback = await prisma.auditLog.findFirst({
      where: {
        action: 'csv_import_rollback',
        metadata: {
          path: 'originalImportId',
          equals: auditLogId
        }
      }
    })

    if (existingRollback) {
      return { success: false, error: 'This import has already been rolled back' }
    }

    // Perform rollback transaction
    let rolledBackUsers = 0
    const rollbackResults = await performRollback(auditLog, user)
    rolledBackUsers = rollbackResults.rolledBackUsers

    // Create rollback audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        userRole: user.role,
        timestamp: new Date(),
        action: 'csv_import_rollback',
        entityType: 'User',
        metadata: {
          originalImportId: auditLogId,
          originalFileName: (auditLog.metadata as { fileName?: string })?.fileName,
          rolledBackUsers,
          rollbackTimestamp: new Date().toISOString(),
          rollbackReason: 'Manual rollback requested'
        }
      }
    })

    revalidatePath('/users')
    revalidatePath('/users/advanced')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: `Successfully rolled back ${rolledBackUsers} user changes`
    }

  } catch (error) {
    console.error('Error rolling back import:', error)
    return { success: false, error: 'Failed to rollback import' }
  }
}

// Perform the actual rollback operation
async function performRollback(
  auditLog: { id: string; newData?: unknown; metadata?: unknown },
  user: { id: string; companyId: string }
): Promise<{ rolledBackUsers: number }> {
  let rolledBackUsers = 0

  await prisma.$transaction(async (tx) => {
    const changeData = auditLog.newData as {
      created?: string[]
      updated?: { userId: string; field: string; oldValue: unknown; newValue: unknown }[]
    }

    // Rollback created users (delete them)
    if (changeData?.created && Array.isArray(changeData.created)) {
      const usersToDelete = changeData.created.filter(id => id !== 'new-user')
      
      if (usersToDelete.length > 0) {
        const deletedCount = await tx.user.deleteMany({
          where: {
            id: { in: usersToDelete },
            companyId: user.companyId
          }
        })
        rolledBackUsers += deletedCount.count
      }
    }

    // Rollback updated users (restore old values)
    if (changeData?.updated && Array.isArray(changeData.updated)) {
      const userUpdates = new Map<string, Record<string, unknown>>()
      
      // Group updates by user
      for (const change of changeData.updated) {
        if (!userUpdates.has(change.userId)) {
          userUpdates.set(change.userId, {})
        }
        
        const updates = userUpdates.get(change.userId)!
        if (change.field === 'password') {
          // Skip password rollback for security
          continue
        }
        updates[change.field] = change.oldValue
      }

      // Apply rollback updates
      for (const [userId, updates] of userUpdates) {
        if (Object.keys(updates).length > 0) {
          await tx.user.update({
            where: { 
              id: userId,
              companyId: user.companyId
            },
            data: updates
          })
          rolledBackUsers++
        }
      }
    }
  })

  return { rolledBackUsers }
}

// Get detailed import statistics
export async function getImportStatistics(): Promise<{
  success: boolean
  error?: string
  statistics?: {
    totalImports: number
    totalUsersProcessed: number
    totalUsersCreated: number
    totalUsersUpdated: number
    totalFailures: number
    averageImportTime: number
    largestImport: {
      fileName: string
      userCount: number
      date: Date
    }
    recentActivity: {
      last24Hours: number
      last7Days: number
      last30Days: number
    }
  }
}> {
  try {
    const authResult = await requireHRRole()
    if (authResult instanceof NextResponse) {
      return { success: false, error: 'Authentication failed' }
    }
    
    const { user } = authResult

    // Get all import audit logs for statistics
    const importLogs = await prisma.auditLog.findMany({
      where: {
        companyId: user.companyId,
        action: {
          in: ['csv_import_execute', 'csv_import_batch_execute']
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    if (importLogs.length === 0) {
      return {
        success: true,
        statistics: {
          totalImports: 0,
          totalUsersProcessed: 0,
          totalUsersCreated: 0,
          totalUsersUpdated: 0,
          totalFailures: 0,
          averageImportTime: 0,
          largestImport: {
            fileName: 'None',
            userCount: 0,
            date: new Date()
          },
          recentActivity: {
            last24Hours: 0,
            last7Days: 0,
            last30Days: 0
          }
        }
      }
    }

    // Calculate statistics
    let totalUsersProcessed = 0
    let totalUsersCreated = 0
    let totalUsersUpdated = 0
    let totalFailures = 0
    let totalImportTime = 0
    let largestImport = { fileName: '', userCount: 0, date: new Date() }

    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const recentActivity = {
      last24Hours: 0,
      last7Days: 0,
      last30Days: 0
    }

    for (const log of importLogs) {
      const metadata = log.metadata as {
        totalProcessed?: number
        created?: number
        updated?: number
        failed?: number
        executionTimeMs?: number
        fileName?: string
      }

      const processed = metadata.totalProcessed || 0
      const created = metadata.created || 0
      const updated = metadata.updated || 0
      const failed = metadata.failed || 0
      const executionTime = metadata.executionTimeMs || 0

      totalUsersProcessed += processed
      totalUsersCreated += created
      totalUsersUpdated += updated
      totalFailures += failed
      totalImportTime += executionTime

      // Track largest import
      if (processed > largestImport.userCount) {
        largestImport = {
          fileName: metadata.fileName || 'Unknown',
          userCount: processed,
          date: log.timestamp
        }
      }

      // Track recent activity
      if (log.timestamp > last24Hours) recentActivity.last24Hours++
      if (log.timestamp > last7Days) recentActivity.last7Days++
      if (log.timestamp > last30Days) recentActivity.last30Days++
    }

    const averageImportTime = importLogs.length > 0 ? totalImportTime / importLogs.length : 0

    return {
      success: true,
      statistics: {
        totalImports: importLogs.length,
        totalUsersProcessed,
        totalUsersCreated,
        totalUsersUpdated,
        totalFailures,
        averageImportTime,
        largestImport,
        recentActivity
      }
    }

  } catch (error) {
    console.error('Error fetching import statistics:', error)
    return { success: false, error: 'Failed to fetch import statistics' }
  }
}

// Clean up old audit logs (optional maintenance function)
export async function cleanupOldImportLogs(olderThanDays: number = 90): Promise<{
  success: boolean
  error?: string
  deletedCount?: number
}> {
  try {
    const authResult = await requireHRRole()
    if (authResult instanceof NextResponse) {
      return { success: false, error: 'Authentication failed' }
    }
    
    const { user } = authResult
    
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
    
    const deleteResult = await prisma.auditLog.deleteMany({
      where: {
        companyId: user.companyId,
        action: {
          in: ['csv_import_preview', 'csv_import_execute', 'csv_import_batch_execute']
        },
        timestamp: {
          lt: cutoffDate
        }
      }
    })

    return {
      success: true,
      deletedCount: deleteResult.count
    }

  } catch (error) {
    console.error('Error cleaning up import logs:', error)
    return { success: false, error: 'Failed to cleanup import logs' }
  }
}