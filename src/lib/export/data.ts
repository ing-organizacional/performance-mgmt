/**
 * Data fetching utilities for export system
 */

import { prisma } from '../prisma-client'
import type { EvaluationData, AnalyticsData } from './types'

/**
 * Get evaluation data by ID for export
 */
export async function getEvaluationData(evaluationId: string): Promise<EvaluationData | null> {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    include: {
      employee: {
        select: {
          name: true,
          email: true,
          username: true,
          department: true,
          employeeId: true
        }
      },
      manager: {
        select: {
          name: true,
          email: true
        }
      },
      company: {
        select: {
          name: true,
          code: true
        }
      },
      cycle: {
        select: {
          name: true
        }
      }
    }
  })

  if (!evaluation) return null

  return {
    ...evaluation,
    cycle: evaluation.cycle || null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    evaluationItemsData: (evaluation as any).evaluationItemsData ? JSON.parse((evaluation as any).evaluationItemsData) : [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    overallComment: (evaluation as any).overallComment || null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    overallRating: (evaluation as any).overallRating || null
  } as EvaluationData
}

/**
 * Get all company evaluations for export
 */
export async function getCompanyEvaluations(
  companyId: string,
  periodType?: string,
  periodDate?: string
): Promise<EvaluationData[]> {
  const evaluations = await prisma.evaluation.findMany({
    where: {
      companyId,
      ...(periodType && { periodType }),
      ...(periodDate && { periodDate }),
      status: 'completed' // Only include completed evaluations
    },
    include: {
      employee: {
        select: {
          name: true,
          email: true,
          username: true,
          department: true,
          employeeId: true
        }
      },
      manager: {
        select: {
          name: true,
          email: true
        }
      },
      company: {
        select: {
          name: true,
          code: true
        }
      },
      cycle: {
        select: {
          name: true
        }
      }
    },
    orderBy: [
      { employee: { department: 'asc' } },
      { employee: { name: 'asc' } }
    ]
  })

  return evaluations.map(evaluation => ({
    ...evaluation,
    cycle: evaluation.cycle || null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    evaluationItemsData: (evaluation as any).evaluationItemsData ? JSON.parse((evaluation as any).evaluationItemsData) : [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    overallComment: (evaluation as any).overallComment || null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    overallRating: (evaluation as any).overallRating || null
  })) as EvaluationData[]
}

/**
 * Generate analytics data for evaluations
 */
export function generateAnalytics(evaluations: EvaluationData[], language = 'en'): AnalyticsData[] {
  const departmentMap = new Map<string, {
    ratings: number[]
    total: number
  }>()

  evaluations.forEach(evaluation => {
    const dept = evaluation.employee.department || (language === 'es' ? 'Sin Departamento' : 'No Department')
    
    if (!departmentMap.has(dept)) {
      departmentMap.set(dept, { ratings: [], total: 0 })
    }

    const deptData = departmentMap.get(dept)!
    deptData.total++

    if (evaluation.overallRating) {
      deptData.ratings.push(evaluation.overallRating)
    }
  })

  return Array.from(departmentMap.entries()).map(([department, data]) => ({
    department,
    avgRating: data.ratings.length > 0 
      ? Math.round((data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length) * 100) / 100
      : 0,
    completionRate: Math.round((data.ratings.length / data.total) * 100)
  }))
}