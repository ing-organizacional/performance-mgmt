/**
 * Evaluation Items - CRUD Operations
 * 
 * This file contains Create, Read, Update, and Toggle operations for evaluation items.
 * These are the primary operations for managing evaluation items throughout their lifecycle.
 * 
 * Functions included:
 * - createEvaluationItem: Creates new evaluation items with proper validation and assignments
 * - updateEvaluationItem: Updates existing evaluation items with permission checks
 * - getEvaluationItems: Retrieves evaluation items for specific employees
 * - toggleEvaluationItemActive: Activates/deactivates evaluation items
 */

'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { toISOStringSafe } from '@/lib/utils/date'
import { 
  validateDeadline, 
  checkItemPermission, 
  handleItemDeactivation,
  handleItemReactivation,
  createItemAuditLog
} from './evaluation-items-utils'
import type { CreateEvaluationItemData, UpdateEvaluationItemData, EvaluationItemResult, EvaluationItemWithCreator } from './evaluation-items-types'

/**
 * Server action to create new evaluation item
 */
export async function createEvaluationItem(formData: CreateEvaluationItemData): Promise<EvaluationItemResult> {
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
      const validation = await validateDeadline(evaluationDeadline)
      if (!validation.isValid) {
        return { success: false, error: validation.error }
      }
      deadlineDate = validation.date
    }

    // Get user info for assignedTo field
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { department: true }
    })

    let assignedTo: string | null = null
    if (level === 'department' && user?.department) {
      assignedTo = user.department
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
        assignedTo: assignedTo || undefined,
        sortOrder,
        active: true,
        evaluationDeadline: deadlineDate,
        deadlineSetBy: deadlineDate ? userId : null
      }
    })

    // Audit log for item creation
    await createItemAuditLog(
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
      }
    )

    // Handle automatic assignment and evaluation reopening based on level
    if (level === 'company') {
      await handleCompanyWideAssignment(newItem, userId, companyId, activeCycle)
    } else if (level === 'department' && assignedTo) {
      await handleDepartmentAssignment(newItem, userId, companyId, assignedTo)
    }

    // Targeted cache invalidation - only affect this company
    revalidateTag(`company-${companyId}`)
    revalidatePath('/evaluations/assignments')
    revalidatePath('/dashboard/company-items')
    revalidatePath('/evaluations')
    return { success: true }

  } catch (error) {
    console.error('Error creating evaluation item:', error)
    return { success: false, error: 'Failed to create evaluation item' }
  }
}

/**
 * Handles assignment of company-wide items to all employees
 */
async function handleCompanyWideAssignment(
  newItem: { id: string }, 
  userId: string, 
  companyId: string, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _activeCycle: { id: string; name: string }
) {
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

    // Import and call the robust reopening function
    const { reopenEvaluationsForNewItems } = await import('./evaluation-workflow')
    const employeeIds = employees.map(emp => emp.id)
    await reopenEvaluationsForNewItems(employeeIds, 'New company-wide item added')

  } catch (error) {
    console.error('Error handling company-wide item assignment:', error)
  }
}

/**
 * Handles assignment of department-level items to department employees
 */
async function handleDepartmentAssignment(
  newItem: { id: string }, 
  userId: string, 
  companyId: string, 
  departmentName: string
) {
  try {
    // Get all employees in the department
    const employees = await prisma.user.findMany({
      where: {
        companyId,
        department: departmentName,
        role: { in: ['employee', 'manager'] }
      },
      select: { id: true }
    })

    if (employees.length === 0) {
      console.log(`No employees found in department: ${departmentName}`)
      return
    }

    // Create assignments for all department employees
    const assignments = employees.map(employee => ({
      evaluationItemId: newItem.id,
      employeeId: employee.id,
      companyId,
      assignedBy: userId
    }))

    await prisma.evaluationItemAssignment.createMany({
      data: assignments
    })

    // Import and call the robust reopening function for department employees
    const { reopenEvaluationsForNewItems } = await import('./evaluation-workflow')
    const employeeIds = employees.map(emp => emp.id)
    await reopenEvaluationsForNewItems(employeeIds, `New department OKR/Competency added for ${departmentName}`)

  } catch (error) {
    console.error('Error handling department item assignment:', error)
  }
}

/**
 * Server action to update evaluation item (enhanced with full API functionality)
 */
export async function updateEvaluationItem(
  itemId: string, 
  formData: UpdateEvaluationItemData,
  isActiveToggle: boolean = false
): Promise<EvaluationItemResult> {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id
    const userRole = session.user.role
    const companyId = session.user.companyId

    const { title, description, evaluationDeadline, active } = formData

    // Find the existing item to validate permissions
    const existingItem = await prisma.evaluationItem.findFirst({
      where: {
        id: itemId,
        companyId
      }
    })

    if (!existingItem) {
      return { success: false, error: 'Evaluation item not found' }
    }

    // Permission check based on role and item level
    const permissionCheck = await checkItemPermission(
      userRole,
      userId,
      existingItem.level,
      existingItem.createdBy,
      existingItem.assignedTo || undefined,
      session.user.department
    )

    if (!permissionCheck.hasPermission) {
      return { success: false, error: permissionCheck.error }
    }

    // Validate deadline if provided
    let deadlineDate = null
    if (evaluationDeadline !== undefined) {
      if (evaluationDeadline === null || evaluationDeadline === '') {
        deadlineDate = null
      } else {
        const validation = await validateDeadline(evaluationDeadline)
        if (!validation.isValid) {
          return { success: false, error: validation.error }
        }
        deadlineDate = validation.date
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

    // Handle reactivation logic
    if (active === true && existingItem.active === false) {
      await handleItemReactivation(existingItem, userId, companyId, userRole)
    }

    // Update the item
    await prisma.evaluationItem.update({
      where: { id: itemId },
      data: updateData
    })

    // Audit log for item update
    await createItemAuditLog(
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
        evaluationDeadline: toISOStringSafe(updateData.evaluationDeadline ?? existingItem.evaluationDeadline),
        active: updateData.active ?? existingItem.active
      }
    )

    // Targeted cache invalidation - only affect this company
    revalidateTag('company-items')
    revalidatePath('/evaluations/assignments')
    revalidatePath('/dashboard/company-items')
    revalidatePath('/evaluations')
    return { success: true }

  } catch (error) {
    console.error('Error updating evaluation item:', error)
    return { success: false, error: 'Failed to update evaluation item' }
  }
}

/**
 * Cached database query for evaluation items
 */
const getCachedEvaluationItemsForEmployee = unstable_cache(
  async (employeeId: string, companyId: string) => {
    // Check if employee exists
    const employee = await prisma.user.findFirst({
      where: {
        id: employeeId,
        companyId
      },
      select: {
        id: true,
        department: true
      }
    })

    if (!employee) {
      return []
    }

    // Build OR conditions for items assigned to this employee
    const orConditions = [
      // Company-wide items (automatically assigned to all employees)
      { level: 'company' },
      // Individual assignments (for items explicitly assigned through the assignments interface)
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
      } as { level: string; assignedTo: string })
    }

    // Get evaluation items assigned to this employee or general company items
    return await prisma.evaluationItem.findMany({
      where: {
        companyId,
        active: true,
        archivedAt: null, // Explicit archive protection
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
    tags: ['evaluation-items', 'company-items'],
    revalidate: 60 // Cache for 1 minute
  }
)

/**
 * Server action to get evaluation items for employee
 */
export async function getEvaluationItems(employeeId: string): Promise<EvaluationItemResult & { items?: EvaluationItemWithCreator[] }> {
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
        level: 'department',
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

    return { success: true, items }

  } catch (error) {
    console.error('Error getting evaluation items:', error)
    return { success: false, error: 'Failed to retrieve evaluation items' }
  }
}

/**
 * Server action to toggle evaluation item active status
 */
export async function toggleEvaluationItemActive(itemId: string): Promise<EvaluationItemResult> {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current item status
    const currentItem = await prisma.evaluationItem.findUnique({
      where: { id: itemId },
      select: { active: true }
    })

    if (!currentItem) {
      return { success: false, error: 'Item not found' }
    }

    // Toggle the active status
    const newActiveStatus = !currentItem.active
    
    // Use the update function to handle the toggle
    return await updateEvaluationItem(itemId, { active: newActiveStatus }, true)

  } catch (error) {
    console.error('Error toggling evaluation item status:', error)
    return { success: false, error: 'Failed to toggle item status' }
  }
}