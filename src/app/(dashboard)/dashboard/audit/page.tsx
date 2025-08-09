import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import AuditDashboard from './AuditDashboard'
import { queryAuditLogs } from '@/lib/services/audit-service'

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
    action: params.action as any,
    entityType: params.entityType as any,
    userId: params.userId,
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate) : undefined
  }

  const { logs, total, pages } = await queryAuditLogs(
    session.user.companyId,
    filters,
    { page, limit: 50 }
  )

  // Convert Date objects to strings for client component
  const serializedLogs = logs.map(log => ({
    ...log,
    timestamp: log.timestamp.toISOString()
  }))

  return (
    <AuditDashboard 
      logs={serializedLogs as any}
      total={total}
      currentPage={page}
      totalPages={pages}
      filters={filters}
    />
  )
}