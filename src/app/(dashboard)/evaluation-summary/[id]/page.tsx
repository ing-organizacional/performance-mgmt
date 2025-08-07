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

async function getEvaluationSummary(evaluationId: string, companyId: string, userId: string, userRole: string): Promise<EvaluationSummary | null> {
  // Build where clause based on user role
  const whereClause: {
    id: string
    companyId: string
    employeeId?: string
  } = {
    id: evaluationId,
    companyId
  }
  
  // If user is an employee, they can only see their own evaluations
  if (userRole === 'employee') {
    whereClause.employeeId = userId
  }
  
  const evaluation = await prisma.evaluation.findFirst({
    where: whereClause,
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
  // Allow all authenticated users to access evaluation summaries
  // Permission checking is done at the data level

  const companyId = session.user.companyId
  if (!companyId) {
    redirect('/login')
  }

  const { id: evaluationId } = await params
  const evaluation = await getEvaluationSummary(evaluationId, companyId, session.user.id, userRole)
  
  if (!evaluation) {
    // Redirect based on user role
    redirect(userRole === 'employee' ? '/my-evaluations' : '/dashboard')
  }

  return <EvaluationSummaryClient evaluation={evaluation} userRole={userRole} />
}