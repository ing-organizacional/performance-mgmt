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
  const items = await prisma.evaluationItem.findMany({
    where: {
      companyId,
      level: 'company' // Only company-level items
    },
    include: {
      creator: {
        select: {
          name: true,
          role: true
        }
      },
      deadlineSetByUser: {
        select: {
          name: true,
          role: true
        }
      }
    },
    orderBy: [
      { active: 'desc' }, // Active items first
      { createdAt: 'desc' }
    ]
  })

  // Transform the data to match the expected interface
  return items.map(item => ({
    id: item.id,
    title: item.title,
    description: item.description,
    type: item.type as 'okr' | 'competency',
    level: 'company' as const,
    createdBy: item.creator?.name || 'Unknown',
    creatorRole: item.creator?.role || 'unknown',
    evaluationDeadline: item.evaluationDeadline?.toISOString() || null,
    deadlineSetBy: item.deadlineSetByUser?.name || null,
    active: item.active,
    createdAt: item.createdAt.toISOString()
  }))
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

  // Check if AI features are enabled for this company
  const aiEnabled = await isAIEnabled(companyId)

  return (
    <CompanyItemsClient 
      initialItems={companyItems} 
      aiEnabled={aiEnabled}
      userDepartment={session.user.department}
    />
  )
}