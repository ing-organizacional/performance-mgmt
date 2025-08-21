import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'
import ArchivedItemsClient from './ArchivedItemsClient'

interface ArchivedCompanyEvaluationItem {
  id: string
  title: string
  description: string
  type: 'okr' | 'competency'
  level: 'company'
  createdBy: string
  creatorRole: string
  active: boolean
  createdAt: string
  archivedAt: string | null
  archivedBy: string
  archivedReason: string
}

async function getArchivedCompanyItems(companyId: string): Promise<ArchivedCompanyEvaluationItem[]> {
  try {
    // Use raw query to handle new schema fields during transition
    const archivedItems = await prisma.$queryRaw`
      SELECT 
        ei.*,
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
    return archivedItems.map(item => ({
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
    }))
  } catch (error) {
    console.error('Error fetching archived company items:', error)
    return []
  }
}

async function getArchivedItemsCount(companyId: string): Promise<{ okrs: number, competencies: number }> {
  try {
    // Use raw query to handle new schema fields during transition
    const results = await prisma.$queryRaw`
      SELECT 
        type,
        COUNT(*) as count
      FROM EvaluationItem 
      WHERE companyId = ${companyId}
        AND level = 'company'
        AND archivedAt IS NOT NULL
      GROUP BY type
    ` as Array<{ type: string; count: number }>

    let okrs = 0
    let competencies = 0

    results.forEach(result => {
      if (result.type === 'okr') {
        okrs = Number(result.count)
      } else if (result.type === 'competency') {
        competencies = Number(result.count)
      }
    })

    return { okrs, competencies }
  } catch (error) {
    console.error('Error fetching archived items count:', error)
    return { okrs: 0, competencies: 0 }
  }
}

export default async function ArchivedCompanyItemsPage() {
  const session = await auth()

  if (!session?.user?.id || session.user.role !== 'hr') {
    redirect('/login')
  }

  const companyId = session.user.companyId
  
  if (!companyId) {
    redirect('/login')
  }

  // Fetch archived company items
  const archivedItems = await getArchivedCompanyItems(companyId)
  
  // Get archived items count for breadcrumb info
  const archivedCount = await getArchivedItemsCount(companyId)

  return (
    <ArchivedItemsClient 
      archivedItems={archivedItems}
      archivedCount={archivedCount}
    />
  )
}