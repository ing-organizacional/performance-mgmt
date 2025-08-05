import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'
import { requireHRRole } from '@/lib/auth-middleware'

interface CycleUpdateData {
  name?: string
  startDate?: Date
  endDate?: Date
  status?: string
  closedBy?: string | null
  closedAt?: Date | null
}

// GET /api/admin/cycles/[id] - Get specific cycle details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireHRRole(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { user } = authResult

  try {
    const { id } = await params

    const cycle = await prisma.performanceCycle.findFirst({
      where: {
        id,
        companyId: user.companyId
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
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireHRRole(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { user } = authResult

  try {
    const { id } = await params
    const body = await request.json() as Partial<CycleUpdateData>
    const { name, startDate, endDate, status } = body

    // Find the cycle
    const existingCycle = await prisma.performanceCycle.findFirst({
      where: {
        id,
        companyId: user.companyId
      }
    })

    if (!existingCycle) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cycle not found' 
      }, { status: 404 })
    }

    // Prepare update data
    const updateData: CycleUpdateData = {}
    
    if (name && name !== existingCycle.name) {
      // Check for name conflicts
      const nameConflict = await prisma.performanceCycle.findUnique({
        where: {
          companyId_name: {
            companyId: user.companyId,
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
        updateData.closedBy = user.id
        updateData.closedAt = new Date()
      } else if (status === 'active' && existingCycle.status === 'closed') {
        // Reopening a cycle
        updateData.closedBy = null
        updateData.closedAt = null
      }
    }

    const updatedCycle = await prisma.performanceCycle.update({
      where: { id },
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