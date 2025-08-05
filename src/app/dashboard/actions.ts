'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'
import { revalidatePath } from 'next/cache'

// Server action to update cycle status (close/reopen)
export async function updateCycleStatus(cycleId: string, status: 'active' | 'closed') {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only HR can manage cycles
    if (userRole !== 'hr') {
      return { success: false, error: 'Access denied - HR role required' }
    }

    // Update the cycle
    await prisma.performanceCycle.update({
      where: { 
        id: cycleId,
        companyId // Ensure user can only update cycles from their company
      },
      data: {
        status,
        closedBy: status === 'closed' ? session.user.id : null,
        closedAt: status === 'closed' ? new Date() : null
      }
    })

    // Revalidate dashboard and related pages
    revalidatePath('/dashboard')
    revalidatePath('/evaluations')
    revalidatePath('/admin/cycles')

    return { success: true }

  } catch (error) {
    console.error('Error updating cycle status:', error)
    return { success: false, error: 'Failed to update cycle status' }
  }
}

// Server action to create new cycle
export async function createCycle(formData: {
  name: string
  startDate: string
  endDate: string
}) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only HR can create cycles
    if (userRole !== 'hr') {
      return { success: false, error: 'Access denied - HR role required' }
    }

    const { name, startDate, endDate } = formData

    if (!name?.trim() || !startDate || !endDate) {
      return { success: false, error: 'Name, start date, and end date are required' }
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { success: false, error: 'Invalid date format' }
    }
    
    if (end <= start) {
      return { success: false, error: 'End date must be after start date' }
    }

    // Create the cycle
    await prisma.performanceCycle.create({
      data: {
        companyId,
        name: name.trim(),
        startDate: start,
        endDate: end,
        status: 'active',
        createdBy: session.user.id
      }
    })

    // Revalidate pages
    revalidatePath('/dashboard')
    revalidatePath('/admin/cycles')

    return { success: true }

  } catch (error) {
    console.error('Error creating cycle:', error)
    return { success: false, error: 'Failed to create cycle' }
  }
}