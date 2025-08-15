'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache'
import { toISOStringSafe } from '@/lib/utils/date'
import { auditEvaluationItem } from '@/lib/services/audit-service'

// Server action to create new evaluation item
export async function createEvaluationItem(formData: {
  title: string
  description: string
  type: 'okr' | 'competency'
  level: 'company' | 'department' | 'manager'
  evaluationDeadline?: string
}) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id
    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only managers and HR can create items
    if (userRole !== 'manager' && userRole !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    const { title, description, type, level, evaluationDeadline } = formData

    if (!title?.trim() || !description?.trim()) {
      return { success: false, error: 'Title and description are required' }
    }

    // Permission check
    if (userRole === 'manager' && level === 'company') {
      return { success: false, error: 'Only HR can create company-level items' }
    }

    // Validate deadline if provided
    let deadlineDate = null
    if (evaluationDeadline) {
      deadlineDate = new Date(evaluationDeadline)
      if (isNaN(deadlineDate.getTime())) {
        return { success: false, error: 'Invalid deadline date format' }
      }
      
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset to start of today
      if (deadlineDate <= today) {
        return { success: false, error: 'Deadline must be tomorrow or later' }
      }
    }

    // Get user info for assignedTo field
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { department: true }
    })

    let assignedTo = null
    if (level === 'department' && user?.department) {
      assignedTo = user.department
    } else if (level === 'manager') {
      assignedTo = userId
    }

    // Get the active performance cycle (required for all evaluation items)
    const activeCycle = await prisma.performanceCycle.findFirst({
      where: {
        companyId,
        status: 'active'
      }
    })

    if (!activeCycle) {
      return { success: false, error: 'No active performance cycle found. Please contact HR to create one.' }
    }

    // Get the next sort order
    const lastItem = await prisma.evaluationItem.findFirst({
      where: { companyId },
      orderBy: { sortOrder: 'desc' }
    })
    const sortOrder = (lastItem?.sortOrder || 0) + 1

    // Create the item
    const newItem = await prisma.evaluationItem.create({
      data: {
        companyId,
        cycleId: activeCycle.id,
        title: title.trim(),
        description: description.trim(),
        type,
        level,
        createdBy: userId,
        assignedTo,
        sortOrder,
        active: true,
        evaluationDeadline: deadlineDate,
        deadlineSetBy: deadlineDate ? userId : null
      }
    })

    // Audit log for item creation
    await auditEvaluationItem(
      userId,
      userRole,
      companyId,
      'create',
      newItem.id,
      null,
      {
        title: newItem.title,
        description: newItem.description,
        type: newItem.type,
        level: newItem.level,
        evaluationDeadline: toISOStringSafe(newItem.evaluationDeadline),
        active: newItem.active
      },
      `Created ${type} item at ${level} level`
    )

    // If it's a company-wide item, automatically assign to all employees and reopen completed evaluations
    if (level === 'company') {
      try {
        // Get all employees in the company
        const employees = await prisma.user.findMany({
          where: {
            companyId,
            role: { in: ['employee', 'manager'] }
          },
          select: { id: true }
        })

        // Create assignments for all employees
        const assignments = employees.map(employee => ({
          evaluationItemId: newItem.id,
          employeeId: employee.id,
          companyId,
          assignedBy: userId
        }))

        await prisma.evaluationItemAssignment.createMany({
          data: assignments
        })

        // Get active performance cycle
        const activeCycle = await prisma.performanceCycle.findFirst({
          where: {
            companyId,
            status: 'active'
          }
        })

        if (activeCycle) {
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

          // Reopen all completed evaluations in the current period
          await prisma.evaluation.updateMany({
            where: {
              companyId,
              status: 'completed',
              periodType,
              periodDate
            },
            data: {
              status: 'draft',
              updatedAt: new Date()
            }
          })

            }

      } catch (error) {
        console.error('Error handling company-wide item assignment:', error)
        // Don't fail the whole creation, just log the error
      }
    }

    revalidatePath('/evaluations/assignments')
    revalidatePath('/dashboard/company-items')
    revalidatePath('/evaluations')
    return { success: true }

  } catch (error) {
    console.error('Error creating evaluation item:', error)
    return { success: false, error: 'Failed to create evaluation item' }
  }
}

// Server action to update evaluation item (enhanced with full API functionality)
export async function updateEvaluationItem(itemId: string, formData: {
  title?: string
  description?: string
  evaluationDeadline?: string | null
  active?: boolean
}) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id
    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only managers and HR can update items
    if (userRole !== 'manager' && userRole !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    const { title, description, evaluationDeadline, active } = formData

    // Validate required fields only if provided (not for active-only toggles)
    const isActiveToggle = active !== undefined && title === undefined && description === undefined
    if (!isActiveToggle && (!title?.trim() || !description?.trim())) {
      return { success: false, error: 'Title and description are required' }
    }

    // Check if item exists and get current state
    const existingItem = await prisma.evaluationItem.findUnique({
      where: { 
        id: itemId,
        companyId
      }
    })

    if (!existingItem) {
      return { success: false, error: 'Evaluation item not found' }
    }

    // Permission check based on role and item level
    if (userRole === 'hr') {
      // HR can edit everything including deadlines
    } else if (userRole === 'manager') {
      // Managers can only edit department and manager level items
      if (existingItem.level === 'company') {
        return { success: false, error: 'Company-level items can only be edited by HR' }
      }
      
      // For deadline changes, managers can only set deadlines for items they created or manage
      if (evaluationDeadline !== undefined) {
        if (existingItem.createdBy !== userId && 
            existingItem.assignedTo !== userId && 
            existingItem.assignedTo !== session.user.department) {
          return { success: false, error: 'You can only set deadlines for items you created or manage' }
        }
      }
    }

    // Validate deadline if provided
    let deadlineDate = null
    if (evaluationDeadline !== undefined) {
      if (evaluationDeadline === null || evaluationDeadline === '') {
        deadlineDate = null
      } else {
        deadlineDate = new Date(evaluationDeadline)
        if (isNaN(deadlineDate.getTime())) {
          return { success: false, error: 'Invalid deadline date format. Please provide a valid date and time.' }
        }
        
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Reset to start of today
        if (deadlineDate <= today) {
          return { success: false, error: 'Deadline must be tomorrow or later.' }
        }

        const twoYearsFromNow = new Date(today.getTime() + 2 * 365 * 24 * 60 * 60 * 1000)
        if (deadlineDate > twoYearsFromNow) {
          return { success: false, error: 'Deadline cannot be more than 2 years in the future.' }
        }
      }
    }

    // Prepare update data
    const updateData: {
      title?: string
      description?: string
      evaluationDeadline?: Date | null
      deadlineSetBy?: string | null
      active?: boolean
    } = {}

    if (!isActiveToggle) {
      if (title !== undefined) updateData.title = title.trim()
      if (description !== undefined) updateData.description = description.trim()
    }

    if (active !== undefined) {
      updateData.active = active
    }

    if (evaluationDeadline !== undefined) {
      updateData.evaluationDeadline = deadlineDate
      updateData.deadlineSetBy = deadlineDate ? userId : null
    }

    // Handle deactivation cleanup
    if (active === false && existingItem.active === true) {
      await handleItemDeactivation(existingItem, userId, session.user.name, userRole)
    }

    // Update the item
    await prisma.evaluationItem.update({
      where: { id: itemId },
      data: updateData
    })

    // Audit log for item update
    await auditEvaluationItem(
      userId,
      userRole,
      companyId,
      'update',
      itemId,
      {
        title: existingItem.title,
        description: existingItem.description,
        evaluationDeadline: toISOStringSafe(existingItem.evaluationDeadline),
        active: existingItem.active
      },
      {
        title: updateData.title || existingItem.title,
        description: updateData.description || existingItem.description,
        evaluationDeadline: toISOStringSafe(updateData.evaluationDeadline !== undefined ? updateData.evaluationDeadline : existingItem.evaluationDeadline),
        active: updateData.active !== undefined ? updateData.active : existingItem.active
      },
      `Updated ${existingItem.level}-level ${existingItem.type} item`
    )

    revalidatePath('/evaluations/assignments')
    revalidatePath('/dashboard/company-items')
    revalidateTag('evaluation-items')
    
    const message = active === false && existingItem.active === true 
      ? 'Item deactivated and removed from all employee evaluations'
      : 'Evaluation item updated successfully'
    
    return { success: true, message }

  } catch (error) {
    console.error('Error updating evaluation item:', error)
    return { success: false, error: 'Failed to update evaluation item' }
  }
}

// Helper function to handle item deactivation cleanup
async function handleItemDeactivation(
  existingItem: { id: string; level: string; companyId: string; title: string; type: string }, 
  userId: string, 
  _userName: string, 
  userRole: string
) {
  try {
    // For company-level items, remove from all existing evaluations
    if (existingItem.level === 'company') {
      const evaluations = await prisma.evaluation.findMany({
        where: { companyId: existingItem.companyId }
      })

      for (const evaluation of evaluations) {
        if (evaluation.evaluationItemsData) {
          try {
            const items = JSON.parse(evaluation.evaluationItemsData)
            const filteredItems = items.filter((item: { id: string }) => item.id !== existingItem.id)
            
            if (filteredItems.length !== items.length) {
              await prisma.evaluation.update({
                where: { id: evaluation.id },
                data: { evaluationItemsData: JSON.stringify(filteredItems) }
              })
            }
          } catch (jsonError) {
            console.error('Error parsing evaluation JSON data:', jsonError)
          }
        }
      }
    }

    // Remove from individual assignments
    await prisma.evaluationItemAssignment.deleteMany({
      where: { evaluationItemId: existingItem.id }
    })

    // Audit log for item deactivation
    await auditEvaluationItem(
      userId,
      userRole,
      existingItem.companyId,
      'update',
      existingItem.id,
      { active: true },
      { active: false },
      `Deactivated ${existingItem.level}-level ${existingItem.type} item and removed from all employee evaluations`
    )

  } catch (error) {
    console.error('Error during deactivation cleanup:', error)
    throw error
  }
}

// Cached version of evaluation items query
const getCachedEvaluationItemsForEmployee = unstable_cache(
  async (employeeId: string, companyId: string) => {
    // Get employee details first
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { department: true, companyId: true, name: true }
    })

    // Build the OR conditions  
    const orConditions: Array<{
      level?: string
      assignedTo?: string
      individualAssignments?: {
        some: {
          employeeId: string
          companyId: string
        }
      }
    }> = [
      { level: 'company' },
      {
        individualAssignments: {
          some: {
            employeeId,
            companyId
          }
        }
      }
    ]

    // Add department items if employee has a department
    if (employee?.department) {
      orConditions.push({
        level: 'department',
        assignedTo: employee.department
      })
    }

    // Get evaluation items assigned to this employee or general company items
    return await prisma.evaluationItem.findMany({
      where: {
        companyId,
        active: true,
        OR: orConditions
      },
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
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })
  },
  ['evaluation-items'],
  {
    tags: ['evaluation-items'],
    revalidate: 60 // Cache for 1 minute
  }
)

// Server action to get evaluation items for employee
export async function getEvaluationItems(employeeId: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only managers and HR can access evaluation items
    if (userRole !== 'manager' && userRole !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    // Use cached database query
    const cachedItems = await getCachedEvaluationItemsForEmployee(employeeId, companyId)
    
    // Add manager-specific items (these can't be cached globally)
    const managerItems = await prisma.evaluationItem.findMany({
      where: {
        companyId,
        active: true,
        level: 'manager',
        assignedTo: session.user.id
      },
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
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })

    // Combine cached items with manager-specific items
    const items = [...cachedItems, ...managerItems]


    // Apply smart sorting: prioritize company-wide items created in the last 24 hours (newly created)
    const sortedItems = items.sort((a, b) => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const aIsNewCompanyItem = a.level === 'company' && new Date(a.createdAt) > oneDayAgo
      const bIsNewCompanyItem = b.level === 'company' && new Date(b.createdAt) > oneDayAgo
      
      if (aIsNewCompanyItem && !bIsNewCompanyItem) return -1
      if (!aIsNewCompanyItem && bIsNewCompanyItem) return 1
      
      // If both are new company items or neither are, sort by creation date (newest first)
      if (aIsNewCompanyItem && bIsNewCompanyItem) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      
      // Default to sortOrder for other items
      return a.sortOrder - b.sortOrder
    })

    // Transform to match expected format
    const formattedItems = sortedItems.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      type: item.type,
      level: item.level,
      rating: null,
      comment: '',
      createdBy: item.creator?.name,
      creatorRole: item.creator?.role,
      evaluationDeadline: toISOStringSafe(item.evaluationDeadline),
      deadlineSetBy: item.deadlineSetByUser?.name || null,
      deadlineSetByRole: item.deadlineSetByUser?.role || null
    }))

    return { success: true, items: formattedItems }

  } catch (error) {
    console.error('Error fetching evaluation items:', error)
    return { success: false, error: 'Failed to fetch evaluation items' }
  }
}

// Server action to toggle evaluation item active status
export async function toggleEvaluationItemActive(itemId: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current item state
    const existingItem = await prisma.evaluationItem.findUnique({
      where: { 
        id: itemId,
        companyId: session.user.companyId
      },
      select: { active: true }
    })

    if (!existingItem) {
      return { success: false, error: 'Evaluation item not found' }
    }

    // Use the enhanced updateEvaluationItem function to toggle active status
    return await updateEvaluationItem(itemId, { 
      active: !existingItem.active 
    })

  } catch (error) {
    console.error('Error toggling evaluation item active status:', error)
    return { success: false, error: 'Failed to toggle item status' }
  }
}