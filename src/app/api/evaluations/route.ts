import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'
import { validateCycleWritePermission } from '@/lib/cycle-permissions'
import { AuthUser } from '@/lib/auth-middleware'

interface EvaluationRequestBody {
  employeeId: string
  evaluationItems: Array<{
    id: string
    title: string
    description: string
    type: 'okr' | 'competency'
    rating: number | null
    comment: string
  }>
  overallRating?: number
  overallComment?: string
  periodType?: string
  periodDate?: string
  cycleId?: string
  isAutoSave?: boolean
}

// GET /api/evaluations - Get evaluations for the logged-in user
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
    const employeeId = searchParams.get('employeeId')
    
    // If employeeId is provided, use it; otherwise use the logged-in user's ID
    const targetEmployeeId = employeeId || session.user.id

    // Fetch evaluations for the target employee
    const evaluations = await prisma.evaluation.findMany({
      where: {
        employeeId: targetEmployeeId
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
    const formattedEvaluations = evaluations.map(evaluation => ({
      id: evaluation.id,
      period: `${evaluation.periodDate} ${evaluation.periodType}`,
      status: evaluation.status,
      overallRating: evaluation.overallRating,
      submittedAt: evaluation.createdAt.toISOString(),
      managerName: evaluation.manager.name
    }))

    return NextResponse.json({
      success: true,
      evaluations: formattedEvaluations
    })
  } catch (error) {
    console.error('Error fetching evaluations:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch evaluations' 
    }, { status: 500 })
  }
}

// POST /api/evaluations - Create/Save evaluation
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
    const sessionUser = session.user as AuthUser
    const userRole = sessionUser.role
    const companyId = sessionUser.companyId

    // Only managers and HR can create evaluations
    if (userRole !== 'manager' && userRole !== 'hr') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied - Manager or HR role required' 
      }, { status: 403 })
    }

    const body = await request.json() as EvaluationRequestBody
    const { 
      employeeId, 
      evaluationItems, 
      overallRating, 
      overallComment,
      periodType,
      periodDate,
      cycleId,
      isAutoSave = false
    } = body

    if (!employeeId || !evaluationItems) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // Get the cycle to use (either provided or find active cycle)
    let targetCycleId = cycleId
    let activeCycle = null
    
    if (!targetCycleId) {
      activeCycle = await prisma.performanceCycle.findFirst({
        where: {
          companyId,
          status: 'active'
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      targetCycleId = activeCycle?.id ?? undefined
    } else {
      // If cycleId was provided, fetch the cycle details
      activeCycle = await prisma.performanceCycle.findFirst({
        where: {
          id: targetCycleId,
          companyId
        }
      })
    }
    
    // Derive period values from active cycle or use provided values or defaults
    let derivedPeriodType = periodType || 'yearly'
    let derivedPeriodDate = periodDate || new Date().getFullYear().toString()
    
    if (activeCycle) {
      // Extract period info from cycle name
      const cycleName = activeCycle.name.toLowerCase()
      if (cycleName.includes('annual') || cycleName.includes('yearly') || cycleName.includes('year')) {
        derivedPeriodType = periodType || 'yearly'
        // Extract year from cycle name or use current year
        const yearMatch = activeCycle.name.match(/\b(20\d{2})\b/)
        derivedPeriodDate = periodDate || (yearMatch ? yearMatch[1] : new Date().getFullYear().toString())
      } else if (cycleName.includes('quarter') || cycleName.includes('q1') || cycleName.includes('q2') || cycleName.includes('q3') || cycleName.includes('q4')) {
        derivedPeriodType = periodType || 'quarterly'
        // Extract quarter info from cycle name
        const quarterMatch = activeCycle.name.match(/\b(20\d{2}[-\s]?Q[1-4]|\bQ[1-4][-\s]?20\d{2})\b/i)
        if (quarterMatch) {
          derivedPeriodDate = periodDate || quarterMatch[1].replace(/\s/g, '-').toUpperCase()
        } else {
          // Fallback: determine quarter from current date
          const currentDate = new Date()
          const quarter = Math.ceil((currentDate.getMonth() + 1) / 3)
          derivedPeriodDate = periodDate || `${currentDate.getFullYear()}-Q${quarter}`
        }
      }
    }

    // Validate cycle permissions
    if (targetCycleId) {
      const permission = await validateCycleWritePermission(
        targetCycleId, 
        userId, 
        userRole, 
        'evaluation'
      )

      if (!permission.allowed) {
        return NextResponse.json({ 
          success: false, 
          error: permission.error 
        }, { status: permission.status })
      }
    }

    // Check if evaluation already exists for this period
    const existingEvaluation = await prisma.evaluation.findUnique({
      where: {
        employeeId_periodType_periodDate: {
          employeeId,
          periodType: derivedPeriodType,
          periodDate: derivedPeriodDate
        }
      }
    })

    // Determine status based on whether this is an auto-save or manual submission
    const status = isAutoSave ? 'draft' : 'submitted'
    
    let evaluation
    if (existingEvaluation) {
      // Update existing evaluation
      evaluation = await prisma.evaluation.update({
        where: { id: existingEvaluation.id },
        data: {
          evaluationItemsData: JSON.stringify(evaluationItems),
          overallRating,
          managerComments: overallComment,
          // Only update status if it's not already submitted/completed
          ...(existingEvaluation.status === 'draft' && { status }),
          cycleId: targetCycleId === null ? undefined : targetCycleId
        }
      })
    } else {
      // Create new evaluation
      evaluation = await prisma.evaluation.create({
        data: {
          employeeId,
          managerId: userId,
          companyId,
          cycleId: targetCycleId === null ? undefined : targetCycleId,
          periodType: derivedPeriodType,
          periodDate: derivedPeriodDate,
          evaluationItemsData: JSON.stringify(evaluationItems),
          overallRating,
          managerComments: overallComment,
          status
        }
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        evaluationId: evaluation.id,
        userId,
        action: existingEvaluation ? 'updated' : 'created',
        newData: JSON.stringify({
          evaluationItems,
          overallRating,
          overallComment
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: evaluation,
      message: 'Evaluation saved successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error saving evaluation:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save evaluation' 
    }, { status: 500 })
  }
}