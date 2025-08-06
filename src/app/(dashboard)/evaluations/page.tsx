import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma-client'
import EvaluationsClient from './EvaluationsClient'

interface Employee {
  id: string
  name: string
  department: string
  role: string
  email?: string
  _count: {
    evaluationsReceived: number
  }
  evaluationsReceived: {
    id: string
    status: string
    overallRating?: number
  }[]
}

interface TeamSummary {
  totalEmployees: number
  pendingEvaluations: number
  completedEvaluations: number
  inProgressEvaluations: number
  averageScore: number
}

async function getTeamData(userId: string, userRole: string, companyId: string) {
  // Get all employees managed by this user
  const employees = await prisma.user.findMany({
    where: {
      managerId: userId,
      active: true
    },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      role: true,
      _count: {
        select: {
          evaluationsReceived: true
        }
      },
      evaluationsReceived: {
        select: {
          id: true,
          status: true,
          overallRating: true,
          periodDate: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 1 // Get only the latest evaluation
      }
    },
    orderBy: {
      name: 'asc'
    }
  })

  // Calculate team summary
  let totalCompleted = 0
  let totalInProgress = 0
  let totalRatings = 0
  let ratingSum = 0

  employees.forEach(employee => {
    const latestEval = employee.evaluationsReceived[0]
    if (latestEval) {
      if (latestEval.status === 'submitted' || latestEval.status === 'approved' || latestEval.status === 'completed') {
        totalCompleted++
        if (latestEval.overallRating) {
          totalRatings++
          ratingSum += latestEval.overallRating
        }
      } else if (latestEval.status === 'draft') {
        totalInProgress++
      }
    }
  })

  const summary: TeamSummary = {
    totalEmployees: employees.length,
    completedEvaluations: totalCompleted,
    inProgressEvaluations: totalInProgress,
    pendingEvaluations: employees.length - totalCompleted - totalInProgress,
    averageScore: totalRatings > 0 ? ratingSum / totalRatings : 0
  }

  // Get current active cycle
  let currentCycleId: string | null = null
  if (userRole === 'hr') {
    const activeCycle = await prisma.performanceCycle.findFirst({
      where: {
        companyId,
        status: 'active'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    currentCycleId = activeCycle?.id || null
  }

  return {
    employees: employees as Employee[],
    summary,
    currentCycleId
  }
}

export default async function EvaluationsPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const userId = session.user.id
  const userRole = session.user.role
  const companyId = session.user.companyId

  // Only managers and HR can access this page
  if (userRole !== 'manager' && userRole !== 'hr') {
    redirect('/my-evaluations')
  }

  // Fetch team data directly from database
  const { employees, summary, currentCycleId } = await getTeamData(userId, userRole, companyId)

  return (
    <EvaluationsClient 
      employees={employees}
      teamSummary={summary}
      currentCycleId={currentCycleId}
      userRole={userRole}
    />
  )
}