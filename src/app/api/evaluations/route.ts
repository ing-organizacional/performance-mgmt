import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'

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
    const userRole = (session.user as any).role
    const companyId = (session.user as any).companyId

    // Only managers can create evaluations
    if (userRole !== 'manager') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied - Manager role required' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { 
      employeeId, 
      evaluationItems, 
      overallRating, 
      overallComment,
      periodType = 'quarterly',
      periodDate = '2024-Q1'
    } = body

    if (!employeeId || !evaluationItems || !overallRating) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // Check if evaluation already exists for this period
    const existingEvaluation = await prisma.evaluation.findUnique({
      where: {
        employeeId_periodType_periodDate: {
          employeeId,
          periodType,
          periodDate
        }
      }
    })

    let evaluation
    if (existingEvaluation) {
      // Update existing evaluation
      evaluation = await prisma.evaluation.update({
        where: { id: existingEvaluation.id },
        data: {
          evaluationItemsData: JSON.stringify(evaluationItems),
          overallRating,
          managerComments: overallComment,
          status: 'submitted'
        }
      })
    } else {
      // Create new evaluation
      evaluation = await prisma.evaluation.create({
        data: {
          employeeId,
          managerId: userId,
          companyId,
          periodType,
          periodDate,
          evaluationItemsData: JSON.stringify(evaluationItems),
          overallRating,
          managerComments: overallComment,
          status: 'submitted'
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