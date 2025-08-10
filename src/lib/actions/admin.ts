'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'
import { redirect } from 'next/navigation'

export async function resetDatabase(formData: FormData) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const userRole = session.user.role
    if (userRole !== 'hr') {
      throw new Error('Access denied - HR role required')
    }

    const confirm = formData.get('confirm') as string
    if (confirm !== 'RESET') {
      throw new Error('Confirmation required - type RESET to proceed')
    }

    // Delete all data in the correct order to avoid foreign key constraints
    // Delete in reverse dependency order
    await prisma.auditLog.deleteMany({})
    await prisma.partialAssessment.deleteMany({})
    await prisma.evaluationItemAssignment.deleteMany({})
    await prisma.evaluationItem.deleteMany({})
    await prisma.evaluation.deleteMany({})
    await prisma.performanceCycle.deleteMany({})
    await prisma.user.deleteMany({})
    await prisma.company.deleteMany({})

    console.log('Database reset completed by user:', session.user.email)
    
    // Redirect to a confirmation page or back to admin
    redirect('/admin?reset=success')

  } catch (error) {
    console.error('Error resetting database:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Access denied')) {
        redirect('/login')
      }
      // Redirect back with error
      redirect('/admin?error=' + encodeURIComponent(error.message))
    }
    
    redirect('/admin?error=Failed to reset database')
  }
}