import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'

// GET /api/admin/cycles/[id] - Get specific cycle details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const userRole = (session.user as any).role
    const companyId = (session.user as any).companyId

    // Only HR can access cycle details
    if (userRole !== 'hr') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied - HR role required' 
      }, { status: 403 })
    }

    const cycle = await prisma.performanceCycle.findFirst({
      where: {
        id: params.id,
        companyId: companyId
      },
      include: {
        closedByUser: {
          select: {
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            evaluations: true,
            evaluationItems: true,
            partialAssessments: true
          }
        }
      }
    })

    if (!cycle) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cycle not found' 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      cycle
    })
  } catch (error) {
    console.error('Error fetching cycle:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch cycle' 
    }, { status: 500 })
  }
}

// PUT /api/admin/cycles/[id] - Update cycle or change status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Only HR can update cycles (except superadmin can reopen)
    if (userRole !== 'hr') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied - HR role required' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { name, startDate, endDate, status } = body

    // Find the cycle
    const existingCycle = await prisma.performanceCycle.findFirst({
      where: {
        id: params.id,
        companyId: companyId
      }
    })

    if (!existingCycle) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cycle not found' 
      }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}
    
    if (name && name !== existingCycle.name) {
      // Check for name conflicts
      const nameConflict = await prisma.performanceCycle.findUnique({
        where: {
          companyId_name: {
            companyId,
            name
          }
        }
      })

      if (nameConflict) {
        return NextResponse.json({ 
          success: false, 
          error: 'A cycle with this name already exists' 
        }, { status: 400 })
      }

      updateData.name = name
    }

    if (startDate) updateData.startDate = new Date(startDate)
    if (endDate) updateData.endDate = new Date(endDate)

    // Handle status changes
    if (status && status !== existingCycle.status) {
      updateData.status = status

      if (status === 'closed') {
        updateData.closedBy = userId
        updateData.closedAt = new Date()
      } else if (status === 'active' && existingCycle.status === 'closed') {
        // Reopening a cycle
        updateData.closedBy = null
        updateData.closedAt = null
      }
    }

    const updatedCycle = await prisma.performanceCycle.update({
      where: { id: params.id },
      data: updateData,
      include: {
        closedByUser: {
          select: {
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            evaluations: true,
            evaluationItems: true,
            partialAssessments: true
          }
        }
      }
    })

    const actionMessage = status === 'closed' 
      ? 'Performance cycle closed successfully'
      : status === 'active' && existingCycle.status === 'closed'
      ? 'Performance cycle reopened successfully'
      : 'Performance cycle updated successfully'

    return NextResponse.json({
      success: true,
      cycle: updatedCycle,
      message: actionMessage
    })
  } catch (error) {
    console.error('Error updating cycle:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update cycle' 
    }, { status: 500 })
  }
}