import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma-client'
import { isAIEnabled } from '@/lib/ai-features'
import CompanyItemsClient from './CompanyItemsClient'

interface CompanyEvaluationItem {
  id: string
  title: string
  description: string
  type: 'okr' | 'competency'
  level: 'company'
  createdBy: string
  creatorRole: string
  evaluationDeadline?: string | null
  deadlineSetBy?: string | null
  active: boolean
  createdAt: string
}


async function getCompanyItems(companyId: string): Promise<CompanyEvaluationItem[]> {
  // Use raw query to handle schema transition - exclude archived items
  const items = await prisma.$queryRaw`
    SELECT 
      ei.*,
      c.name as creatorName,
      c.role as creatorRole,
      du.name as deadlineSetByName
    FROM EvaluationItem ei
    LEFT JOIN User c ON ei.createdBy = c.id
    LEFT JOIN User du ON ei.deadlineSetBy = du.id
    WHERE ei.companyId = ${companyId}
      AND ei.level = 'company'
      AND (ei.archivedAt IS NULL OR ei.archivedAt = '')
    ORDER BY ei.active DESC, ei.createdAt DESC
  ` as Array<{
    id: string
    title: string
    description: string
    type: string
    level: string
    active: boolean
    createdAt: Date
    evaluationDeadline: Date | null
    creatorName: string | null
    creatorRole: string | null
    deadlineSetByName: string | null
  }>

  // Transform the raw query results to match the expected interface
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    type: item.type as 'okr' | 'competency',
    level: 'company' as const,
    createdBy: item.creatorName || 'Unknown',
    creatorRole: item.creatorRole || 'unknown',
    evaluationDeadline: item.evaluationDeadline?.toISOString() || null,
    deadlineSetBy: item.deadlineSetByName || null,
    active: item.active,
    createdAt: item.createdAt.toISOString()
  }))
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

export default async function CompanyItemsPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Only HR can access this page
  if (session.user.role !== 'hr') {
    redirect('/dashboard')
  }

  const companyId = session.user.companyId
  if (!companyId) {
    redirect('/login')
  }

  // Fetch company items directly from database
  const companyItems = await getCompanyItems(companyId)
  
  // Get archived items count
  const archivedCount = await getArchivedItemsCount(companyId)

  // Check if AI features are enabled for this company
  const aiEnabled = await isAIEnabled(companyId)

  return (
    <CompanyItemsClient 
      initialItems={companyItems} 
      aiEnabled={aiEnabled}
      userDepartment={session.user.department}
      archivedCount={archivedCount}
    />
  )
}