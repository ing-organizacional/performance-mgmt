'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'

// Server action to get evaluation by ID
export async function getEvaluation(evaluationId: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id
    const userRole = session.user.role
    const companyId = session.user.companyId

    // Managers and HR can access evaluations
    if (userRole !== 'manager' && userRole !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    const evaluation = await prisma.evaluation.findFirst({
      where: { 
        id: evaluationId,
        companyId,
        // Managers can only see their own evaluations, HR can see all
        ...(userRole === 'manager' && { managerId: userId })
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!evaluation) {
      return { success: false, error: 'Evaluation not found' }
    }

    return { success: true, data: evaluation }

  } catch (error) {
    console.error('Error fetching evaluation:', error)
    return { success: false, error: 'Failed to fetch evaluation' }
  }
}

// Server action to get team data (for finding existing evaluations)
export async function getTeamData() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id
    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only managers and HR can access team data
    if (userRole !== 'manager' && userRole !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }


    // Get team members with their evaluations
    const teamMembers = await prisma.user.findMany({
      where: {
        companyId,
        role: { in: ['employee', 'manager'] },
        ...(userRole === 'manager' ? { managerId: userId } : {})
      },
      select: {
        id: true,
        name: true,
        email: true,
        evaluationsReceived: {
          where: userRole === 'hr' ? {} : {
            managerId: userId
          },
          orderBy: {
            updatedAt: 'desc'
          },
          take: 1,
          select: {
            id: true,
            status: true,
            createdAt: true,
            overallRating: true
          }
        }
      }
    })


    return { success: true, employees: teamMembers }

  } catch (error) {
    console.error('Error fetching team data:', error)
    return { success: false, error: 'Failed to fetch team data' }
  }
}

// Server action to get reopened evaluations count for direct reports only
export async function getReopenedEvaluationsCount() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id
    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only managers and HR can check their reopened evaluations
    if (userRole !== 'manager' && userRole !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    // Get active performance cycle to determine current period
    const activeCycle = await prisma.performanceCycle.findFirst({
      where: {
        companyId,
        status: 'active'
      }
    })

    if (!activeCycle) {
      return { success: true, count: 0 }
    }

    // Derive period info from active cycle
    const cycleName = activeCycle.name.toLowerCase()
    let periodType = 'yearly'
    let periodDate = new Date().getFullYear().toString()

    if (cycleName.includes('annual') || cycleName.includes('yearly') || cycleName.includes('year')) {
      periodType = 'yearly'
      const yearMatch = activeCycle.name.match(/\b(20\d{2})\b/)
      periodDate = yearMatch ? yearMatch[1] : new Date().getFullYear().toString()
    } else if (cycleName.includes('quarter') || cycleName.includes('q1') || cycleName.includes('q2') || cycleName.includes('q3') || cycleName.includes('q4')) {
      periodType = 'quarterly'
      const quarterMatch = activeCycle.name.match(/\b(20\d{2}[-\s]?Q[1-4]|\bQ[1-4][-\s]?20\d{2})\b/i)
      if (quarterMatch) {
        periodDate = quarterMatch[1].replace(/\s/g, '-').toUpperCase()
      } else {
        const currentDate = new Date()
        const quarter = Math.ceil((currentDate.getMonth() + 1) / 3)
        periodDate = `${currentDate.getFullYear()}-Q${quarter}`
      }
    }

    // Get count of genuinely reopened draft evaluations using the new robust tracking
    const reopenedCount = await prisma.evaluation.count({
      where: {
        managerId: userId, // Always filter by direct reports
        companyId,
        status: 'draft',
        periodType,
        periodDate,
        isReopened: true // Use the robust reopened flag
      }
    })

    return { success: true, count: reopenedCount }

  } catch (error) {
    console.error('Error getting reopened evaluations count:', error)
    return { success: false, error: 'Failed to get reopened evaluations count' }
  }
}