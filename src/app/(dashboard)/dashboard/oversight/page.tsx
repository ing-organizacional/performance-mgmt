import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'
import { redirect } from 'next/navigation'
import OversightClient from './OversightClient'

export default async function OversightPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  // Only HR can access this page
  if (session.user.role !== 'hr') {
    redirect('/dashboard')
  }

  const companyId = session.user.companyId

  // Fetch all department and manager-level evaluation items (excluding company-wide items)
  const evaluationItems = await prisma.evaluationItem.findMany({
    where: {
      companyId,
      active: true,
      level: 'department'
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          department: true,
          role: true
        }
      },
      individualAssignments: {
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              department: true
            }
          }
        }
      }
    },
    orderBy: [
      { level: 'asc' }, // department level items
      { createdAt: 'desc' }
    ]
  })

  // Get unique departments and managers for filtering
  const departments = [...new Set(evaluationItems.map(item => item.creator.department).filter((dept): dept is string => Boolean(dept)))]
  
  // Create unique managers array by deduplicating by ID
  const uniqueManagersMap = new Map()
  evaluationItems.forEach(item => {
    const manager = { id: item.creator.id, name: item.creator.name }
    uniqueManagersMap.set(manager.id, manager)
  })
  const managers = Array.from(uniqueManagersMap.values())

  // Format data for client component
  const formattedItems = evaluationItems.map(item => ({
    id: item.id,
    title: item.title,
    description: item.description,
    type: item.type as 'okr' | 'competency',
    level: item.level as 'department',
    createdBy: {
      id: item.creator.id,
      name: item.creator.name,
      department: item.creator.department || '',
      role: item.creator.role
    },
    assignedTo: item.assignedTo,
    assignedEmployees: item.individualAssignments.map(assignment => ({
      id: assignment.employee.id,
      name: assignment.employee.name,
      department: assignment.employee.department || ''
    })),
    createdAt: item.createdAt.toISOString(),
    active: item.active
  }))

  return (
    <OversightClient 
      items={formattedItems}
      departments={departments}
      managers={managers}
    />
  )
}