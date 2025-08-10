'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'
import { revalidatePath } from 'next/cache'
import { auditEvaluation } from '@/lib/services/audit-service'

// Server action to autosave evaluation as draft
export async function autosaveEvaluation(formData: {
  employeeId: string
  evaluationItems: Array<{
    id: string
    title: string
    description: string
    type: 'okr' | 'competency'
    rating: number | null
    comment: string
  }>
  overallRating?: number | null
  overallComment?: string
  periodType?: string
  periodDate?: string
}) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id
    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only managers and HR can create evaluations
    if (userRole !== 'manager' && userRole !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    const { 
      employeeId, 
      evaluationItems, 
      overallRating, 
      overallComment,
      periodType,
      periodDate
    } = formData

    if (!employeeId || !evaluationItems) {
      return { success: false, error: 'Missing required fields' }
    }

    // Get active cycle to derive period values
    const activeCycle = await prisma.performanceCycle.findFirst({
      where: {
        companyId: session.user.companyId,
        status: 'active'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Derive period values from active cycle or use provided values or defaults
    let derivedPeriodType = periodType || 'yearly'
    let derivedPeriodDate = periodDate || new Date().getFullYear().toString()
    
    if (activeCycle) {
      // Extract period info from cycle name
      const cycleName = activeCycle.name.toLowerCase()
      if (cycleName.includes('annual') || cycleName.includes('yearly') || cycleName.includes('year')) {
        derivedPeriodType = periodType || 'yearly'
        // Extract year from cycle name or use current year
        const yearMatch = activeCycle.name.match(/\b(20\d{2})\b/)
        derivedPeriodDate = periodDate || (yearMatch ? yearMatch[1] : new Date().getFullYear().toString())
      } else if (cycleName.includes('quarter') || cycleName.includes('q1') || cycleName.includes('q2') || cycleName.includes('q3') || cycleName.includes('q4')) {
        derivedPeriodType = periodType || 'quarterly'
        // Extract quarter info from cycle name
        const quarterMatch = activeCycle.name.match(/\b(20\d{2}[-\s]?Q[1-4]|\bQ[1-4][-\s]?20\d{2})\b/i)
        if (quarterMatch) {
          derivedPeriodDate = periodDate || quarterMatch[1].replace(/\s/g, '-').toUpperCase()
        } else {
          // Fallback: determine quarter from current date
          const currentDate = new Date()
          const quarter = Math.ceil((currentDate.getMonth() + 1) / 3)
          derivedPeriodDate = periodDate || `${currentDate.getFullYear()}-Q${quarter}`
        }
      }
    }

    // Check if evaluation already exists for this period
    const existingEvaluation = await prisma.evaluation.findFirst({
      where: {
        employeeId,
        managerId: userId,
        periodType: derivedPeriodType,
        periodDate: derivedPeriodDate,
        companyId
      }
    })

    let evaluation
    if (existingEvaluation && existingEvaluation.status === 'draft') {
      // Update existing draft evaluation
      evaluation = await prisma.evaluation.update({
        where: { id: existingEvaluation.id },
        data: {
          evaluationItemsData: JSON.stringify(evaluationItems),
          overallRating,
          managerComments: overallComment,
          updatedAt: new Date()
        }
      })
    } else if (!existingEvaluation) {
      // Create new evaluation as draft
      evaluation = await prisma.evaluation.create({
        data: {
          employeeId,
          managerId: userId,
          companyId,
          periodType: derivedPeriodType,
          periodDate: derivedPeriodDate,
          evaluationItemsData: JSON.stringify(evaluationItems),
          overallRating,
          managerComments: overallComment,
          status: 'draft'
        }
      })
    } else {
      // Don't modify submitted or completed evaluations
      return { success: false, error: 'Cannot modify submitted or completed evaluation' }
    }

    return { success: true, evaluationId: evaluation.id }

  } catch (error) {
    console.error('Error autosaving evaluation:', error)
    return { success: false, error: 'Failed to save evaluation' }
  }
}

// Server action to submit evaluation for approval
export async function submitEvaluation(evaluationId: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id
    const companyId = session.user.companyId

    // Get the evaluation
    const evaluation = await prisma.evaluation.findFirst({
      where: {
        id: evaluationId,
        companyId
      }
    })

    if (!evaluation) {
      return { success: false, error: 'Evaluation not found' }
    }

    // Only the manager who created it can submit
    if (evaluation.managerId !== userId) {
      return { success: false, error: 'Only the assigned manager can submit this evaluation' }
    }

    // Check if evaluation is in draft status
    if (evaluation.status !== 'draft') {
      return { success: false, error: 'Only draft evaluations can be submitted' }
    }

    // Validate all items are complete (have rating and comment)
    if (evaluation.evaluationItemsData) {
      try {
        const items = JSON.parse(evaluation.evaluationItemsData)
        const allComplete = items.every((item: { rating?: number; comment?: string }) => 
          item.rating !== null && 
          item.rating !== undefined && 
          item.comment && 
          item.comment.trim() !== ''
        )

        if (!allComplete) {
          return { success: false, error: 'All evaluation items must have ratings and comments before submission' }
        }
      } catch {
        return { success: false, error: 'Invalid evaluation data format' }
      }
    }

    // Update status to submitted
    await prisma.evaluation.update({
      where: { id: evaluationId },
      data: { 
        status: 'submitted',
        updatedAt: new Date()
      }
    })

    // Create audit log entry using new service
    await auditEvaluation(
      userId,
      session.user.role,
      companyId,
      'submit',
      evaluationId,
      evaluation.employeeId,
      { status: 'draft' },
      { status: 'submitted' }
    )

    revalidatePath('/evaluations')
    revalidatePath(`/evaluate/${evaluation.employeeId}`)
    return { success: true }

  } catch (error) {
    console.error('Error submitting evaluation:', error)
    return { success: false, error: 'Failed to submit evaluation' }
  }
}

// Server action for employee to approve evaluation
export async function approveEvaluation(evaluationId: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id
    const companyId = session.user.companyId

    // Get the evaluation
    const evaluation = await prisma.evaluation.findFirst({
      where: {
        id: evaluationId,
        companyId
      }
    })

    if (!evaluation) {
      return { success: false, error: 'Evaluation not found' }
    }

    // Only the employee being evaluated can approve
    if (evaluation.employeeId !== userId) {
      return { success: false, error: 'Only the employee being evaluated can approve this evaluation' }
    }

    // Check if evaluation is in submitted status
    if (evaluation.status !== 'submitted') {
      return { success: false, error: 'Only submitted evaluations can be approved' }
    }

    // Update status to completed
    await prisma.evaluation.update({
      where: { id: evaluationId },
      data: { 
        status: 'completed',
        updatedAt: new Date()
      }
    })

    // Create audit log entry using new service
    await auditEvaluation(
      userId,
      session.user.role,
      companyId,
      'approve',
      evaluationId,
      evaluation.employeeId,
      { status: 'submitted' },
      { status: 'completed' }
    )

    revalidatePath('/my-evaluations')
    revalidatePath('/evaluations')
    revalidatePath('/dashboard')
    return { success: true }

  } catch (error) {
    console.error('Error approving evaluation:', error)
    return { success: false, error: 'Failed to approve evaluation' }
  }
}

// Server action for HR to unlock evaluation (move back to draft)
export async function unlockEvaluation(evaluationId: string, reason?: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id
    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only HR can unlock evaluations
    if (userRole !== 'hr') {
      return { success: false, error: 'Only HR can unlock evaluations' }
    }

    // Get the evaluation
    const evaluation = await prisma.evaluation.findFirst({
      where: {
        id: evaluationId,
        companyId
      }
    })

    if (!evaluation) {
      return { success: false, error: 'Evaluation not found' }
    }

    // Can only unlock submitted evaluations
    if (evaluation.status !== 'submitted') {
      return { success: false, error: 'Only submitted evaluations can be unlocked' }
    }

    // Update status back to draft
    await prisma.evaluation.update({
      where: { id: evaluationId },
      data: { 
        status: 'draft',
        updatedAt: new Date()
      }
    })

    // Create audit log entry using new service
    await auditEvaluation(
      userId,
      session.user.role,
      companyId,
      'unlock',
      evaluationId,
      evaluation.employeeId,
      { status: 'submitted' },
      { status: 'draft', unlockedBy: userId },
      reason
    )

    revalidatePath('/evaluations')
    revalidatePath('/dashboard')
    return { success: true }

  } catch (error) {
    console.error('Error unlocking evaluation:', error)
    return { success: false, error: 'Failed to unlock evaluation' }
  }
}