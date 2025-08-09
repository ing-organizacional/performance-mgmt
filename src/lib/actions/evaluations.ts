'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache'
import { auditEvaluation, auditBulkOperation } from '@/lib/services/audit-service'
import { toISOStringSafe } from '@/lib/utils/date'

// Server action to assign company-wide item to all employees and reopen completed evaluations
export async function assignCompanyItemToAllEmployees(itemId: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only HR can assign company-wide items
    if (userRole !== 'hr') {
      return { success: false, error: 'Access denied - HR role required' }
    }

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
      evaluationItemId: itemId,
      employeeId: employee.id,
      companyId,
      assignedBy: session.user.id
    }))

    await prisma.evaluationItemAssignment.createMany({
      data: assignments
    })

    // Audit the bulk operation
    await auditBulkOperation(
      session.user.id,
      session.user.role,
      companyId,
      'assign_company_item',
      employees.length,
      { itemId, employeeCount: employees.length }
    )

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

    revalidatePath('/evaluations/assignments')
    revalidatePath('/dashboard/company-items')
    revalidatePath('/evaluations')
    revalidateTag('evaluation-items') // Invalidate cached evaluation items
    return { success: true, assignedCount: assignments.length }

  } catch (error) {
    console.error('Error assigning company item to all employees:', error)
    return { success: false, error: 'Failed to assign company item to all employees' }
  }
}

// Server action to assign evaluation items to employees
export async function assignItemsToEmployees(itemId: string, employeeIds: string[]) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only managers and HR can assign items
    if (userRole !== 'manager' && userRole !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    // Create assignments for each employee
    const assignments = employeeIds.map(employeeId => ({
      evaluationItemId: itemId,
      employeeId,
      companyId,
      assignedBy: session.user.id,
      assignedAt: new Date()
    }))

    await prisma.evaluationItemAssignment.createMany({
      data: assignments
    })

    revalidatePath('/evaluations/assignments')
    return { success: true }

  } catch (error) {
    console.error('Error assigning items:', error)
    return { success: false, error: 'Failed to assign items' }
  }
}

// Server action to unassign evaluation items from employees
export async function unassignItemsFromEmployees(itemId: string, employeeIds: string[]) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only managers and HR can unassign items
    if (userRole !== 'manager' && userRole !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    // Delete assignments
    await prisma.evaluationItemAssignment.deleteMany({
      where: {
        evaluationItemId: itemId,
        employeeId: { in: employeeIds },
        companyId
      }
    })

    revalidatePath('/evaluations/assignments')
    return { success: true }

  } catch (error) {
    console.error('Error unassigning items:', error)
    return { success: false, error: 'Failed to unassign items' }
  }
}

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
      
      const now = new Date()
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
      if (deadlineDate <= oneHourFromNow) {
        return { success: false, error: 'Deadline must be at least 1 hour in the future' }
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

// Server action to update evaluation item
export async function updateEvaluationItem(itemId: string, formData: {
  title: string
  description: string
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

    // Only managers and HR can update items
    if (userRole !== 'manager' && userRole !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    const { title, description, evaluationDeadline } = formData

    if (!title?.trim() || !description?.trim()) {
      return { success: false, error: 'Title and description are required' }
    }

    // Validate deadline if provided
    let deadlineDate = null
    if (evaluationDeadline) {
      deadlineDate = new Date(evaluationDeadline)
      if (isNaN(deadlineDate.getTime())) {
        return { success: false, error: 'Invalid deadline date format' }
      }
      
      const now = new Date()
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
      if (deadlineDate <= oneHourFromNow) {
        return { success: false, error: 'Deadline must be at least 1 hour in the future' }
      }
    }

    // Update the item
    await prisma.evaluationItem.update({
      where: { 
        id: itemId,
        companyId // Ensure user can only update items from their company
      },
      data: {
        title: title.trim(),
        description: description.trim(),
        evaluationDeadline: deadlineDate,
        deadlineSetBy: deadlineDate ? userId : null
      }
    })

    revalidatePath('/evaluations/assignments')
    revalidatePath('/dashboard/company-items')
    revalidateTag('evaluation-items') // Invalidate cached evaluation items
    return { success: true }

  } catch (error) {
    console.error('Error updating evaluation item:', error)
    return { success: false, error: 'Failed to update evaluation item' }
  }
}

// Server action to get evaluation by ID
export async function getEvaluation(evaluationId: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id
    const userRole = session.user.role
    const companyId = session.user.companyId

    // Managers and HR can access evaluations
    if (userRole !== 'manager' && userRole !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    const evaluation = await prisma.evaluation.findFirst({
      where: { 
        id: evaluationId,
        companyId,
        // Managers can only see their own evaluations, HR can see all
        ...(userRole === 'manager' && { managerId: userId })
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!evaluation) {
      return { success: false, error: 'Evaluation not found' }
    }

    return { success: true, data: evaluation }

  } catch (error) {
    console.error('Error fetching evaluation:', error)
    return { success: false, error: 'Failed to fetch evaluation' }
  }
}

// Server action to get team data (for finding existing evaluations)
export async function getTeamData() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id
    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only managers and HR can access team data
    if (userRole !== 'manager' && userRole !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }


    // Get team members with their evaluations
    const teamMembers = await prisma.user.findMany({
      where: {
        companyId,
        role: { in: ['employee', 'manager'] },
        ...(userRole === 'manager' ? { managerId: userId } : {})
      },
      select: {
        id: true,
        name: true,
        email: true,
        evaluationsReceived: {
          where: userRole === 'hr' ? {} : {
            managerId: userId
          },
          orderBy: {
            updatedAt: 'desc'
          },
          take: 1,
          select: {
            id: true,
            status: true,
            createdAt: true,
            overallRating: true
          }
        }
      }
    })


    return { success: true, employees: teamMembers }

  } catch (error) {
    console.error('Error fetching team data:', error)
    return { success: false, error: 'Failed to fetch team data' }
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

// Server action to autosave evaluation as draft
export async function autosaveEvaluation(formData: {
  employeeId: string
  evaluationItems: Array<{
    id: string
    title: string
    description: string
    type: 'okr' | 'competency'
    rating: number | null
    comment: string
  }>
  overallRating?: number | null
  overallComment?: string
  periodType?: string
  periodDate?: string
}) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id
    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only managers and HR can create evaluations
    if (userRole !== 'manager' && userRole !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    const { 
      employeeId, 
      evaluationItems, 
      overallRating, 
      overallComment,
      periodType,
      periodDate
    } = formData

    if (!employeeId || !evaluationItems) {
      return { success: false, error: 'Missing required fields' }
    }

    // Get active cycle to derive period values
    const activeCycle = await prisma.performanceCycle.findFirst({
      where: {
        companyId: session.user.companyId,
        status: 'active'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
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

    // Check if evaluation already exists for this period
    const existingEvaluation = await prisma.evaluation.findFirst({
      where: {
        employeeId,
        managerId: userId,
        periodType: derivedPeriodType,
        periodDate: derivedPeriodDate,
        companyId
      }
    })

    let evaluation
    if (existingEvaluation && existingEvaluation.status === 'draft') {
      // Update existing draft evaluation
      evaluation = await prisma.evaluation.update({
        where: { id: existingEvaluation.id },
        data: {
          evaluationItemsData: JSON.stringify(evaluationItems),
          overallRating,
          managerComments: overallComment,
          updatedAt: new Date()
        }
      })
    } else if (!existingEvaluation) {
      // Create new evaluation as draft
      evaluation = await prisma.evaluation.create({
        data: {
          employeeId,
          managerId: userId,
          companyId,
          periodType: derivedPeriodType,
          periodDate: derivedPeriodDate,
          evaluationItemsData: JSON.stringify(evaluationItems),
          overallRating,
          managerComments: overallComment,
          status: 'draft'
        }
      })
    } else {
      // Don't modify submitted or completed evaluations
      return { success: false, error: 'Cannot modify submitted or completed evaluation' }
    }

    return { success: true, evaluationId: evaluation.id }

  } catch (error) {
    console.error('Error autosaving evaluation:', error)
    return { success: false, error: 'Failed to save evaluation' }
  }
}

// Server action to submit evaluation for approval
export async function submitEvaluation(evaluationId: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id
    const companyId = session.user.companyId

    // Get the evaluation
    const evaluation = await prisma.evaluation.findFirst({
      where: {
        id: evaluationId,
        companyId
      }
    })

    if (!evaluation) {
      return { success: false, error: 'Evaluation not found' }
    }

    // Only the manager who created it can submit
    if (evaluation.managerId !== userId) {
      return { success: false, error: 'Only the assigned manager can submit this evaluation' }
    }

    // Check if evaluation is in draft status
    if (evaluation.status !== 'draft') {
      return { success: false, error: 'Only draft evaluations can be submitted' }
    }

    // Validate all items are complete (have rating and comment)
    if (evaluation.evaluationItemsData) {
      try {
        const items = JSON.parse(evaluation.evaluationItemsData)
        const allComplete = items.every((item: { rating?: number; comment?: string }) => 
          item.rating !== null && 
          item.rating !== undefined && 
          item.comment && 
          item.comment.trim() !== ''
        )

        if (!allComplete) {
          return { success: false, error: 'All evaluation items must have ratings and comments before submission' }
        }
      } catch {
        return { success: false, error: 'Invalid evaluation data format' }
      }
    }

    // Update status to submitted
    await prisma.evaluation.update({
      where: { id: evaluationId },
      data: { 
        status: 'submitted',
        updatedAt: new Date()
      }
    })

    // Create audit log entry using new service
    await auditEvaluation(
      userId,
      session.user.role,
      companyId,
      'submit',
      evaluationId,
      evaluation.employeeId,
      { status: 'draft' },
      { status: 'submitted' }
    )

    revalidatePath('/evaluations')
    revalidatePath(`/evaluate/${evaluation.employeeId}`)
    return { success: true }

  } catch (error) {
    console.error('Error submitting evaluation:', error)
    return { success: false, error: 'Failed to submit evaluation' }
  }
}

// Server action for employee to approve evaluation
export async function approveEvaluation(evaluationId: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id
    const companyId = session.user.companyId

    // Get the evaluation
    const evaluation = await prisma.evaluation.findFirst({
      where: {
        id: evaluationId,
        companyId
      }
    })

    if (!evaluation) {
      return { success: false, error: 'Evaluation not found' }
    }

    // Only the employee being evaluated can approve
    if (evaluation.employeeId !== userId) {
      return { success: false, error: 'Only the employee being evaluated can approve this evaluation' }
    }

    // Check if evaluation is in submitted status
    if (evaluation.status !== 'submitted') {
      return { success: false, error: 'Only submitted evaluations can be approved' }
    }

    // Update status to completed
    await prisma.evaluation.update({
      where: { id: evaluationId },
      data: { 
        status: 'completed',
        updatedAt: new Date()
      }
    })

    // Create audit log entry using new service
    await auditEvaluation(
      userId,
      session.user.role,
      companyId,
      'approve',
      evaluationId,
      evaluation.employeeId,
      { status: 'submitted' },
      { status: 'completed' }
    )

    revalidatePath('/my-evaluations')
    revalidatePath('/evaluations')
    revalidatePath('/dashboard')
    return { success: true }

  } catch (error) {
    console.error('Error approving evaluation:', error)
    return { success: false, error: 'Failed to approve evaluation' }
  }
}

// Server action to get reopened evaluations count for direct reports only
export async function getReopenedEvaluationsCount() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id
    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only managers and HR can check their reopened evaluations
    if (userRole !== 'manager' && userRole !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    // Get active performance cycle to determine current period
    const activeCycle = await prisma.performanceCycle.findFirst({
      where: {
        companyId,
        status: 'active'
      }
    })

    if (!activeCycle) {
      return { success: true, count: 0 }
    }

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

    // Get count of draft evaluations that were genuinely reopened (had previous work done)
    // We check for drafts that were updated in the last 24 hours as a heuristic for reopened evaluations
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    // Get evaluations that were potentially reopened (only for current period)
    const potentiallyReopenedEvaluations = await prisma.evaluation.findMany({
      where: {
        managerId: userId, // Always filter by direct reports
        companyId,
        status: 'draft',
        periodType,
        periodDate,
        updatedAt: {
          gte: oneDayAgo
        },
        evaluationItemsData: {
          not: null
        }
      },
      select: {
        id: true,
        status: true,
        evaluationItemsData: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })



    // Filter to only include evaluations that have actual rating/comment data
    const reopenedCount = potentiallyReopenedEvaluations.filter(evaluation => {
      if (!evaluation.evaluationItemsData) return false
      
      try {
        const items = JSON.parse(evaluation.evaluationItemsData)
        
        // Check if any item has a rating or meaningful comment
        const hasActualData = items.some((item: { rating?: number | null; comment?: string }) => 
          item.rating !== null && item.rating !== undefined ||
          (item.comment && item.comment.trim().length > 0)
        )
        
        // Also ensure this wasn't just created (significant time difference between created and updated)
        const timeDifference = new Date(evaluation.updatedAt).getTime() - new Date(evaluation.createdAt).getTime()
        const hasSignificantTimeDifference = timeDifference > 5 * 60 * 1000 // More than 5 minutes
        
        return hasActualData && hasSignificantTimeDifference
      } catch {
        return false
      }
    }).length

    return { success: true, count: reopenedCount }

  } catch (error) {
    console.error('Error getting reopened evaluations count:', error)
    return { success: false, error: 'Failed to get reopened evaluations count' }
  }
}

// Server action for HR to unlock evaluation (move back to draft)
export async function unlockEvaluation(evaluationId: string, reason?: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id
    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only HR can unlock evaluations
    if (userRole !== 'hr') {
      return { success: false, error: 'Only HR can unlock evaluations' }
    }

    // Get the evaluation
    const evaluation = await prisma.evaluation.findFirst({
      where: {
        id: evaluationId,
        companyId
      }
    })

    if (!evaluation) {
      return { success: false, error: 'Evaluation not found' }
    }

    // Can only unlock submitted evaluations
    if (evaluation.status !== 'submitted') {
      return { success: false, error: 'Only submitted evaluations can be unlocked' }
    }

    // Update status back to draft
    await prisma.evaluation.update({
      where: { id: evaluationId },
      data: { 
        status: 'draft',
        updatedAt: new Date()
      }
    })

    // Create audit log entry using new service
    await auditEvaluation(
      userId,
      session.user.role,
      companyId,
      'unlock',
      evaluationId,
      evaluation.employeeId,
      { status: 'submitted' },
      { status: 'draft', unlockedBy: userId },
      reason
    )

    revalidatePath('/evaluations')
    revalidatePath('/dashboard')
    return { success: true }

  } catch (error) {
    console.error('Error unlocking evaluation:', error)
    return { success: false, error: 'Failed to unlock evaluation' }
  }
}


