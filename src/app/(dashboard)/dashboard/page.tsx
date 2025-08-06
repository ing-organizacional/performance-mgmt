import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma-client'
import DashboardClient from './DashboardClient'
import type { EvaluationCycle } from '@/types'

interface CompletionStats {
  total: number
  completed: number
  inProgress: number
  pending: number
  overdue: number
  duesSoon: number
}


async function getDashboardData(companyId: string) {
  // Get all performance cycles for company
  const allCycles = await prisma.performanceCycle.findMany({
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
      createdByUser: {
        select: {
          name: true
        }
      },
      closedByUser: {
        select: {
          name: true
        }
      }
    },
    orderBy: [
      { status: 'desc' },  // Active cycles first
      { createdAt: 'desc' }
    ]
  })

  // Get active performance cycle
  const activeCycle = allCycles.find(cycle => cycle.status === 'active') || null

  // Get all employees in the company (excluding HR admin role)
  const totalEmployees = await prisma.user.count({
    where: {
      companyId,
      active: true,
      role: {
        in: ['employee', 'manager', 'hr'] // Include all roles that should be evaluated
      }
    }
  })

  // Get evaluations from the active cycle if it exists, otherwise get latest evaluations
  const evaluationWhere = activeCycle 
    ? { companyId, cycleId: activeCycle.id }
    : { companyId }

  const evaluations = await prisma.evaluation.findMany({
    where: evaluationWhere,
    select: {
      id: true,
      status: true,
      overallRating: true,
      employeeId: true,
      createdAt: true,
      updatedAt: true
    }
  })

  // Calculate completion statistics
  let completed = 0
  let inProgress = 0
  
  const ratingCounts = {
    outstanding: 0, // 5
    exceeds: 0,     // 4  
    meets: 0,       // 3
    below: 0,       // 2
    needs: 0        // 1
  }

  // Create a map of employees who have evaluations
  const employeeEvaluationMap = new Map()
  
  evaluations.forEach(evaluation => {
    // Only count the latest evaluation per employee
    const existing = employeeEvaluationMap.get(evaluation.employeeId)
    if (!existing || new Date(evaluation.updatedAt) > new Date(existing.updatedAt)) {
      employeeEvaluationMap.set(evaluation.employeeId, evaluation)
    }
  })

  // Count completed vs in progress from actual evaluations
  employeeEvaluationMap.forEach(evaluation => {
    if (evaluation.status === 'completed' || evaluation.status === 'submitted' || evaluation.status === 'approved') {
      completed++
      
      // Count rating distribution
      if (evaluation.overallRating) {
        switch (evaluation.overallRating) {
          case 5:
            ratingCounts.outstanding++
            break
          case 4:
            ratingCounts.exceeds++
            break
          case 3:
            ratingCounts.meets++
            break
          case 2:
            ratingCounts.below++
            break
          case 1:
            ratingCounts.needs++
            break
        }
      }
    } else if (evaluation.status === 'draft') {
      inProgress++
    }
  })

  const completionStats: CompletionStats = {
    total: totalEmployees,
    completed,
    inProgress,
    pending: totalEmployees - completed - inProgress,
    overdue: 0, // TODO: Implement deadline tracking
    duesSoon: 0 // TODO: Implement deadline tracking
  }

  // Format cycles for client
  const formattedCycles = allCycles.map(cycle => ({
    id: cycle.id,
    name: cycle.name,
    status: cycle.status,
    startDate: cycle.startDate.toISOString(),
    endDate: cycle.endDate.toISOString(),
    createdBy: cycle.createdBy,
    closedBy: cycle.closedByUser?.name || null,
    closedAt: cycle.closedAt?.toISOString() || null,
    _count: cycle._count
  }))

  return {
    completionStats,
    ratingDistribution: ratingCounts,
    activeCycle: activeCycle as EvaluationCycle | null,
    allCycles: formattedCycles
  }
}

export default async function DashboardPage() {
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

  // Fetch dashboard data directly from database
  const { completionStats, ratingDistribution, activeCycle, allCycles } = await getDashboardData(companyId)

  return (
    <DashboardClient 
      userRole={userRole}
      companyId={companyId}
      completionStats={completionStats}
      ratingDistribution={ratingDistribution}
      activeCycle={activeCycle}
      allCycles={allCycles}
    />
  )
}