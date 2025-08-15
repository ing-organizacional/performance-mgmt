/**
 * CSV Import Execution Functions
 * 
 * Handles the actual execution of CSV imports with comprehensive
 * error recovery, batch processing, and audit logging.
 */

'use server'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'
import bcrypt from 'bcryptjs'
import { requireHRRole } from '@/lib/auth-middleware'
import { revalidatePath } from 'next/cache'
import type { PrismaClient } from '@prisma/client'
import type {
  ImportExecutionResult,
  ImportPreviewUser,
  UpsertOptions,
  TransactionContext
} from './types'
import {
  categorizeError,
  autoFixPassword
} from './validation-helpers'
import { previewCSVImport } from './preview'

// CSV Import Execution Server Action
export async function executeCSVImport(
  formData: FormData,
  options: UpsertOptions = {
    updateExisting: true,
    createNew: true,
    requireConfirmation: false,
    skipOnError: true,
    continueOnValidationError: true,
    autoFixPasswords: false
  }
): Promise<ImportExecutionResult> {
  const startTime = Date.now()
  
  try {
    const authResult = await requireHRRole()
    if (authResult instanceof NextResponse) {
      return {
        success: false,
        message: 'Authentication failed',
        created: 0,
        updated: 0,
        failed: 0,
        errors: ['Authentication failed']
      }
    }

    const { user } = authResult
    const file = formData.get('file') as File
    
    if (!file) {
      return {
        success: false,
        message: 'CSV file is required',
        created: 0,
        updated: 0,
        failed: 0,
        errors: ['CSV file is required']
      }
    }

    // Reuse preview logic for validation
    const previewResult = await previewCSVImport(formData)
    if (!previewResult.success) {
      return {
        success: false,
        message: 'CSV validation failed',
        created: 0,
        updated: 0,
        failed: 0,
        errors: previewResult.globalErrors
      }
    }

    // Filter users based on options
    const usersToProcess = previewResult.users.filter((user: ImportPreviewUser) => {
      // Skip users with validation errors unless we're auto-fixing
      if (user.validationErrors.length > 0) {
        if (!options.continueOnValidationError) return false
        // Check if we can auto-fix password issues
        if (options.autoFixPasswords && user.validationErrors.some(err => err.includes('password'))) {
          return true // We'll fix this during processing
        }
        return false
      }
      if (user.action === 'create' && !options.createNew) return false
      if (user.action === 'update' && !options.updateExisting) return false
      return true
    })

    const context: TransactionContext = {
      user,
      startTime,
      fileName: file.name
    }

    // Process users with error recovery
    const result = await processUsersWithRecovery(usersToProcess, context, options)
    
    // Revalidate related paths
    revalidatePath('/users')
    revalidatePath('/users/advanced')
    revalidatePath('/dashboard')

    return result

  } catch (error) {
    console.error('Error executing CSV import:', error)
    return {
      success: false,
      message: 'Failed to execute CSV import',
      created: 0,
      updated: 0,
      failed: 0,
      errors: ['Failed to execute CSV import']
    }
  }
}

// Process users with enhanced error recovery
async function processUsersWithRecovery(
  usersToProcess: ImportPreviewUser[],
  context: TransactionContext,
  options: UpsertOptions
): Promise<ImportExecutionResult> {
  let created = 0
  let updated = 0
  let failed = 0
  const errors: string[] = []
  const recoverableErrors = []
  const criticalErrors = []
  const auditChanges: { created: string[]; updated: { userId: string; field: string; oldValue: unknown; newValue: unknown }[] } = { 
    created: [], 
    updated: [] 
  }

  // Process each user with enhanced error recovery
  for (let i = 0; i < usersToProcess.length; i++) {
    const userData = usersToProcess[i]
    
    try {
      // Auto-fix passwords if enabled
      if (options.autoFixPasswords && userData.validationErrors.some(err => err.includes('password'))) {
        userData.password = await autoFixPassword(userData)
        // Remove password-related validation errors
        userData.validationErrors = userData.validationErrors.filter(err => !err.includes('password'))
      }

      // Skip if still has validation errors and not configured to continue
      if (userData.validationErrors.length > 0 && !options.continueOnValidationError) {
        throw new Error(`Validation errors: ${userData.validationErrors.join(', ')}`)
      }

      await prisma.$transaction(async (tx) => {
        if (userData.action === 'create') {
          await createUser(userData, context, tx)
          created++
          auditChanges.created.push('new-user')
        } else if (userData.action === 'update' && userData.existingUserId) {
          const changes = await updateUser(userData, context, options, tx)
          if (changes.length > 0) {
            updated++
            auditChanges.updated.push(...changes)
          }
        }
      })

    } catch (error) {
      const categorizedError = categorizeError(error, userData, i)
      
      if ('requiresAdminAction' in categorizedError) {
        // Critical error
        criticalErrors.push(categorizedError)
        if (!options.skipOnError) {
          // If not skipping on error, stop processing
          throw error
        }
      } else {
        // Recoverable error
        recoverableErrors.push(categorizedError)
      }
      
      failed++
      errors.push(`Failed to process ${userData.name}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Create comprehensive audit log
  await prisma.auditLog.create({
    data: {
      userId: context.user.id,
      companyId: context.user.companyId,
      userRole: context.user.role,
      timestamp: new Date(),
      action: 'csv_import_execute',
      entityType: 'User',
      metadata: {
        fileName: context.fileName,
        totalProcessed: usersToProcess.length,
        created,
        updated,
        failed,
        options: JSON.parse(JSON.stringify(options)),
        executionTimeMs: Date.now() - context.startTime,
        recoverableErrorCount: recoverableErrors.length,
        criticalErrorCount: criticalErrors.length
      },
      newData: JSON.parse(JSON.stringify(auditChanges))
    }
  })

  // Determine success
  const partialSuccess = created > 0 || updated > 0
  const isSuccess = failed === 0 || (partialSuccess && (options.skipOnError || false))

  return {
    success: isSuccess,
    message: failed === 0 ? 
      `Import completed successfully: ${created} created, ${updated} updated` :
      `Import completed with ${failed} errors: ${created} created, ${updated} updated, ${failed} failed`,
    created,
    updated,
    failed,
    errors,
    partialSuccess: partialSuccess && failed > 0,
    recoverableErrors: recoverableErrors.length > 0 ? recoverableErrors : undefined,
    criticalErrors: criticalErrors.length > 0 ? criticalErrors : undefined
  }
}

// Create new user helper
async function createUser(
  userData: ImportPreviewUser, 
  context: TransactionContext,
  tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]
): Promise<void> {
  // Find manager ID
  let managerId = null
  if (userData.managerPersonID || userData.managerEmployeeId) {
    const manager = await tx.user.findFirst({
      where: {
        companyId: context.user.companyId,
        role: { in: ['manager', 'hr'] },
        OR: [
          userData.managerPersonID ? { personID: userData.managerPersonID } : {},
          userData.managerEmployeeId ? { employeeId: userData.managerEmployeeId } : {}
        ].filter(condition => Object.keys(condition).length > 0)
      }
    })
    managerId = manager?.id || null
  }

  const hashedPassword = userData.userType === 'operational' ? 
    null : await bcrypt.hash(userData.password!, 12)

  await tx.user.create({
    data: {
      name: userData.name,
      email: userData.email || null,
      username: userData.username || null,
      role: userData.role as 'employee' | 'manager' | 'hr',
      companyId: context.user.companyId,
      managerId,
      department: userData.department || null,
      employeeId: userData.employeeId || null,
      personID: userData.personID || '',
      userType: userData.userType as 'office' | 'operational',
      passwordHash: hashedPassword,
      pinCode: userData.userType === 'operational' ? userData.password! : null,
      requiresPinOnly: userData.userType === 'operational',
      loginMethod: userData.email ? 'email' : 'username',
      position: userData.position || null,
      shift: userData.shift || null,
      active: true
    }
  })
}

// Update existing user helper
async function updateUser(
  userData: ImportPreviewUser,
  context: TransactionContext,
  options: UpsertOptions,
  tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]
): Promise<{ userId: string; field: string; oldValue: unknown; newValue: unknown }[]> {
  const currentUser = await tx.user.findUnique({
    where: { id: userData.existingUserId! }
  })

  if (!currentUser) {
    throw new Error(`User not found for update: ${userData.name}`)
  }

  // Build update data based on selected fields
  const updateData: Record<string, unknown> = {}
  const fieldsToUpdate = options.selectedFields || [
    'name', 'email', 'username', 'role', 'department', 
    'userType', 'employeeId', 'position', 'shift'
  ]

  // Track changes for audit
  const changes: { userId: string; field: string; oldValue: unknown; newValue: unknown }[] = []

  for (const field of fieldsToUpdate) {
    const newValue = (userData as unknown as Record<string, unknown>)[field]
    const currentValue = (currentUser as unknown as Record<string, unknown>)[field]
    
    if (newValue !== undefined && newValue !== currentValue) {
      updateData[field] = newValue
      changes.push({
        userId: userData.existingUserId!,
        field,
        oldValue: currentValue,
        newValue
      })
    }
  }

  // Handle password update
  if (userData.password && userData.password !== 'KEEP_EXISTING') {
    if (userData.userType === 'operational') {
      updateData.pinCode = userData.password
      updateData.passwordHash = null
      updateData.requiresPinOnly = true
    } else {
      updateData.passwordHash = await bcrypt.hash(userData.password, 12)
      updateData.pinCode = null
      updateData.requiresPinOnly = false
    }
    changes.push({
      userId: userData.existingUserId!,
      field: 'password',
      oldValue: '***',
      newValue: '*** (updated)'
    })
  }

  // Perform update if there are changes
  if (Object.keys(updateData).length > 0) {
    await tx.user.update({
      where: { id: userData.existingUserId! },
      data: updateData
    })
  }

  return changes
}