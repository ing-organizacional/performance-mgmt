'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'
import { revalidatePath, revalidateTag } from 'next/cache'
import { auditBulkOperation } from '@/lib/services/audit-service'

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