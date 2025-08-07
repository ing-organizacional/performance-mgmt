import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma-client'
import EvaluationSummaryClient from './EvaluationSummaryClient'

interface EvaluationSummary {
  id: string
  employee: {
    id: string
    name: string
    department: string | null
    role: string
  }
  manager: {
    name: string
    email: string | null
  }
  status: string
  overallRating: number | null
  managerComments: string | null
  createdAt: string
  evaluationItems: {
    id: string
    title: string
    description: string
    type: string
    rating: number | null
    comment: string
    level?: string
    createdBy?: string
  }[]
}

async function getEvaluationSummary(evaluationId: string, companyId: string): Promise<EvaluationSummary | null> {
  const evaluation = await prisma.evaluation.findFirst({
    where: {
      id: evaluationId,
      companyId
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          department: true,
          role: true
        }
      },
      manager: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })

  if (!evaluation) {
    return null
  }

  // Parse evaluation items from JSON
  let evaluationItems: {
    id: string
    title: string
    description: string
    type: string
    rating: number | null
    comment: string
    level?: string
    createdBy?: string
  }[] = []
  try {
    if (evaluation.evaluationItemsData) {
      evaluationItems = JSON.parse(evaluation.evaluationItemsData)
    }
  } catch (error) {
    console.error('Error parsing evaluation items:', error)
  }

  return {
    id: evaluation.id,
    employee: evaluation.employee,
    manager: evaluation.manager,
    status: evaluation.status,
    overallRating: evaluation.overallRating,
    managerComments: evaluation.managerComments,
    createdAt: evaluation.createdAt.toISOString(),
    evaluationItems
  }
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EvaluationSummaryPage({ params }: PageProps) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const userRole = session.user.role
  if (userRole !== 'hr' && userRole !== 'manager') {
    redirect('/my-evaluations')
  }

  const companyId = session.user.companyId
  if (!companyId) {
    redirect('/login')
  }

  const { id: evaluationId } = await params
  const evaluation = await getEvaluationSummary(evaluationId, companyId)
  
  if (!evaluation) {
    redirect('/dashboard')
  }

  return <EvaluationSummaryClient evaluation={evaluation} />
}