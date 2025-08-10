// CSV Import Batch Processing
// Intelligent batch processing for large CSV files

'use server'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'
import { requireHRRole } from '@/lib/auth-middleware'
import { revalidatePath } from 'next/cache'
import type { PrismaClient } from '@prisma/client'
import { previewCSVImport } from './core'
import type {
  BatchedImportExecutionResult,
  UpsertOptions,
  ImportPreviewUser,
  RecoverableError,
  CriticalError,
  ImportExecutionResult
} from './types'
import {
  categorizeError,
  calculateOptimalBatchSize,
  hashPasswordsInParallel
} from './validation-helpers'

// Smart Batch Processing for Large Files
export async function executeCSVImportWithBatching(
  formData: FormData,
  options: UpsertOptions = {
    updateExisting: true,
    createNew: true,
    requireConfirmation: false,
    skipOnError: true,
    continueOnValidationError: true,
    autoFixPasswords: false,
    batchSize: 200,
    useBatching: true
  }
): Promise<BatchedImportExecutionResult> {
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

    // Analyze file for intelligent batching decisions
    const analysisResult = analyzeFileForBatching(file, options)
    
    // For smaller files, use regular processing
    if (!analysisResult.shouldUseBatching) {
      console.log(`⚡ Using standard processing for ${analysisResult.estimatedRows} rows`)
      const { executeCSVImport } = await import('./core')
      return await executeCSVImport(formData, options)
    }

    // Large file batch processing
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    console.log(`🚀 Starting batch processing: ${batchId}`)
    
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

    const usersToProcess = filterUsersForProcessing(previewResult.users, options)
    const batchSize = analysisResult.optimalBatchSize
    const totalBatches = Math.ceil(usersToProcess.length / batchSize)
    
    console.log(`📦 Processing ${usersToProcess.length} users in ${totalBatches} batches of ${batchSize}`)

    // Execute batched processing
    const batchResults = await executeBatchedProcessing(
      usersToProcess,
      user,
      options,
      batchSize,
      totalBatches,
      startTime
    )

    // Create comprehensive audit log
    await createBatchAuditLog(user, file, batchId, batchResults, startTime, totalBatches, batchSize)

    // Revalidate related paths
    revalidatePath('/users')
    revalidatePath('/users/advanced')
    revalidatePath('/dashboard')

    return formatBatchResults(batchResults, batchId, totalBatches, usersToProcess.length)

  } catch (error) {
    console.error('Error in batch CSV import:', error)
    return {
      success: false,
      message: 'Failed to execute batch CSV import',
      created: 0,
      updated: 0,
      failed: 0,
      errors: ['Failed to execute batch CSV import']
    }
  }
}

// Analyze file to determine optimal batching strategy
function analyzeFileForBatching(file: File, options: UpsertOptions) {
  const fileSizeKB = file.size / 1024
  const estimatedRows = Math.floor(fileSizeKB / 0.5) // Rough estimate: 0.5KB per row
  
  console.log(`📊 File Analysis: ${file.name} (${fileSizeKB.toFixed(1)}KB, ~${estimatedRows} estimated rows)`)

  // Auto-enable batching for large files
  const shouldUseBatching = options.useBatching || estimatedRows > 500
  const optimalBatchSize = options.batchSize || calculateOptimalBatchSize(estimatedRows)

  if (estimatedRows > 500 && !options.useBatching) {
    console.log(`🔄 Auto-enabled batching for large file (${estimatedRows} rows)`)
  }

  return {
    shouldUseBatching: shouldUseBatching && estimatedRows > optimalBatchSize,
    estimatedRows,
    optimalBatchSize
  }
}

// Filter users for processing based on options
function filterUsersForProcessing(users: ImportPreviewUser[], options: UpsertOptions): ImportPreviewUser[] {
  return users.filter(user => {
    if (user.validationErrors.length > 0) {
      if (!options.continueOnValidationError) return false
      if (options.autoFixPasswords && user.validationErrors.some(err => err.includes('password'))) {
        return true
      }
      return false
    }
    if (user.action === 'create' && !options.createNew) return false
    if (user.action === 'update' && !options.updateExisting) return false
    return true
  })
}

// Execute batched processing with optimization
async function executeBatchedProcessing(
  usersToProcess: ImportPreviewUser[],
  user: { id: string; companyId: string; role: string },
  options: UpsertOptions,
  batchSize: number,
  totalBatches: number,
  startTime: number
) {
  let totalCreated = 0
  let totalUpdated = 0
  let totalFailed = 0
  const allErrors: string[] = []
  const allRecoverableErrors: RecoverableError[] = []
  const allCriticalErrors: CriticalError[] = []

  // Process batches sequentially to avoid database overload
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batchStartTime = Date.now()
    const batchStart = batchIndex * batchSize
    const batchEnd = Math.min(batchStart + batchSize, usersToProcess.length)
    const batchUsers = usersToProcess.slice(batchStart, batchEnd)
    
    console.log(`📋 Processing batch ${batchIndex + 1}/${totalBatches} (${batchUsers.length} users)`)

    // Process batch with optimized password hashing
    const batchResult = await processBatchOptimized(batchUsers, user, options, batchIndex)
    
    totalCreated += batchResult.created
    totalUpdated += batchResult.updated
    totalFailed += batchResult.failed
    allErrors.push(...batchResult.errors)
    allRecoverableErrors.push(...(batchResult.recoverableErrors || []))
    allCriticalErrors.push(...(batchResult.criticalErrors || []))

    logBatchProgress(batchIndex, totalBatches, batchResult, batchStartTime, startTime)
  }

  return {
    totalCreated,
    totalUpdated,
    totalFailed,
    allErrors,
    allRecoverableErrors,
    allCriticalErrors
  }
}

// Optimized batch processor with parallel password hashing
async function processBatchOptimized(
  batchUsers: ImportPreviewUser[],
  user: { id: string; companyId: string; role: string },
  options: UpsertOptions,
  batchIndex: number
): Promise<ImportExecutionResult> {
  let created = 0
  let updated = 0
  let failed = 0
  const errors: string[] = []
  const recoverableErrors: RecoverableError[] = []
  const criticalErrors: CriticalError[] = []

  // Pre-hash all passwords in parallel for better performance
  console.log(`🔐 Pre-hashing ${batchUsers.length} passwords in parallel...`)
  const hashedPasswords = await hashPasswordsInParallel(batchUsers, options.autoFixPasswords || false)
  console.log(`✅ Password hashing completed for batch`)

  // Process users with pre-hashed passwords
  for (let i = 0; i < batchUsers.length; i++) {
    const userData = batchUsers[i]
    const hashedPassword = hashedPasswords[i]
    
    try {
      await prisma.$transaction(async (tx) => {
        if (userData.action === 'create') {
          await createUserInBatch(userData, user, hashedPassword, tx)
          created++
        } else if (userData.action === 'update' && userData.existingUserId) {
          const wasUpdated = await updateUserInBatch(userData, user, options, hashedPassword, tx)
          if (wasUpdated) updated++
        }
      })

    } catch (error) {
      const categorizedError = categorizeError(error, userData, batchIndex * (options.batchSize || 200) + i)
      
      if ('requiresAdminAction' in categorizedError) {
        criticalErrors.push(categorizedError)
        if (!options.skipOnError) {
          throw error
        }
      } else {
        recoverableErrors.push(categorizedError)
      }
      
      failed++
      errors.push(`Failed to process ${userData.name}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return {
    success: failed === 0 || ((created > 0 || updated > 0) && (options.skipOnError || false)),
    message: `Batch processed: ${created} created, ${updated} updated, ${failed} failed`,
    created,
    updated,
    failed,
    errors,
    recoverableErrors: recoverableErrors.length > 0 ? recoverableErrors : undefined,
    criticalErrors: criticalErrors.length > 0 ? criticalErrors : undefined
  }
}

// Create user in batch context
async function createUserInBatch(
  userData: ImportPreviewUser,
  user: { id: string; companyId: string },
  hashedPassword: string | null,
  tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]
): Promise<void> {
  // Find manager ID
  let managerId = null
  if (userData.managerPersonID || userData.managerEmployeeId) {
    const manager = await tx.user.findFirst({
      where: {
        companyId: user.companyId,
        role: { in: ['manager', 'hr'] },
        OR: [
          userData.managerPersonID ? { personID: userData.managerPersonID } : {},
          userData.managerEmployeeId ? { employeeId: userData.managerEmployeeId } : {}
        ].filter(condition => Object.keys(condition).length > 0)
      }
    })
    managerId = manager?.id || null
  }

  await tx.user.create({
    data: {
      name: userData.name,
      email: userData.email || null,
      username: userData.username || null,
      role: userData.role as 'employee' | 'manager' | 'hr',
      companyId: user.companyId,
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

// Update user in batch context
async function updateUserInBatch(
  userData: ImportPreviewUser,
  user: { id: string; companyId: string },
  options: UpsertOptions,
  hashedPassword: string | null,
  tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]
): Promise<boolean> {
  const currentUser = await tx.user.findUnique({
    where: { id: userData.existingUserId! }
  })

  if (!currentUser) {
    throw new Error(`User not found for update: ${userData.name}`)
  }

  const updateData: Record<string, unknown> = {}
  const fieldsToUpdate = options.selectedFields || [
    'name', 'email', 'username', 'role', 'department', 
    'userType', 'employeeId', 'position', 'shift'
  ]

  for (const field of fieldsToUpdate) {
    const newValue = (userData as unknown as Record<string, unknown>)[field]
    const currentValue = (currentUser as unknown as Record<string, unknown>)[field]
    
    if (newValue !== undefined && newValue !== currentValue) {
      updateData[field] = newValue
    }
  }

  if (userData.password && userData.password !== 'KEEP_EXISTING') {
    if (userData.userType === 'operational') {
      updateData.pinCode = userData.password
      updateData.passwordHash = null
      updateData.requiresPinOnly = true
    } else {
      updateData.passwordHash = hashedPassword
      updateData.pinCode = null
      updateData.requiresPinOnly = false
    }
  }

  if (Object.keys(updateData).length > 0) {
    await tx.user.update({
      where: { id: userData.existingUserId! },
      data: updateData
    })
    return true
  }

  return false
}

// Log batch progress
function logBatchProgress(
  batchIndex: number,
  totalBatches: number,
  batchResult: ImportExecutionResult,
  batchStartTime: number,
  overallStartTime: number
): void {
  const batchTime = Date.now() - batchStartTime
  const avgTimePerBatch = (Date.now() - overallStartTime) / (batchIndex + 1)
  const remainingBatches = totalBatches - (batchIndex + 1)
  const estimatedTimeRemaining = remainingBatches * avgTimePerBatch

  console.log(`✅ Batch ${batchIndex + 1} completed in ${batchTime}ms (${batchResult.created} created, ${batchResult.updated} updated, ${batchResult.failed} failed)`)
  console.log(`⏱️ Estimated time remaining: ${Math.round(estimatedTimeRemaining / 1000)}s`)
}

// Create comprehensive batch audit log
async function createBatchAuditLog(
  user: { id: string; companyId: string; role: string },
  file: File,
  batchId: string,
  batchResults: {
    totalCreated: number
    totalUpdated: number
    totalFailed: number
    allRecoverableErrors: RecoverableError[]
    allCriticalErrors: CriticalError[]
  },
  startTime: number,
  totalBatches: number,
  batchSize: number
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      companyId: user.companyId,
      userRole: user.role,
      timestamp: new Date(),
      action: 'csv_import_batch_execute',
      entityType: 'User',
      metadata: {
        fileName: file.name,
        batchId,
        totalBatches,
        batchSize,
        totalProcessed: batchResults.totalCreated + batchResults.totalUpdated + batchResults.totalFailed,
        created: batchResults.totalCreated,
        updated: batchResults.totalUpdated,
        failed: batchResults.totalFailed,
        executionTimeMs: Date.now() - startTime,
        recoverableErrorCount: batchResults.allRecoverableErrors.length,
        criticalErrorCount: batchResults.allCriticalErrors.length
      }
    }
  })
}

// Format batch results for return
function formatBatchResults(
  batchResults: {
    totalCreated: number
    totalUpdated: number
    totalFailed: number
    allErrors: string[]
    allRecoverableErrors: RecoverableError[]
    allCriticalErrors: CriticalError[]
  },
  batchId: string,
  totalBatches: number,
  totalUsers: number
): BatchedImportExecutionResult {
  const { totalCreated, totalUpdated, totalFailed, allErrors, allRecoverableErrors, allCriticalErrors } = batchResults
  const isSuccess = totalFailed === 0 || ((totalCreated > 0 || totalUpdated > 0))
  const partialSuccess = totalCreated > 0 || totalUpdated > 0

  console.log(`🎉 Batch processing completed: ${totalCreated} created, ${totalUpdated} updated, ${totalFailed} failed`)

  return {
    success: isSuccess,
    message: totalFailed === 0 ? 
      `Batch import completed successfully: ${totalCreated} created, ${totalUpdated} updated` :
      `Batch import completed with ${totalFailed} errors: ${totalCreated} created, ${totalUpdated} updated, ${totalFailed} failed`,
    created: totalCreated,
    updated: totalUpdated,
    failed: totalFailed,
    errors: allErrors,
    partialSuccess: partialSuccess && totalFailed > 0,
    recoverableErrors: allRecoverableErrors.length > 0 ? allRecoverableErrors : undefined,
    criticalErrors: allCriticalErrors.length > 0 ? allCriticalErrors : undefined,
    batchProcessingResult: {
      batchId,
      totalBatches,
      completed: true,
      progress: {
        batchesCompleted: totalBatches,
        totalUsers,
        processedUsers: totalUsers,
        created: totalCreated,
        updated: totalUpdated,
        failed: totalFailed
      }
    }
  }
}