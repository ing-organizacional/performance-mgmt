import { prisma } from '@/lib/prisma-client'

// Maximum number of OKRs/competencies per employee (excluding overall score)
export const MAX_EVALUATION_ITEMS = 10

/**
 * Count total evaluation items assigned to an employee
 * Includes company-wide, department-wide, manager-level, and individual assignments
 */
export async function countEmployeeEvaluationItems(employeeId: string, companyId: string): Promise<number> {
  // Get employee info to determine department and manager
  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: {
      department: true,
      managerId: true
    }
  })

  if (!employee) {
    return 0
  }

  // Get all evaluation items that apply to this employee
  const [companyItems, departmentItems, managerItems, individualAssignments] = await Promise.all([
    // Company-wide items (apply to all employees)
    prisma.evaluationItem.count({
      where: {
        companyId,
        active: true,
        level: 'company'
      }
    }),

    // Department-level items
    prisma.evaluationItem.count({
      where: {
        companyId,
        active: true,
        level: 'department',
        assignedTo: employee.department
      }
    }),

    // Manager-level items
    prisma.evaluationItem.count({
      where: {
        companyId,
        active: true,
        level: 'manager',
        assignedTo: employee.managerId
      }
    }),

    // Individual assignments
    prisma.evaluationItemAssignment.count({
      where: {
        employeeId,
        companyId,
        evaluationItem: {
          active: true
        }
      }
    })
  ])

  return companyItems + departmentItems + managerItems + individualAssignments
}

/**
 * Check if adding new items would exceed the limit for specific employees
 * Used when creating company/department level items that will affect multiple employees
 */
export async function validateItemLimitForEmployees(
  employeeIds: string[], 
  companyId: string,
  additionalItemsCount: number = 1
): Promise<{
  valid: boolean
  exceededEmployees: Array<{ id: string; name: string; currentCount: number; wouldExceed: number }>
}> {
  const exceededEmployees: Array<{ id: string; name: string; currentCount: number; wouldExceed: number }> = []

  for (const employeeId of employeeIds) {
    const currentCount = await countEmployeeEvaluationItems(employeeId, companyId)
    const wouldExceed = currentCount + additionalItemsCount

    if (wouldExceed > MAX_EVALUATION_ITEMS) {
      const employee = await prisma.user.findUnique({
        where: { id: employeeId },
        select: { name: true }
      })

      exceededEmployees.push({
        id: employeeId,
        name: employee?.name || 'Unknown',
        currentCount,
        wouldExceed
      })
    }
  }

  return {
    valid: exceededEmployees.length === 0,
    exceededEmployees
  }
}

/**
 * Get all employees who would be affected by a company or department level item
 */
export async function getAffectedEmployees(
  level: 'company' | 'department' | 'manager',
  assignedTo: string | null,
  companyId: string
): Promise<string[]> {
  let whereClause: { companyId: string; active: boolean; department?: string; managerId?: string } = { companyId, active: true }

  if (level === 'company') {
    // All employees in the company
    whereClause = { companyId, active: true }
  } else if (level === 'department' && assignedTo) {
    // All employees in the specified department
    whereClause = { companyId, active: true, department: assignedTo }
  } else if (level === 'manager' && assignedTo) {
    // All employees under the specified manager
    whereClause = { companyId, active: true, managerId: assignedTo }
  }

  const employees = await prisma.user.findMany({
    where: whereClause,
    select: { id: true }
  })

  return employees.map(emp => emp.id)
}