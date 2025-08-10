import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import AuditDashboard from './AuditDashboard'
import { queryAuditLogs, type AuditAction, type EntityType } from '@/lib/services/audit-service'

export default async function AuditPage({
  searchParams
}: {
  searchParams: Promise<{ 
    page?: string
    action?: string
    entityType?: string
    userId?: string
    startDate?: string
    endDate?: string
  }>
}) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Only HR can view audit logs
  if (session.user.role !== 'hr') {
    redirect('/dashboard')
  }

  // Await searchParams
  const params = await searchParams
  
  const page = parseInt(params.page || '1')
  const filters = {
    action: params.action as AuditAction | undefined,
    entityType: params.entityType as EntityType | undefined,
    userId: params.userId,
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate) : undefined
  }

  const { logs, total, pages } = await queryAuditLogs(
    session.user.companyId,
    filters,
    { page, limit: 50 }
  )

  // Convert Date objects to strings and null to undefined for client component
  const serializedLogs = logs.map(log => ({
    ...log,
    timestamp: log.timestamp.toISOString(),
    entityId: log.entityId ?? undefined,
    targetUserId: log.targetUserId ?? undefined,
    ipAddress: log.ipAddress ?? undefined,
    userAgent: log.userAgent ?? undefined,
    sessionId: log.sessionId ?? undefined,
    reason: log.reason ?? undefined,
    oldData: log.oldData ?? undefined,
    newData: log.newData ?? undefined,
    metadata: log.metadata ?? undefined
  }))

  return (
    <AuditDashboard 
      logs={serializedLogs as Array<{
        id: string
        timestamp: string
        action: string
        entityType: string
        entityId?: string
        targetUserId?: string
        ipAddress?: string
        userAgent?: string
        oldData?: Record<string, unknown>
        newData?: Record<string, unknown>
        metadata?: Record<string, unknown>
        reason?: string
        user: {
          id: string
          name: string
          role: string
        }
      }>}
      total={total}
      currentPage={page}
      totalPages={pages}
      filters={filters}
    />
  )
}