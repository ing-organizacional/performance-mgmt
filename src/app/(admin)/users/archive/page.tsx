import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma-client'
import ArchiveClient from './ArchiveClient'
import type { Company } from '@/types'

async function getArchivedUsersData(companyId: string) {
  // Get all archived users with detailed information
  const archivedUsers = await prisma.user.findMany({
    where: {
      companyId,
      active: false
    },
    include: {
      company: true,
      manager: {
        select: { name: true, email: true }
      },
      evaluationsReceived: {
        include: {
          manager: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: {
          employees: true,
          evaluationsReceived: true
        }
      }
    },
    orderBy: [
      { archivedAt: 'desc' },
      { name: 'asc' }
    ]
  })

  // Get all companies (for potential unarchive form)
  const companies = await prisma.company.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      code: true,
      active: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: { name: 'asc' }
  })

  // Get active managers for potential reassignment
  const managers = await prisma.user.findMany({
    where: {
      companyId,
      active: true,
      role: { in: ['manager', 'hr'] }
    },
    select: {
      id: true,
      name: true,
      email: true
    },
    orderBy: { name: 'asc' }
  })

  return {
    archivedUsers,
    companies: companies as Company[],
    managers
  }
}

export default async function ArchivePage() {
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

  // Fetch archived users data
  const { archivedUsers, companies, managers } = await getArchivedUsersData(companyId)

  return (
    <ArchiveClient 
      archivedUsers={archivedUsers.map(user => ({
        ...user,
        role: user.role as 'employee' | 'manager' | 'hr',
        userType: user.userType as 'office' | 'operational',
        evaluationsReceived: user.evaluationsReceived.map(evaluation => ({
          ...evaluation,
          createdAt: evaluation.createdAt.toISOString()
        }))
      }))}
      companies={companies}
      managers={managers}
    />
  )
}