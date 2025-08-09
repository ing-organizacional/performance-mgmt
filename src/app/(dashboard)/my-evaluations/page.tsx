import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma-client'
import MyEvaluationsClient from './MyEvaluationsClient'
import type { EvaluationCycle } from '@/types'

interface Evaluation {
  id: string
  period: string
  status: 'draft' | 'submitted' | 'completed'
  overallRating: number | null
  submittedAt: string | null
  managerName: string
}

async function getActiveCycle(companyId: string): Promise<EvaluationCycle | null> {
  const cycle = await prisma.performanceCycle.findFirst({
    where: {
      companyId,
      status: 'active'
    }
  })
  
  return cycle as EvaluationCycle | null
}

async function getMyEvaluations(userId: string, companyId: string): Promise<Evaluation[]> {
  // Fetch evaluations for current user
  
  const evaluations = await prisma.evaluation.findMany({
    where: {
      employeeId: userId,
      companyId: companyId,
      status: {
        in: ['draft', 'submitted', 'completed']
      }
    },
    include: {
      manager: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Return evaluations for the user

  // Transform the data to match the expected format
  return evaluations.map(evaluation => ({
    id: evaluation.id,
    period: `${evaluation.periodDate} ${evaluation.periodType}`,
    status: evaluation.status as 'draft' | 'submitted' | 'completed',
    overallRating: evaluation.overallRating,
    submittedAt: evaluation.createdAt.toISOString(),
    managerName: evaluation.manager.name
  }))
}

export default async function MyEvaluationsPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const companyId = session.user.companyId
  if (!companyId) {
    redirect('/login')
  }

  const userRole = session.user.role
  
  // Access control check passed

  // Fetch evaluations and active cycle from database
  const evaluations = await getMyEvaluations(session.user.id, companyId)
  const activeCycle = await getActiveCycle(companyId)

  return (
    <MyEvaluationsClient 
      evaluations={evaluations}
      userName={session.user.name || ''}
      activeCycle={activeCycle}
      userRole={userRole}
    />
  )
}