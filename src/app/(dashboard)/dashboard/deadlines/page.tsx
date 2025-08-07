import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma-client'
import DeadlinesClient from './DeadlinesClient'

interface EmployeeEvaluationStatus {
  employeeId: string
  employeeName: string
  department: string | null
  overdueItems: OverdueItem[]
  totalOverdueCount: number
}

interface OverdueItem {
  id: string
  title: string
  type: 'okr' | 'competency'
  level: 'company' | 'department' | 'manager'
  evaluationDeadline: string | null
  daysOverdue: number
}

interface ManagerGroup {
  managerId: string
  managerName: string
  department: string | null
  employees: EmployeeEvaluationStatus[]
  totalOverdueEmployees: number
  totalOverdueItems: number
}

async function getManagerEvaluationData(companyId: string) {
  const now = new Date()
  
  // Get all employees with their managers
  const employees = await prisma.user.findMany({
    where: {
      companyId,
      role: { in: ['employee', 'manager'] }
    },
    select: {
      id: true,
      name: true,
      department: true,
      managerId: true,
      manager: {
        select: {
          id: true,
          name: true,
          department: true
        }
      }
    }
  })

  // Get all active evaluation items with deadlines
  const evaluationItems = await prisma.evaluationItem.findMany({
    where: {
      companyId,
      active: true,
      evaluationDeadline: { not: null }
    },
    select: {
      id: true,
      title: true,
      type: true,
      level: true,
      evaluationDeadline: true,
      individualAssignments: {
        select: {
          employeeId: true
        }
      }
    }
  })

  // Get all evaluations to see what's been completed
  const completedEvaluations = await prisma.evaluation.findMany({
    where: {
      companyId
    },
    select: {
      employeeId: true,
      evaluationItemsData: true
    }
  })

  // Create a map of completed items per employee
  const completedItemsByEmployee = new Map<string, Set<string>>()
  
  completedEvaluations.forEach(evaluation => {
    if (!completedItemsByEmployee.has(evaluation.employeeId)) {
      completedItemsByEmployee.set(evaluation.employeeId, new Set())
    }
    
    // Parse the evaluation items data to see which items are completed
    try {
      const evaluationData = JSON.parse(evaluation.evaluationItemsData)
      if (Array.isArray(evaluationData)) {
        evaluationData.forEach((item: any) => {
          if (item.rating && item.rating > 0) {
            completedItemsByEmployee.get(evaluation.employeeId)?.add(item.id)
          }
        })
      }
    } catch (error) {
      // Skip invalid JSON data
    }
  })

  // Build manager groups with their employees' overdue evaluations
  const managerGroups = new Map<string, ManagerGroup>()

  employees.forEach(employee => {
    // Skip if no manager
    if (!employee.manager) return

    const managerId = employee.manager.id
    const managerName = employee.manager.name

    // Initialize manager group if not exists
    if (!managerGroups.has(managerId)) {
      managerGroups.set(managerId, {
        managerId,
        managerName,
        department: employee.manager.department,
        employees: [],
        totalOverdueEmployees: 0,
        totalOverdueItems: 0
      })
    }

    // Find overdue items for this employee
    const overdueItems: OverdueItem[] = []
    const completedItems = completedItemsByEmployee.get(employee.id) || new Set()

    evaluationItems.forEach(item => {
      const isOverdue = item.evaluationDeadline && new Date(item.evaluationDeadline) < now
      if (!isOverdue) return

      // Check if this item applies to this employee
      const appliesToEmployee = 
        item.level === 'company' || // Company items apply to all
        (item.level === 'department' && item.individualAssignments.some(a => a.employeeId === employee.id)) ||
        (item.level === 'manager' && item.individualAssignments.some(a => a.employeeId === employee.id))

      if (appliesToEmployee && !completedItems.has(item.id)) {
        const daysOverdue = Math.floor((now.getTime() - new Date(item.evaluationDeadline!).getTime()) / (1000 * 60 * 60 * 24))
        
        overdueItems.push({
          id: item.id,
          title: item.title,
          type: item.type as 'okr' | 'competency',
          level: item.level as 'company' | 'department' | 'manager',
          evaluationDeadline: item.evaluationDeadline!.toISOString(),
          daysOverdue
        })
      }
    })

    // If employee has overdue items, add to manager group
    if (overdueItems.length > 0) {
      const employeeStatus: EmployeeEvaluationStatus = {
        employeeId: employee.id,
        employeeName: employee.name,
        department: employee.department,
        overdueItems,
        totalOverdueCount: overdueItems.length
      }

      const managerGroup = managerGroups.get(managerId)!
      managerGroup.employees.push(employeeStatus)
      managerGroup.totalOverdueEmployees++
      managerGroup.totalOverdueItems += overdueItems.length
    }
  })

  // Filter to only include managers who have employees with overdue items
  const managersWithOverdueEmployees = Array.from(managerGroups.values())
    .filter(group => group.employees.length > 0)

  return {
    managerGroups: managersWithOverdueEmployees,
    totalOverdueEmployees: managersWithOverdueEmployees.reduce((sum, group) => sum + group.totalOverdueEmployees, 0),
    totalOverdueItems: managersWithOverdueEmployees.reduce((sum, group) => sum + group.totalOverdueItems, 0)
  }
}

export default async function DeadlinesPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Only HR can access this page
  if (session.user.role !== 'hr') {
    redirect('/dashboard')
  }

  const companyId = session.user.companyId
  if (!companyId) {
    redirect('/login')
  }

  // Fetch manager evaluation data from database
  const { managerGroups, totalOverdueEmployees, totalOverdueItems } = await getManagerEvaluationData(companyId)

  return (
    <DeadlinesClient 
      managerGroups={managerGroups}
      totalOverdueEmployees={totalOverdueEmployees}
      totalOverdueItems={totalOverdueItems}
    />
  )
}