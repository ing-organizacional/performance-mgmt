'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'
import { revalidatePath } from 'next/cache'
import { isAIEnabled } from '@/lib/ai-features'
import { improveText } from '@/lib/llm'

// Server action to assign evaluation items to employees
export async function assignItemsToEmployees(itemId: string, employeeIds: string[]) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only managers and HR can assign items
    if (userRole !== 'manager' && userRole !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    // Create assignments for each employee
    const assignments = employeeIds.map(employeeId => ({
      evaluationItemId: itemId,
      employeeId,
      companyId,
      assignedBy: session.user.id
    }))

    await prisma.evaluationItemAssignment.createMany({
      data: assignments
    })

    revalidatePath('/evaluations/assignments')
    return { success: true }

  } catch (error) {
    console.error('Error assigning items:', error)
    return { success: false, error: 'Failed to assign items' }
  }
}

// Server action to unassign evaluation items from employees
export async function unassignItemsFromEmployees(itemId: string, employeeIds: string[]) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only managers and HR can unassign items
    if (userRole !== 'manager' && userRole !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    // Delete assignments
    await prisma.evaluationItemAssignment.deleteMany({
      where: {
        evaluationItemId: itemId,
        employeeId: { in: employeeIds },
        companyId
      }
    })

    revalidatePath('/evaluations/assignments')
    return { success: true }

  } catch (error) {
    console.error('Error unassigning items:', error)
    return { success: false, error: 'Failed to unassign items' }
  }
}

// Server action to create new evaluation item
export async function createEvaluationItem(formData: {
  title: string
  description: string
  type: 'okr' | 'competency'
  level: 'company' | 'department' | 'manager'
  evaluationDeadline?: string
}) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id
    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only managers and HR can create items
    if (userRole !== 'manager' && userRole !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    const { title, description, type, level, evaluationDeadline } = formData

    if (!title?.trim() || !description?.trim()) {
      return { success: false, error: 'Title and description are required' }
    }

    // Permission check
    if (userRole === 'manager' && level === 'company') {
      return { success: false, error: 'Only HR can create company-level items' }
    }

    // Validate deadline if provided
    let deadlineDate = null
    if (evaluationDeadline) {
      deadlineDate = new Date(evaluationDeadline)
      if (isNaN(deadlineDate.getTime())) {
        return { success: false, error: 'Invalid deadline date format' }
      }
      
      const now = new Date()
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
      if (deadlineDate <= oneHourFromNow) {
        return { success: false, error: 'Deadline must be at least 1 hour in the future' }
      }
    }

    // Get user info for assignedTo field
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { department: true }
    })

    let assignedTo = null
    if (level === 'department' && user?.department) {
      assignedTo = user.department
    } else if (level === 'manager') {
      assignedTo = userId
    }

    // Get the active performance cycle (required for all evaluation items)
    const activeCycle = await prisma.performanceCycle.findFirst({
      where: {
        companyId,
        status: 'active'
      }
    })

    if (!activeCycle) {
      return { success: false, error: 'No active performance cycle found. Please contact HR to create one.' }
    }

    // Get the next sort order
    const lastItem = await prisma.evaluationItem.findFirst({
      where: { companyId },
      orderBy: { sortOrder: 'desc' }
    })
    const sortOrder = (lastItem?.sortOrder || 0) + 1

    // Create the item
    await prisma.evaluationItem.create({
      data: {
        companyId,
        cycleId: activeCycle.id,
        title: title.trim(),
        description: description.trim(),
        type,
        level,
        createdBy: userId,
        assignedTo,
        sortOrder,
        active: true,
        evaluationDeadline: deadlineDate,
        deadlineSetBy: deadlineDate ? userId : null
      }
    })

    revalidatePath('/evaluations/assignments')
    revalidatePath('/dashboard/company-items')
    return { success: true }

  } catch (error) {
    console.error('Error creating evaluation item:', error)
    return { success: false, error: 'Failed to create evaluation item' }
  }
}

// Server action to update evaluation item
export async function updateEvaluationItem(itemId: string, formData: {
  title: string
  description: string
  evaluationDeadline?: string
}) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id
    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only managers and HR can update items
    if (userRole !== 'manager' && userRole !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    const { title, description, evaluationDeadline } = formData

    if (!title?.trim() || !description?.trim()) {
      return { success: false, error: 'Title and description are required' }
    }

    // Validate deadline if provided
    let deadlineDate = null
    if (evaluationDeadline) {
      deadlineDate = new Date(evaluationDeadline)
      if (isNaN(deadlineDate.getTime())) {
        return { success: false, error: 'Invalid deadline date format' }
      }
      
      const now = new Date()
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
      if (deadlineDate <= oneHourFromNow) {
        return { success: false, error: 'Deadline must be at least 1 hour in the future' }
      }
    }

    // Update the item
    await prisma.evaluationItem.update({
      where: { 
        id: itemId,
        companyId // Ensure user can only update items from their company
      },
      data: {
        title: title.trim(),
        description: description.trim(),
        evaluationDeadline: deadlineDate,
        deadlineSetBy: deadlineDate ? userId : null
      }
    })

    revalidatePath('/evaluations/assignments')
    revalidatePath('/dashboard/company-items')
    return { success: true }

  } catch (error) {
    console.error('Error updating evaluation item:', error)
    return { success: false, error: 'Failed to update evaluation item' }
  }
}

// Server action to improve text with AI
export async function improveTextWithAI(formData: {
  text: string
  type: 'objective' | 'key-result' | 'competency' | 'competency-description'
  context?: string
  isIteration?: boolean
  department?: string
}) {
  console.log('🚀 [Server Action] AI text improvement request received:', {
    type: formData.type,
    textLength: formData.text?.length || 0,
    hasContext: !!formData.context,
    isIteration: !!formData.isIteration,
    department: formData.department || 'company-wide',
    textPreview: formData.text?.substring(0, 50) + (formData.text?.length > 50 ? '...' : '')
  })

  try {
    const session = await auth()
    console.log('👤 [Server Action] Session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userRole: session?.user?.role,
      companyId: session?.user?.companyId
    })
    
    if (!session?.user?.id) {
      console.log('❌ [Server Action] Unauthorized - no session')
      return { success: false, error: 'Unauthorized' }
    }

    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only managers and HR can use AI improvement
    if (userRole !== 'manager' && userRole !== 'hr') {
      console.log('❌ [Server Action] Access denied - invalid role:', userRole)
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    // Check if AI is enabled for this company
    const aiEnabled = await isAIEnabled(companyId)
    if (!aiEnabled) {
      console.log('❌ [Server Action] AI not enabled for company:', companyId)
      return { success: false, error: 'AI features are not enabled for your organization' }
    }

    const { text, type, context } = formData

    if (!text?.trim()) {
      console.log('❌ [Server Action] Empty text provided')
      return { success: false, error: 'Text is required' }
    }

    console.log('🎯 [Server Action] Processing text improvement:', {
      originalLength: text.trim().length,
      type: type,
      hasContext: !!context?.trim()
    })

    // Rate limiting check (prevent API abuse)
    // TODO: Implement proper rate limiting in production
    
    // Call LLM API with the configured provider
    const improvedText = await improveText(text.trim(), type, context?.trim(), formData.isIteration, formData.department)

    console.log('✅ [Server Action] Text improvement successful:', {
      originalLength: text.trim().length,
      improvedLength: improvedText.length,
      sameText: text.trim() === improvedText
    })

    return { success: true, improvedText }

  } catch (error) {
    console.error('Error improving text with AI:', error)
    
    // Provide specific user-friendly error messages
    if (error instanceof Error) {
      // Configuration errors
      if (error.message === 'AI_CONFIG_MISSING') {
        return { success: false, error: 'AI service is not configured. Please contact your administrator.' }
      }
      if (error.message.includes('API key')) {
        return { success: false, error: 'AI service configuration error. Please contact your administrator.' }
      }
      
      // API errors
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        return { success: false, error: 'AI service temporarily unavailable. Please try again later.' }
      }
      if (error.message.includes('insufficient_quota')) {
        return { success: false, error: 'AI service quota exceeded. Please contact your administrator.' }
      }
      if (error.message.includes('invalid_api_key')) {
        return { success: false, error: 'AI service authentication error. Please contact your administrator.' }
      }
      
      // Network errors
      if (error.message.includes('network') || error.message.includes('timeout')) {
        return { success: false, error: 'Network error. Please check your connection and try again.' }
      }
    }
    
    return { success: false, error: 'Failed to improve text. Please try again.' }
  }
}