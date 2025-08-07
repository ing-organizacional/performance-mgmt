import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma-client'
import MyEvaluationsClient from './MyEvaluationsClient'
import type { EvaluationCycle } from '@/types'

interface Evaluation {
  id: string
  period: string
  status: 'draft' | 'submitted' | 'approved' | 'completed'
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

async function getMyEvaluations(userId: string): Promise<Evaluation[]> {
  const evaluations = await prisma.evaluation.findMany({
    where: {
      employeeId: userId
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

  // Transform the data to match the expected format
  return evaluations.map(evaluation => ({
    id: evaluation.id,
    period: `${evaluation.periodDate} ${evaluation.periodType}`,
    status: evaluation.status as 'draft' | 'submitted' | 'approved' | 'completed',
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

  // Fetch evaluations and active cycle from database
  const evaluations = await getMyEvaluations(session.user.id)
  const activeCycle = await getActiveCycle(companyId)

  return (
    <MyEvaluationsClient 
      evaluations={evaluations}
      userName={session.user.name || ''}
      activeCycle={activeCycle}
    />
  )
}