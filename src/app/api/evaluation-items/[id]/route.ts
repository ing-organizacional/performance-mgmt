import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'

// PUT /api/evaluation-items/[id] - Update evaluation item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const { id } = await params
    
    const userRole = session.user.role
    
    // Only managers and HR can edit items
    if (userRole !== 'manager' && userRole !== 'hr') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied - Manager or HR role required' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { title, description } = body

    if (!title || !description) {
      return NextResponse.json({ 
        success: false, 
        error: 'Title and description are required' 
      }, { status: 400 })
    }

    // Check if item exists and user can edit it
    const existingItem = await prisma.evaluationItem.findUnique({
      where: { id }
    })

    if (!existingItem) {
      return NextResponse.json({ 
        success: false, 
        error: 'Evaluation item not found' 
      }, { status: 404 })
    }

    // Permission check based on role and item level
    if (userRole === 'hr') {
      // HR can edit everything
    } else if (userRole === 'manager') {
      // Managers can only edit department and manager level items
      if (existingItem.level === 'company') {
        return NextResponse.json({ 
          success: false, 
          error: 'Company-level items can only be edited by HR' 
        }, { status: 403 })
      }
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Insufficient permissions' 
      }, { status: 403 })
    }

    // Update the item
    const updatedItem = await prisma.evaluationItem.update({
      where: { id },
      data: {
        title,
        description
      }
    })

    // Note: Audit logging for evaluation items could be implemented with a separate audit table if needed

    return NextResponse.json({
      success: true,
      data: updatedItem,
      message: 'Evaluation item updated successfully'
    })

  } catch (error) {
    console.error('Error updating evaluation item:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update evaluation item' 
    }, { status: 500 })
  }
}