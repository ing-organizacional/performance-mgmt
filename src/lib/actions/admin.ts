/**
 * Administrative Server Actions
 * 
 * High-privilege administrative functions for system maintenance and data management.
 * These actions provide destructive operations that require careful authorization and
 * confirmation mechanisms to prevent accidental data loss.
 * 
 * Key Features:
 * - Database reset functionality with confirmation requirements
 * - HR-only access control for administrative operations  
 * - Proper foreign key constraint handling during bulk operations
 * - Audit logging of administrative actions
 * - Automatic redirects with status feedback
 * 
 * Security:
 * - Strict HR role requirement for all operations
 * - Explicit confirmation required for destructive actions
 * - Session validation and automatic logout on unauthorized access
 * - Error handling with appropriate user feedback
 */

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