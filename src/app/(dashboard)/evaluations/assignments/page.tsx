import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'
import { redirect } from 'next/navigation'
import { isAIEnabled } from '@/lib/ai-features'
import AssignmentsClient from './AssignmentsClient'

interface EvaluationItem {
  id: string
  title: string
  description: string
  type: 'okr' | 'competency'
  level: 'company' | 'department'
  createdBy: string
  creatorRole: string
  assignedTo?: string | null
  evaluationDeadline?: string | null
  deadlineSetBy?: string | null
  deadlineSetByRole?: string | null
  active: boolean
}

interface Employee {
  id: string
  name: string
  email?: string
  username?: string
  department?: string
  assignedItems: string[]
}

// Server component that fetches data and passes to client component
export default async function AssignmentsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  // Only managers and HR can access this page
  if (session.user.role !== 'manager' && session.user.role !== 'hr') {
    redirect('/dashboard')
  }

  const companyId = session.user.companyId
  const userId = session.user.id
  const userRole = session.user.role

  // Fetch only active evaluation items for the company
  const evaluationItems = await prisma.evaluationItem.findMany({
    where: {
      companyId,
      active: true // Only show active items in assignments
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
    orderBy: [
      { level: 'desc' }, // company first, then department, then manager
      { sortOrder: 'asc' }
    ]
  })

  // Fetch team members - only show employees that this user manages
  // Even HR users should only see their direct reports in the assignment interface
  const teamMembers = await prisma.user.findMany({
    where: {
      companyId,
      managerId: userId
    },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      department: true
    }
  })

  // Get all assignments for these team members (for future use)
  // const assignments = await prisma.evaluationItemAssignment.findMany({
  //   where: {
  //     companyId,
  //     employeeId: { in: teamMembers.map(member => member.id) }
  //   },
  //   select: {
  //     employeeId: true,
  //     evaluationItemId: true
  //   }
  // })

  // Clean up any orphaned assignments for this company (assignments referencing inactive or non-existent evaluation items)
  await prisma.evaluationItemAssignment.deleteMany({
    where: {
      companyId,
      evaluationItemId: {
        notIn: evaluationItems.map(item => item.id) // Only keep assignments for active items
      }
    }
  })

  // Get assignments again after cleanup
  const cleanAssignments = await prisma.evaluationItemAssignment.findMany({
    where: {
      companyId,
      employeeId: { in: teamMembers.map(member => member.id) }
    },
    select: {
      employeeId: true,
      evaluationItemId: true
    }
  })

  // Format data for client component
  const formattedItems: EvaluationItem[] = evaluationItems.map(item => ({
    id: item.id,
    title: item.title,
    description: item.description,
    type: item.type as 'okr' | 'competency',
    level: item.level as 'company' | 'department',
    createdBy: item.creator.name,
    creatorRole: item.creator.role,
    assignedTo: item.assignedTo,
    evaluationDeadline: item.evaluationDeadline?.toISOString() || null,
    deadlineSetBy: item.deadlineSetByUser?.name || null,
    deadlineSetByRole: item.deadlineSetByUser?.role || null,
    active: item.active
  }))

  const formattedEmployees: Employee[] = teamMembers.map(member => ({
    id: member.id,
    name: member.name,
    email: member.email || undefined,
    username: member.username || undefined,
    department: member.department || '',
    assignedItems: cleanAssignments
      .filter(assignment => assignment.employeeId === member.id)
      .map(assignment => assignment.evaluationItemId)
  }))

  // Check if AI features are enabled for this company
  const aiEnabled = await isAIEnabled(companyId)

  return (
    <AssignmentsClient 
      evaluationItems={formattedItems}
      employees={formattedEmployees}
      userRole={userRole}
      userName={session.user.name || ''}
      userDepartment={session.user.department}
      aiEnabled={aiEnabled}
    />
  )
}