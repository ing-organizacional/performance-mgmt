'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'
import { revalidatePath, revalidateTag } from 'next/cache'
import { auditBulkOperation } from '@/lib/services/audit-service'

interface EvaluationStatusResult {
  success: boolean
  error?: string
  evaluatedItems?: Record<string, boolean> // itemId -> isEvaluated
}

// Server action to check if items are evaluated by employees
export async function checkItemsEvaluationStatus(
  employeeIds: string[]
): Promise<EvaluationStatusResult> {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const companyId = session.user.companyId

    const evaluations = await prisma.evaluation.findMany({
      where: {
        employeeId: { in: employeeIds },
        companyId,
        evaluationItemsData: { not: null }
      },
      select: {
        employeeId: true,
        evaluationItemsData: true
      }
    })

    const evaluatedItems: Record<string, boolean> = {}

    for (const evaluation of evaluations) {
      if (evaluation.evaluationItemsData) {
        try {
          const items = JSON.parse(evaluation.evaluationItemsData) as Array<{
            id: string
            rating?: number | null
            comment?: string
          }>
          
          items.forEach(item => {
            const key = `${item.id}-${evaluation.employeeId}`
            evaluatedItems[key] = item.rating != null || 
              (item.comment != null && item.comment.trim().length > 0)
          })
        } catch (error) {
          console.error('Error parsing evaluation data:', error)
        }
      }
    }

    return { success: true, evaluatedItems }

  } catch (error) {
    console.error('Error checking evaluation status:', error)
    return { success: false, error: 'Failed to check evaluation status' }
  }
}

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
      assignedBy: session.user.id
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

interface UnassignResult {
  success: boolean
  error?: string
  requiresHRConfirmation?: boolean
  evaluatedEmployees?: Array<{
    id: string
    name: string
    rating: number | null
    comment: string
  }>
  blockedEmployees?: string[]
}

// Helper function to check if employees have evaluated an item
async function checkEvaluatedEmployees(
  itemId: string, 
  employeeIds: string[], 
  companyId: string
): Promise<Array<{
  id: string
  name: string
  rating: number | null
  comment: string
}>> {
  const evaluations = await prisma.evaluation.findMany({
    where: {
      employeeId: { in: employeeIds },
      companyId,
      evaluationItemsData: { not: null }
    },
    select: {
      employeeId: true,
      employee: { select: { name: true } },
      evaluationItemsData: true
    }
  })

  const evaluatedEmployees: Array<{
    id: string
    name: string
    rating: number | null
    comment: string
  }> = []

  for (const evaluation of evaluations) {
    if (evaluation.evaluationItemsData) {
      try {
        const items = JSON.parse(evaluation.evaluationItemsData) as Array<{
          id: string
          rating?: number | null
          comment?: string
        }>
        
        const evaluatedItem = items.find(item => item.id === itemId)
        if (evaluatedItem && (
          evaluatedItem.rating != null || 
          (evaluatedItem.comment && evaluatedItem.comment.trim().length > 0)
        )) {
          evaluatedEmployees.push({
            id: evaluation.employeeId,
            name: evaluation.employee.name,
            rating: evaluatedItem.rating ?? null,
            comment: evaluatedItem.comment ?? ''
          })
        }
      } catch (error) {
        console.error('Error parsing evaluation data for employee', evaluation.employeeId, error)
      }
    }
  }

  return evaluatedEmployees
}

// Helper function to clear evaluation data for specific item and employees
async function clearEvaluationDataForItem(
  itemId: string,
  employeeIds: string[],
  companyId: string
): Promise<void> {
  const evaluations = await prisma.evaluation.findMany({
    where: {
      employeeId: { in: employeeIds },
      companyId,
      evaluationItemsData: { not: null }
    }
  })

  for (const evaluation of evaluations) {
    if (evaluation.evaluationItemsData) {
      try {
        const items = JSON.parse(evaluation.evaluationItemsData) as Array<{
          id: string
          [key: string]: unknown
        }>
        
        // Remove the specific item from the evaluation data
        const updatedItems = items.filter(item => item.id !== itemId)
        
        await prisma.evaluation.update({
          where: { id: evaluation.id },
          data: {
            evaluationItemsData: JSON.stringify(updatedItems),
            updatedAt: new Date()
          }
        })
      } catch (error) {
        console.error('Error clearing evaluation data for evaluation', evaluation.id, error)
        throw error
      }
    }
  }
}

// Server action to unassign evaluation items from employees
export async function unassignItemsFromEmployees(
  itemId: string, 
  employeeIds: string[],
  forceOverride: boolean = false,
  overrideReason?: string
): Promise<UnassignResult> {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userRole = session.user.role
    const companyId = session.user.companyId
    const userId = session.user.id

    // Only managers and HR can unassign items
    if (userRole !== 'manager' && userRole !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    // Check for evaluated items
    const evaluatedEmployees = await checkEvaluatedEmployees(itemId, employeeIds, companyId)
    
    if (evaluatedEmployees.length > 0) {
      if (userRole === 'manager') {
        // BLOCK: Managers cannot unassign evaluated items
        return { 
          success: false, 
          error: `Cannot unassign: Item has been evaluated by ${evaluatedEmployees.map(e => e.name).join(', ')}. Contact HR for assistance.`,
          blockedEmployees: evaluatedEmployees.map(e => e.name)
        }
      } 
      else if (userRole === 'hr') {
        if (!forceOverride) {
          // CONFIRM: HR gets confirmation dialog
          return {
            success: false,
            requiresHRConfirmation: true,
            evaluatedEmployees
          }
        } else {
          // EXECUTE: HR confirmed override - clear evaluation data and log it
          
          // Get item details for audit log
          const item = await prisma.evaluationItem.findUnique({
            where: { id: itemId },
            select: { title: true }
          })

          // Log HR override action for each employee
          const auditLogs = evaluatedEmployees.map(employee => ({
            userId,
            userRole,
            action: 'hr_override',
            entityType: 'assignment',
            entityId: itemId,
            targetUserId: employee.id,
            oldData: {
              itemId,
              itemTitle: item?.title || 'Unknown',
              employeeId: employee.id,
              employeeName: employee.name,
              rating: employee.rating,
              comment: employee.comment
            },
            newData: {
              unassigned: true,
              evaluationDataCleared: true
            },
            reason: overrideReason || 'HR override to unassign evaluated item',
            companyId
          }))

          // Create audit logs
          await prisma.auditLog.createMany({
            data: auditLogs
          })

          // Clear evaluation data
          await clearEvaluationDataForItem(itemId, employeeIds, companyId)
        }
      }
    }

    // Standard unassignment logic
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