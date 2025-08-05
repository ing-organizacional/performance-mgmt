import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma-client'
import UsersClient from './UsersClient'
import type { Company } from '@/types'

async function getUsersData(companyId: string) {
  // Get all users with detailed information
  const users = await prisma.user.findMany({
    where: {
      companyId
    },
    include: {
      company: {
        select: { name: true, code: true }
      },
      manager: {
        select: { name: true, email: true }
      },
      _count: {
        select: {
          employees: true,
          evaluationsReceived: true
        }
      }
    },
    orderBy: [
      { company: { name: 'asc' } },
      { name: 'asc' }
    ]
  })

  // Get all companies (for the form)
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

  // Get managers (users with manager or HR role for the form)
  const managers = users
    .filter(user => user.role === 'manager' || user.role === 'hr')
    .map(user => ({
      id: user.id,
      name: user.name,
      email: user.email
    }))

  return {
    users: users as (typeof users), // Type assertion needed due to Prisma include complexity
    companies: companies as Company[],
    managers
  }
}

export default async function UsersPage() {
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

  // Fetch users data directly from database
  const { users, companies, managers } = await getUsersData(companyId)

  return (
    <UsersClient 
      users={users}
      companies={companies}
      managers={managers}
    />
  )
}