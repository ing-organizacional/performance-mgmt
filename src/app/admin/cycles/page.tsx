import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma-client'
import CyclesClient from './CyclesClient'

async function getCyclesData(companyId: string) {
  // Get all performance cycles for the company
  const cycles = await prisma.performanceCycle.findMany({
    where: {
      companyId
    },
    include: {
      _count: {
        select: {
          evaluations: true,
          evaluationItems: true,
          partialAssessments: true
        }
      },
      closedByUser: {
        select: { name: true, email: true }
      }
    },
    orderBy: [
      { status: 'asc' }, // Active first
      { createdAt: 'desc' }
    ]
  })

  // Convert dates to strings for serialization
  const serializedCycles = cycles.map(cycle => ({
    ...cycle,
    startDate: cycle.startDate.toISOString(),
    endDate: cycle.endDate.toISOString(),
    closedAt: cycle.closedAt?.toISOString() || null,
    createdAt: cycle.createdAt.toISOString(),
    updatedAt: cycle.updatedAt.toISOString()
  }))

  return { cycles: serializedCycles }
}

export default async function AdminCyclesPage() {
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

  // Fetch cycles data directly from database
  const { cycles } = await getCyclesData(companyId)

  return (
    <CyclesClient cycles={cycles} />
  )
}