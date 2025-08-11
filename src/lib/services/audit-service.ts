/**
 * Comprehensive Audit Logging Service
 * Provides centralized audit logging for all system actions
 */

import { prisma } from '@/lib/prisma-client'
import { headers } from 'next/headers'
import type { Prisma } from '@prisma/client'
import type { JsonValue, InputJsonValue } from '@prisma/client/runtime/library'

export type AuditAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'view' 
  | 'export' 
  | 'submit' 
  | 'approve' 
  | 'unlock'
  | 'login' 
  | 'logout'
  | 'import'
  | 'bulk_update'
  | 'role_change'
  | 'archive'
  | 'bulk_archive'
  | 'unarchive'

export type EntityType = 
  | 'evaluation' 
  | 'user' 
  | 'cycle' 
  | 'item' 
  | 'assignment' 
  | 'partial_assessment'
  | 'company'
  | 'report'

interface AuditLogEntry {
  userId: string
  userRole: string
  companyId: string
  action: AuditAction
  entityType: EntityType
  entityId?: string
  targetUserId?: string
  oldData?: JsonValue
  newData?: JsonValue
  metadata?: Record<string, unknown>
  reason?: string
  sessionId?: string
}

interface AuditContext {
  ipAddress?: string
  userAgent?: string
  sessionId?: string
}

/**
 * Get request context for audit logging
 */
async function getAuditContext(): Promise<AuditContext> {
  try {
    const headersList = await headers()
    return {
      ipAddress: headersList.get('x-forwarded-for') || 
                 headersList.get('x-real-ip') || 
                 undefined,
      userAgent: headersList.get('user-agent') || undefined,
      sessionId: headersList.get('x-session-id') || undefined
    }
  } catch {
    return {}
  }
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const context = await getAuditContext()
    
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        userRole: entry.userRole,
        companyId: entry.companyId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        targetUserId: entry.targetUserId,
        oldData: entry.oldData as InputJsonValue,
        newData: entry.newData as InputJsonValue,
        metadata: entry.metadata as InputJsonValue,
        reason: entry.reason,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: entry.sessionId || context.sessionId,
        timestamp: new Date()
      }
    })
  } catch (error) {
    // Log to console but don't fail the main operation
    console.error('Failed to create audit log:', error)
  }
}

/**
 * Audit a user login
 */
export async function auditLogin(
  userId: string, 
  userRole: string, 
  companyId: string,
  success: boolean,
  metadata?: Record<string, unknown>
) {
  await createAuditLog({
    userId,
    userRole,
    companyId,
    action: 'login',
    entityType: 'user',
    entityId: userId,
    metadata: {
      success,
      timestamp: new Date().toISOString(),
      ...(metadata || {})
    }
  })
}

/**
 * Audit data export
 */
export async function auditExport(
  userId: string,
  userRole: string,
  companyId: string,
  exportType: string,
  filters: JsonValue,
  recordCount: number
) {
  await createAuditLog({
    userId,
    userRole,
    companyId,
    action: 'export',
    entityType: 'report',
    metadata: {
      exportType,
      filters,
      recordCount,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Audit evaluation actions
 */
export async function auditEvaluation(
  userId: string,
  userRole: string,
  companyId: string,
  action: AuditAction,
  evaluationId: string,
  targetUserId?: string,
  oldData?: JsonValue,
  newData?: JsonValue,
  reason?: string
) {
  await createAuditLog({
    userId,
    userRole,
    companyId,
    action,
    entityType: 'evaluation',
    entityId: evaluationId,
    targetUserId,
    oldData,
    newData,
    reason
  })
}

/**
 * Audit user management actions
 */
export async function auditUserManagement(
  userId: string,
  userRole: string,
  companyId: string,
  action: AuditAction,
  targetUserId: string,
  oldData?: JsonValue,
  newData?: JsonValue,
  reason?: string
) {
  await createAuditLog({
    userId,
    userRole,
    companyId,
    action,
    entityType: 'user',
    entityId: targetUserId,
    targetUserId,
    oldData,
    newData,
    reason
  })
}

/**
 * Audit bulk operations
 */
export async function auditBulkOperation(
  userId: string,
  userRole: string,
  companyId: string,
  operation: string,
  affectedCount: number,
  metadata?: Record<string, unknown>
) {
  await createAuditLog({
    userId,
    userRole,
    companyId,
    action: 'bulk_update',
    entityType: 'user',
    metadata: {
      operation,
      affectedCount,
      ...(metadata || {})
    }
  })
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(
  companyId: string,
  filters?: {
    userId?: string
    targetUserId?: string
    entityType?: EntityType
    entityId?: string
    action?: AuditAction
    startDate?: Date
    endDate?: Date
  },
  pagination?: {
    page?: number
    limit?: number
  }
) {
  const page = pagination?.page || 1
  const limit = pagination?.limit || 50
  const skip = (page - 1) * limit

  const where: Prisma.AuditLogWhereInput = {
    companyId,
    ...(filters?.userId && { userId: filters.userId }),
    ...(filters?.targetUserId && { targetUserId: filters.targetUserId }),
    ...(filters?.entityType && { entityType: filters.entityType }),
    ...(filters?.entityId && { entityId: filters.entityId }),
    ...(filters?.action && { action: filters.action }),
    ...(filters?.startDate && {
      timestamp: {
        gte: filters.startDate,
        ...(filters?.endDate && { lte: filters.endDate })
      }
    })
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit
    }),
    prisma.auditLog.count({ where })
  ])

  return {
    logs,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit)
  }
}

/**
 * Get audit trail for a specific entity
 */
export async function getEntityAuditTrail(
  companyId: string,
  entityType: EntityType,
  entityId: string
) {
  return prisma.auditLog.findMany({
    where: {
      companyId,
      entityType,
      entityId
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    },
    orderBy: { timestamp: 'desc' }
  })
}

/**
 * Get user activity log
 */
export async function getUserActivityLog(
  companyId: string,
  userId: string,
  days: number = 30
) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  return prisma.auditLog.findMany({
    where: {
      companyId,
      OR: [
        { userId },
        { targetUserId: userId }
      ],
      timestamp: { gte: startDate }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    },
    orderBy: { timestamp: 'desc' }
  })
}

/**
 * Generate audit report
 */
export async function generateAuditReport(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  const logs = await prisma.auditLog.groupBy({
    by: ['action', 'entityType', 'userRole'],
    where: {
      companyId,
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: {
      id: true
    }
  })

  const userActivity = await prisma.auditLog.groupBy({
    by: ['userId'],
    where: {
      companyId,
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: 10
  })

  return {
    summary: logs,
    topUsers: userActivity,
    period: {
      start: startDate,
      end: endDate
    }
  }
}