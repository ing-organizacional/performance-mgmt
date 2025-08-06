import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma-client'
import MyEvaluationsClient from './MyEvaluationsClient'

interface Evaluation {
  id: string
  period: string
  status: 'draft' | 'submitted' | 'approved' | 'completed'
  overallRating: number | null
  submittedAt: string | null
  managerName: string
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

  // Fetch evaluations directly from database
  const evaluations = await getMyEvaluations(session.user.id)

  return (
    <MyEvaluationsClient 
      evaluations={evaluations}
      userName={session.user.name || ''}
    />
  )
}