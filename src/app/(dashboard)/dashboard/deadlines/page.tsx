import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma-client'
import DeadlinesClient from './DeadlinesClient'

interface EvaluationItemWithDeadline {
  id: string
  title: string
  description: string
  type: 'okr' | 'competency'
  level: 'company' | 'department' | 'manager'
  createdBy: string
  creatorRole: string
  evaluationDeadline: string | null
  deadlineSetBy: string | null
  deadlineSetByRole: string | null
  assignedTo?: string | null
  // For grouping
  department?: string
  managerName?: string
  employeeCount?: number
}

interface DeadlineGroup {
  id: string
  name: string
  type: 'department' | 'manager'
  items: EvaluationItemWithDeadline[]
  totalEmployees: number
  overdue: number
  dueThisWeek: number
}

async function getDeadlinesData(companyId: string) {
  // Get evaluation items for the company with deadline information
  const items = await prisma.evaluationItem.findMany({
    where: { 
      companyId,
      active: true
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
      },
      individualAssignments: {
        include: {
          employee: {
            select: {
              name: true,
              email: true,
              username: true,
              department: true
            }
          }
        }
      }
    },
    orderBy: [
      { level: 'asc' }, // company, department, manager
      { sortOrder: 'asc' }
    ]
  })

  // Transform to include assignment information and deadlines
  const formattedItems: EvaluationItemWithDeadline[] = items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    type: item.type as 'okr' | 'competency',
    level: item.level as 'company' | 'department' | 'manager',
    createdBy: item.creator.name,
    creatorRole: item.creator.role,
    evaluationDeadline: item.evaluationDeadline?.toISOString() || null,
    deadlineSetBy: item.deadlineSetByUser?.name || null,
    deadlineSetByRole: item.deadlineSetByUser?.role || null,
    assignedTo: item.assignedTo,
    // Additional grouping info (could be enhanced)
    department: item.assignedTo && item.level === 'department' ? item.assignedTo : undefined,
    employeeCount: item.individualAssignments.length
  }))

  // Create deadline groups by department and manager
  const departmentGroups = new Map<string, DeadlineGroup>()
  const managerGroups = new Map<string, DeadlineGroup>()

  formattedItems.forEach(item => {
    // Calculate urgency for counts
    const now = new Date()
    const isOverdue = item.evaluationDeadline && new Date(item.evaluationDeadline) < now
    const isDueThisWeek = item.evaluationDeadline && 
      new Date(item.evaluationDeadline) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    if (item.level === 'department' && item.assignedTo) {
      if (!departmentGroups.has(item.assignedTo)) {
        departmentGroups.set(item.assignedTo, {
          id: `dept-${item.assignedTo}`,
          name: item.assignedTo,
          type: 'department',
          items: [],
          totalEmployees: 0,
          overdue: 0,
          dueThisWeek: 0
        })
      }
      const group = departmentGroups.get(item.assignedTo)!
      group.items.push(item)
      group.totalEmployees += item.employeeCount || 0
      if (isOverdue) group.overdue++
      if (isDueThisWeek) group.dueThisWeek++
    }

    if (item.level === 'manager' && item.assignedTo) {
      // For manager level, we'd need to resolve the manager name
      // For now, use the assignedTo ID as the key
      const managerId = item.assignedTo
      if (!managerGroups.has(managerId)) {
        managerGroups.set(managerId, {
          id: `mgr-${managerId}`,
          name: `Manager ${managerId.slice(-6)}`, // Show last 6 chars of ID
          type: 'manager',
          items: [],
          totalEmployees: 0,
          overdue: 0,
          dueThisWeek: 0
        })
      }
      const group = managerGroups.get(managerId)!
      group.items.push(item)
      group.totalEmployees += item.employeeCount || 0
      if (isOverdue) group.overdue++
      if (isDueThisWeek) group.dueThisWeek++
    }
  })

  const deadlineGroups: DeadlineGroup[] = [
    ...Array.from(departmentGroups.values()),
    ...Array.from(managerGroups.values())
  ]

  return {
    evaluationItems: formattedItems,
    deadlineGroups
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

  // Fetch deadlines data directly from database
  const { evaluationItems, deadlineGroups } = await getDeadlinesData(companyId)

  return (
    <DeadlinesClient 
      evaluationItems={evaluationItems}
      deadlineGroups={deadlineGroups}
    />
  )
}