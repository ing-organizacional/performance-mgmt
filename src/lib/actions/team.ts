'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'
import { unstable_cache } from 'next/cache'
import { z } from 'zod'

export interface TeamMember {
  id: string
  name: string
  email: string | null
  department: string | null
  role: string
  hasCompletedEvaluation: boolean
  averageRating?: number
  _count: {
    evaluationsReceived: number
  }
  evaluationsReceived: {
    id: string
    status: string
    overallRating: number | null
    periodDate: string | null
  }[]
}

export interface TeamSummary {
  totalEmployees: number
  completedEvaluations: number
  inProgressEvaluations: number
  pendingEvaluations: number
  averageScore: number
}

export interface TeamData {
  success: boolean
  employees: TeamMember[]
  teamMembers: TeamMember[] // For backwards compatibility
  summary: TeamSummary
  currentUser?: {
    id: string
    name: string
    department: string | null
    role: string
  }
}

const teamOptionsSchema = z.object({
  includeSubordinates: z.boolean().default(false),
  includeMetrics: z.boolean().default(true)
}).optional()

export async function getManagerTeam(options?: {
  includeSubordinates?: boolean
  includeMetrics?: boolean
}): Promise<TeamData> {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const userId = session.user.id
    const userRole = session.user.role

    // Only managers and HR can access this endpoint
    if (userRole !== 'manager' && userRole !== 'hr') {
      throw new Error('Access denied - Manager or HR role required')
    }

    // Validate options
    const validatedOptions = teamOptionsSchema.parse(options)
    const { includeSubordinates = false, includeMetrics = true } = validatedOptions || {}

    // Use caching for better performance
    return await unstable_cache(
      async () => {
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

        // Transform employees to include hasCompletedEvaluation
        const transformedEmployees: TeamMember[] = employees.map(employee => {
          const latestEval = employee.evaluationsReceived[0]
          let hasCompletedEvaluation = false
          
          if (latestEval) {
            if (latestEval.status === 'submitted' || latestEval.status === 'approved') {
              totalCompleted++
              hasCompletedEvaluation = true
              if (latestEval.overallRating) {
                totalRatings++
                ratingSum += latestEval.overallRating
              }
            } else if (latestEval.status === 'draft') {
              totalInProgress++
            }
          }

          return {
            ...employee,
            hasCompletedEvaluation,
            averageRating: latestEval?.overallRating || undefined
          }
        })

        const summary: TeamSummary = {
          totalEmployees: transformedEmployees.length,
          completedEvaluations: totalCompleted,
          inProgressEvaluations: totalInProgress,
          pendingEvaluations: transformedEmployees.length - totalCompleted - totalInProgress,
          averageScore: totalRatings > 0 ? ratingSum / totalRatings : 0
        }

        // Get current user data for backwards compatibility
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            department: true,
            role: true
          }
        })

        return {
          success: true,
          employees: transformedEmployees,
          teamMembers: transformedEmployees, // Backwards compatibility
          summary,
          currentUser: currentUser || undefined
        }
      },
      [`manager-team-${userId}`, includeSubordinates?.toString(), includeMetrics?.toString()],
      { 
        revalidate: 300, // 5 minute cache
        tags: [`manager-team-${userId}`]
      }
    )()

  } catch (error) {
    console.error('Error fetching team data:', error)
    throw new Error('Failed to fetch team data')
  }
}

// Helper function to revalidate team data cache
export async function revalidateManagerTeam(userId?: string) {
  const session = await auth()
  const targetUserId = userId || session?.user?.id
  
  if (!targetUserId) {
    throw new Error('User ID required for cache revalidation')
  }

  // This would require implementing cache tag revalidation
  // For now, we'll rely on the time-based revalidation
}