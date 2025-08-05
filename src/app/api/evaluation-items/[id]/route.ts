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
    const { title, description, evaluationDeadline, active } = body

    // If only toggling active status, don't require title/description
    const isActiveToggle = active !== undefined && !title && !description
    
    if (!isActiveToggle && (!title || !description)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Title and description are required' 
      }, { status: 400 })
    }

    // Validate deadline if provided
    let deadlineDate = null
    if (evaluationDeadline !== undefined) {
      if (evaluationDeadline === null || evaluationDeadline === '') {
        // Explicitly removing deadline
        deadlineDate = null
      } else {
        deadlineDate = new Date(evaluationDeadline)
        if (isNaN(deadlineDate.getTime())) {
          return NextResponse.json({ 
            success: false, 
            error: 'Invalid deadline date format. Please provide a valid date and time.' 
          }, { status: 400 })
        }
        
        // Deadline must be in the future (at least 1 hour from now)
        const now = new Date()
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
        if (deadlineDate <= oneHourFromNow) {
          return NextResponse.json({ 
            success: false, 
            error: 'Deadline must be at least 1 hour in the future.' 
          }, { status: 400 })
        }

        // Check if deadline is not too far in the future (e.g., more than 2 years)
        const twoYearsFromNow = new Date(now.getTime() + 2 * 365 * 24 * 60 * 60 * 1000)
        if (deadlineDate > twoYearsFromNow) {
          return NextResponse.json({ 
            success: false, 
            error: 'Deadline cannot be more than 2 years in the future.' 
          }, { status: 400 })
        }
      }
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
      // HR can edit everything including deadlines
    } else if (userRole === 'manager') {
      // Managers can only edit department and manager level items
      if (existingItem.level === 'company') {
        return NextResponse.json({ 
          success: false, 
          error: 'Company-level items can only be edited by HR' 
        }, { status: 403 })
      }
      
      // For deadline changes, managers can only set deadlines for items they created or are assigned to manage
      if (evaluationDeadline !== undefined) {
        // Check if manager created this item or if it's assigned to their department/team
        const userId = session.user.id
        if (existingItem.createdBy !== userId && 
            existingItem.assignedTo !== userId && 
            existingItem.assignedTo !== session.user.department) {
          return NextResponse.json({ 
            success: false, 
            error: 'You can only set deadlines for items you created or manage' 
          }, { status: 403 })
        }
      }
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Insufficient permissions' 
      }, { status: 403 })
    }

    // Prepare update data
    const updateData: {
      title?: string
      description?: string
      evaluationDeadline?: Date | null
      deadlineSetBy?: string | null
      active?: boolean
    } = {}

    // Only update title/description if provided (not for active-only toggles)
    if (!isActiveToggle) {
      updateData.title = title
      updateData.description = description
    }

    // Handle active status changes
    if (active !== undefined) {
      updateData.active = active
    }

    // Add deadline fields if they were provided in the request
    if (evaluationDeadline !== undefined) {
      updateData.evaluationDeadline = deadlineDate
      updateData.deadlineSetBy = deadlineDate ? session.user.id : null
    }

    // Handle deactivation - remove all existing assignments
    if (active === false && existingItem.active === true) {
      try {
        // For company-level items, we need to remove them from all existing evaluations
        if (existingItem.level === 'company') {
          // Find all evaluations that contain this item in their evaluationItemsData JSON
          const evaluations = await prisma.evaluation.findMany({
            where: {
              companyId: existingItem.companyId
            }
          })

          // Remove this item from all evaluations' JSON data
          for (const evaluation of evaluations) {
            if (evaluation.evaluationItemsData) {
              try {
                const items = JSON.parse(evaluation.evaluationItemsData)
                const filteredItems = items.filter((item: { id: string }) => item.id !== existingItem.id)
                
                if (filteredItems.length !== items.length) {
                  // Item was found and removed, update the evaluation
                  await prisma.evaluation.update({
                    where: { id: evaluation.id },
                    data: {
                      evaluationItemsData: JSON.stringify(filteredItems)
                    }
                  })
                }
              } catch (jsonError) {
                console.error('Error parsing evaluation JSON data:', jsonError)
              }
            }
          }
        }

        // Also remove from individual assignments if they exist
        await prisma.evaluationItemAssignment.deleteMany({
          where: {
            evaluationItemId: existingItem.id
          }
        })

        // Log the deactivation for audit purposes
        const auditLog = {
          timestamp: new Date().toISOString(),
          userId: session.user.id,
          userName: session.user.name,
          userRole: session.user.role,
          action: 'item_deactivated',
          itemId: id,
          itemTitle: existingItem.title,
          itemLevel: existingItem.level,
          companyId: existingItem.companyId,
          message: 'Item deactivated and removed from all employee evaluations'
        }
        console.log('AUDIT: Evaluation item deactivated:', JSON.stringify(auditLog, null, 2))

      } catch (cleanupError) {
        console.error('Error cleaning up assignments during deactivation:', cleanupError)
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to remove item assignments during deactivation' 
        }, { status: 500 })
      }
    }

    // Log deadline changes for audit purposes
    if (evaluationDeadline !== undefined && existingItem.evaluationDeadline?.toISOString() !== deadlineDate?.toISOString()) {
      const auditLog = {
        timestamp: new Date().toISOString(),
        userId: session.user.id,
        userName: session.user.name,
        userRole: session.user.role,
        action: 'deadline_changed',
        itemId: id,
        itemTitle: existingItem.title,
        oldDeadline: existingItem.evaluationDeadline?.toISOString() || null,
        newDeadline: deadlineDate?.toISOString() || null,
        companyId: existingItem.companyId
      }
      console.log('AUDIT: Evaluation item deadline changed:', JSON.stringify(auditLog, null, 2))
    }

    // Update the item
    const updatedItem = await prisma.evaluationItem.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            name: true,
            role: true
          }
        },
        deadlineSetByUser: {
          select: {
            name: true,
            role: true
          }
        }
      }
    })

    // Note: Audit logging for evaluation items could be implemented with a separate audit table if needed

    return NextResponse.json({
      success: true,
      data: {
        id: updatedItem.id,
        title: updatedItem.title,
        description: updatedItem.description,
        type: updatedItem.type,
        level: updatedItem.level,
        active: updatedItem.active,
        createdBy: updatedItem.creator.name,
        creatorRole: updatedItem.creator.role,
        evaluationDeadline: updatedItem.evaluationDeadline?.toISOString() || null,
        deadlineSetBy: updatedItem.deadlineSetByUser?.name || null,
        deadlineSetByRole: updatedItem.deadlineSetByUser?.role || null
      },
      message: active === false && existingItem.active === true 
        ? 'Item deactivated and removed from all employee evaluations'
        : 'Evaluation item updated successfully'
    })

  } catch (error) {
    console.error('Error updating evaluation item:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update evaluation item' 
    }, { status: 500 })
  }
}