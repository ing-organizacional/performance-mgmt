import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'
import { validateCycleWritePermission } from '@/lib/cycle-permissions'

// GET /api/partial-assessments - Get partial assessments for an employee or cycle
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')
    const employeeId = searchParams.get('employeeId')
    const evaluationItemId = searchParams.get('evaluationItemId')

    const userRole = (session.user as any).role
    const companyId = (session.user as any).companyId

    // Build where clause
    const whereClause: any = {
      companyId: companyId
    }

    if (cycleId) whereClause.cycleId = cycleId
    if (employeeId) whereClause.employeeId = employeeId
    if (evaluationItemId) whereClause.evaluationItemId = evaluationItemId

    const partialAssessments = await prisma.partialAssessment.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true
          }
        },
        evaluationItem: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            level: true
          }
        },
        assessedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        cycle: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      },
      orderBy: [
        { employeeId: 'asc' },
        { evaluationItemId: 'asc' },
        { assessedAt: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      partialAssessments
    })
  } catch (error) {
    console.error('Error fetching partial assessments:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch partial assessments' 
    }, { status: 500 })
  }
}

// POST /api/partial-assessments - Create or update a partial assessment
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const userId = session.user.id
    const userRole = (session.user as any).role
    const companyId = (session.user as any).companyId

    const body = await request.json()
    const { 
      cycleId, 
      employeeId, 
      evaluationItemId, 
      rating, 
      comment, 
      evaluationDate,
      assessmentType = userRole === 'hr' ? 'hr_adjustment' : 'manager_initial'
    } = body

    if (!cycleId || !employeeId || !evaluationItemId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: cycleId, employeeId, evaluationItemId' 
      }, { status: 400 })
    }

    if (!evaluationDate) {
      return NextResponse.json({ 
        success: false, 
        error: 'Evaluation date is required' 
      }, { status: 400 })
    }

    // Validate cycle permissions for partial assessments
    const permission = await validateCycleWritePermission(
      cycleId, 
      userId, 
      userRole, 
      'partial_assessment'
    )

    if (!permission.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: permission.error 
      }, { status: permission.status })
    }

    // Verify the evaluation item exists and belongs to the cycle
    const evaluationItem = await prisma.evaluationItem.findFirst({
      where: {
        id: evaluationItemId,
        companyId: companyId,
        cycleId: cycleId,
        active: true
      }
    })

    if (!evaluationItem) {
      return NextResponse.json({ 
        success: false, 
        error: 'Evaluation item not found or not active in this cycle' 
      }, { status: 404 })
    }

    // Verify the employee exists
    const employee = await prisma.user.findFirst({
      where: {
        id: employeeId,
        companyId: companyId,
        active: true
      }
    })

    if (!employee) {
      return NextResponse.json({ 
        success: false, 
        error: 'Employee not found' 
      }, { status: 404 })
    }

    // Deactivate any existing active assessment for this combination
    await prisma.partialAssessment.updateMany({
      where: {
        cycleId,
        employeeId,
        evaluationItemId,
        isActive: true
      },
      data: {
        isActive: false
      }
    })

    // Create new partial assessment
    const partialAssessment = await prisma.partialAssessment.create({
      data: {
        cycleId,
        employeeId,
        evaluationItemId,
        rating: rating || null,
        comment: comment || null,
        assessedBy: userId,
        evaluationDate: new Date(evaluationDate),
        assessmentType,
        companyId,
        isActive: true
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true
          }
        },
        evaluationItem: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            level: true
          }
        },
        assessedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        cycle: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      partialAssessment,
      message: 'Partial assessment saved successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating partial assessment:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create partial assessment' 
    }, { status: 500 })
  }
}