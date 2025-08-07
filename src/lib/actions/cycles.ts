'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma-client'
import { auth } from '@/auth'
import { z } from 'zod'

// Validation schemas
const cycleSchema = z.object({
  name: z.string().min(1, 'Cycle name is required'),
  startDate: z.string().refine((date) => {
    const parsedDate = new Date(date)
    return !isNaN(parsedDate.getTime())
  }, 'Valid start date is required'),
  endDate: z.string().refine((date) => {
    const parsedDate = new Date(date)
    return !isNaN(parsedDate.getTime())
  }, 'Valid end date is required')
}).refine((data) => {
  const startDate = new Date(data.startDate)
  const endDate = new Date(data.endDate)
  return endDate > startDate
}, {
  message: 'End date must be after start date',
  path: ['endDate']
})

const updateCycleSchema = z.object({
  status: z.enum(['active', 'closed', 'archived'])
})

async function requireHRAccess() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'hr') {
    throw new Error('Access denied - HR role required')
  }
  return session.user
}

export async function createCycle(formData: FormData) {
  try {
    const currentUser = await requireHRAccess()

    const rawData = {
      name: formData.get('name'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate')
    }

    const result = cycleSchema.safeParse(rawData)
    
    if (!result.success) {
      return {
        success: false,
        errors: result.error.flatten().fieldErrors,
        message: 'Validation failed'
      }
    }

    const cycleData = result.data

    // Check if there's already an active cycle
    const activeCycle = await prisma.performanceCycle.findFirst({
      where: {
        companyId: currentUser.companyId,
        status: 'active'
      }
    })

    if (activeCycle) {
      return {
        success: false,
        message: 'Only one active cycle is allowed at a time. Please close the current active cycle first.',
        errors: {}
      }
    }

    // Create new cycle
    await prisma.performanceCycle.create({
      data: {
        name: cycleData.name,
        startDate: new Date(cycleData.startDate),
        endDate: new Date(cycleData.endDate),
        status: 'active',
        companyId: currentUser.companyId,
        createdBy: currentUser.id
      }
    })

    revalidatePath('/admin/cycles')
    revalidatePath('/dashboard')
    
    return {
      success: true,
      message: 'Performance cycle created successfully'
    }
  } catch (error) {
    console.error('Error creating cycle:', error)
    return {
      success: false,
      message: 'Failed to create cycle',
      errors: {}
    }
  }
}

export async function updateCycleStatus(cycleId: string, statusOrFormData: 'active' | 'closed' | FormData) {
  try {
    const currentUser = await requireHRAccess()

    // Handle both direct status and FormData inputs for flexibility
    let status: string
    if (typeof statusOrFormData === 'string') {
      status = statusOrFormData
    } else {
      const rawData = {
        status: statusOrFormData.get('status')
      }
      const result = updateCycleSchema.safeParse(rawData)
      
      if (!result.success) {
        return {
          success: false,
          errors: result.error.flatten().fieldErrors,
          message: 'Invalid status provided'
        }
      }
      status = result.data.status
    }

    // Validate the status value
    if (!['active', 'closed', 'archived'].includes(status)) {
      return {
        success: false,
        message: 'Invalid status provided'
      }
    }

    // Verify cycle exists and belongs to company
    const cycle = await prisma.performanceCycle.findFirst({
      where: {
        id: cycleId,
        companyId: currentUser.companyId
      }
    })

    if (!cycle) {
      return {
        success: false,
        message: 'Cycle not found'
      }
    }

    // If activating a cycle, ensure no other active cycles exist
    if (status === 'active') {
      const activeCycle = await prisma.performanceCycle.findFirst({
        where: {
          companyId: currentUser.companyId,
          status: 'active',
          id: { not: cycleId }
        }
      })

      if (activeCycle) {
        return {
          success: false,
          message: 'Only one active cycle is allowed at a time. Please close other active cycles first.'
        }
      }
    }

    // Prepare update data
    const updateData: {
      status: string
      closedAt?: Date | null
      closedBy?: string | null
    } = {
      status
    }

    if (status === 'closed') {
      updateData.closedAt = new Date()
      updateData.closedBy = currentUser.id
    } else if (status === 'active') {
      updateData.closedAt = null
      updateData.closedBy = null
    }

    // Update cycle
    await prisma.performanceCycle.update({
      where: { id: cycleId },
      data: updateData
    })

    revalidatePath('/admin/cycles')
    revalidatePath('/dashboard')
    
    return {
      success: true,
      message: `Cycle ${status === 'closed' ? 'closed' : status === 'active' ? 'reopened' : 'updated'} successfully`
    }
  } catch (error) {
    console.error('Error updating cycle:', error)
    return {
      success: false,
      message: 'Failed to update cycle'
    }
  }
}

export async function deleteCycle(cycleId: string) {
  try {
    const currentUser = await requireHRAccess()

    // Verify cycle exists and belongs to company
    const cycle = await prisma.performanceCycle.findFirst({
      where: {
        id: cycleId,
        companyId: currentUser.companyId
      },
      include: {
        _count: {
          select: {
            evaluations: true,
            evaluationItems: true,
            partialAssessments: true
          }
        }
      }
    })

    if (!cycle) {
      return {
        success: false,
        message: 'Cycle not found'
      }
    }

    // Check if cycle has dependent data
    const hasData = cycle._count.evaluations > 0 || 
                   cycle._count.evaluationItems > 0 || 
                   cycle._count.partialAssessments > 0

    if (hasData) {
      return {
        success: false,
        message: `Cannot delete cycle - it contains ${cycle._count.evaluations} evaluations, ${cycle._count.evaluationItems} items, and ${cycle._count.partialAssessments} assessments. Archive it instead.`
      }
    }

    // Delete cycle (only if no dependent data)
    await prisma.performanceCycle.delete({
      where: { id: cycleId }
    })

    revalidatePath('/admin/cycles')
    revalidatePath('/dashboard')
    
    return {
      success: true,
      message: 'Cycle deleted successfully'
    }
  } catch (error) {
    console.error('Error deleting cycle:', error)
    return {
      success: false,
      message: 'Failed to delete cycle'
    }
  }
}

export async function getCycle(cycleId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userRole = session.user.role
    const companyId = session.user.companyId

    // Managers and HR can access cycle info
    if (userRole !== 'manager' && userRole !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    const cycle = await prisma.performanceCycle.findFirst({
      where: {
        id: cycleId,
        companyId
      },
      include: {
        closedByUser: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!cycle) {
      return { success: false, error: 'Cycle not found' }
    }

    return { 
      success: true, 
      cycle: {
        id: cycle.id,
        name: cycle.name,
        status: cycle.status,
        startDate: cycle.startDate.toISOString(),
        endDate: cycle.endDate.toISOString(),
        closedBy: cycle.closedByUser?.name || null,
        closedAt: cycle.closedAt?.toISOString() || null
      }
    }

  } catch (error) {
    console.error('Error fetching cycle:', error)
    return { success: false, error: 'Failed to fetch cycle' }
  }
}

// Wrapper function for backward compatibility with dashboard components
export async function createCycleFromObject(data: {
  name: string
  startDate: string
  endDate: string
}) {
  const formData = new FormData()
  formData.append('name', data.name)
  formData.append('startDate', data.startDate)
  formData.append('endDate', data.endDate)
  
  const result = await createCycle(formData)
  
  // Convert response format for backward compatibility
  if (!result.success) {
    return { 
      success: false, 
      error: result.message || 'Failed to create cycle'
    }
  }
  
  return { success: true }
}