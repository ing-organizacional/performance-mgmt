import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const userId = session.user.id
    
    const userRole = session.user.role

    // Only managers and HR can access this endpoint
    if (userRole !== 'manager' && userRole !== 'hr') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied - Manager or HR role required' 
      }, { status: 403 })
    }

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
        if (latestEval.status === 'submitted' || latestEval.status === 'approved') {
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

    const summary = {
      totalEmployees: employees.length,
      completedEvaluations: totalCompleted,
      inProgressEvaluations: totalInProgress,
      pendingEvaluations: employees.length - totalCompleted - totalInProgress,
      averageScore: totalRatings > 0 ? ratingSum / totalRatings : 0
    }

    return NextResponse.json({
      success: true,
      employees,
      summary
    })
  } catch (error) {
    console.error('Error fetching team data:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch team data' 
    }, { status: 500 })
  }
}