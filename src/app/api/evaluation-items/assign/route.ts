import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'

// POST /api/evaluation-items/assign - Bulk assign evaluation items to employees
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
    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only managers and HR can assign items
    if (userRole !== 'manager' && userRole !== 'hr') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied - Manager or HR role required' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { itemId, employeeIds } = body

    if (!itemId || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Item ID and employee IDs are required' 
      }, { status: 400 })
    }

    // Verify the evaluation item exists and manager has permission to assign it
    const item = await prisma.evaluationItem.findUnique({
      where: { id: itemId }
    })

    if (!item) {
      return NextResponse.json({ 
        success: false, 
        error: 'Evaluation item not found' 
      }, { status: 404 })
    }

    // Verify all employees belong to this manager
    const employees = await prisma.user.findMany({
      where: {
        id: { in: employeeIds },
        managerId: userId,
        companyId
      }
    })

    if (employees.length !== employeeIds.length) {
      return NextResponse.json({ 
        success: false, 
        error: 'Some employees are not under your management' 
      }, { status: 403 })
    }

    // Create assignments (using upsert to avoid duplicates)
    const assignments = await Promise.all(
      employeeIds.map(employeeId => 
        prisma.evaluationItemAssignment.upsert({
          where: {
            evaluationItemId_employeeId: {
              evaluationItemId: itemId,
              employeeId
            }
          },
          update: {
            assignedBy: userId,
            updatedAt: new Date()
          },
          create: {
            evaluationItemId: itemId,
            employeeId,
            assignedBy: userId,
            companyId
          }
        })
      )
    )

    return NextResponse.json({
      success: true,
      message: `Successfully assigned item to ${assignments.length} employee(s)`,
      assignmentsCreated: assignments.length
    })

  } catch (error) {
    console.error('Error creating assignments:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create assignments',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/evaluation-items/assign - Remove assignments
export async function DELETE(request: NextRequest) {
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
    const companyId = session.user.companyId

    // Only managers and HR can remove assignments
    if (userRole !== 'manager' && userRole !== 'hr') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied - Manager or HR role required' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { itemId, employeeIds } = body

    if (!itemId || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Item ID and employee IDs are required' 
      }, { status: 400 })
    }

    // Remove assignments
    const result = await prisma.evaluationItemAssignment.deleteMany({
      where: {
        evaluationItemId: itemId,
        employeeId: { in: employeeIds },
        assignedBy: userId, // Only allow removing assignments they created
        companyId
      }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${result.count} assignment(s)`,
      assignmentsRemoved: result.count
    })

  } catch (error) {
    console.error('Error removing assignments:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to remove assignments',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}