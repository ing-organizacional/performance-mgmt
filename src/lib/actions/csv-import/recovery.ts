// CSV Import Error Recovery Functions
// Advanced error recovery and retry functionality

'use server'

import { NextResponse } from 'next/server'
import { requireHRRole } from '@/lib/auth-middleware'
import type {
  RecoverableError,
  CriticalError,
  RetryImportResult,
  ErrorReportResult
} from './types'
import {
  parseCSVManually,
  convertToCsv,
  getRecommendedAction,
  generateRecommendations
} from './validation-helpers'

// Retry failed rows with fixes applied
export async function retryFailedRows(
  originalFormData: FormData,
  recoverableErrors: RecoverableError[],
  fixedData: { rowIndex: number; fixes: Record<string, unknown> }[]
): Promise<RetryImportResult> {
  try {
    const authResult = await requireHRRole()
    if (authResult instanceof NextResponse) {
      return {
        success: false,
        message: 'Authentication failed',
        created: 0,
        updated: 0,
        failed: 0,
        errors: ['Authentication failed'],
        retriedRows: 0,
        originalErrors: recoverableErrors
      }
    }

    // Parse the original CSV again
    const file = originalFormData.get('file') as File
    if (!file) {
      return {
        success: false,
        message: 'Original file not found',
        created: 0,
        updated: 0,
        failed: 0,
        errors: ['Original file not found'],
        retriedRows: 0,
        originalErrors: recoverableErrors
      }
    }

    const csvContent = await file.text()
    
    // Parse CSV manually for fixing
    const data = parseCSVManually(csvContent)

    // Apply fixes to the failed rows
    const fixedUsers = data.map((user: Record<string, unknown>, index: number) => {
      const fix = fixedData.find(f => f.rowIndex === index)
      if (fix) {
        return { ...user, ...fix.fixes }
      }
      return user
    })

    // Filter to only retry the previously failed rows
    const usersToRetry = fixedUsers.filter((_: Record<string, unknown>, index: number) => 
      recoverableErrors.some(err => err.rowIndex === index)
    )

    // Create new FormData with fixed CSV
    const fixedCsv = convertToCsv(usersToRetry)
    const fixedFile = new File([fixedCsv], `fixed_${file.name}`, { type: 'text/csv' })
    const newFormData = new FormData()
    newFormData.append('file', fixedFile)

    // Execute the import with retry-friendly options
    const { executeCSVImport } = await import('./core')
    const result = await executeCSVImport(newFormData, {
      updateExisting: true,
      createNew: true,
      requireConfirmation: false,
      skipOnError: true,
      continueOnValidationError: true,
      autoFixPasswords: true
    })

    return {
      ...result,
      retriedRows: usersToRetry.length,
      originalErrors: recoverableErrors
    }

  } catch (error) {
    console.error('Error retrying failed rows:', error)
    return {
      success: false,
      message: 'Failed to retry import',
      created: 0,
      updated: 0,
      failed: 0,
      errors: ['Failed to retry import'],
      retriedRows: 0,
      originalErrors: recoverableErrors
    }
  }
}

// Generate comprehensive error report with recommendations
export async function generateErrorReport(
  recoverableErrors: RecoverableError[], 
  criticalErrors: CriticalError[]
): Promise<ErrorReportResult> {
  try {
    const authResult = await requireHRRole()
    if (authResult instanceof NextResponse) {
      return { success: false, error: 'Authentication failed' }
    }

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalRecoverableErrors: recoverableErrors.length,
        totalCriticalErrors: criticalErrors.length,
        errorCategories: {
          validation: recoverableErrors.filter(e => e.errorType === 'validation').length,
          duplicate: recoverableErrors.filter(e => e.errorType === 'duplicate').length,
          managerNotFound: recoverableErrors.filter(e => e.errorType === 'manager_not_found').length,
          passwordWeak: recoverableErrors.filter(e => e.errorType === 'password_weak').length,
          databaseConnection: criticalErrors.filter(e => e.errorType === 'database_connection').length,
          permissionDenied: criticalErrors.filter(e => e.errorType === 'permission_denied').length,
          systemError: criticalErrors.filter(e => e.errorType === 'system_error').length
        }
      },
      recoverableErrors: recoverableErrors.map(error => ({
        ...error,
        recommendedAction: getRecommendedAction(error)
      })),
      criticalErrors,
      recommendations: generateRecommendations(recoverableErrors, criticalErrors)
    }

    return { success: true, report }

  } catch (error) {
    console.error('Error generating error report:', error)
    return { success: false, error: 'Failed to generate error report' }
  }
}

// Smart error recovery suggestions
export async function generateRecoverySuggestions(
  errors: RecoverableError[]
): Promise<{
  autoFixable: RecoverableError[]
  manualFixRequired: RecoverableError[]
  suggestions: {
    enableAutoFix: boolean
    enableUpdateMode: boolean
    splitIntoSmallerBatches: boolean
    importManagersFirst: boolean[]
  }
}> {
  const autoFixable = errors.filter(e => 
    e.errorType === 'password_weak' && e.canRetry
  )
  
  const manualFixRequired = errors.filter(e => 
    !autoFixable.includes(e)
  )

  const passwordErrors = errors.filter(e => e.errorType === 'password_weak')
  const duplicateErrors = errors.filter(e => e.errorType === 'duplicate')
  const managerErrors = errors.filter(e => e.errorType === 'manager_not_found')

  return {
    autoFixable,
    manualFixRequired,
    suggestions: {
      enableAutoFix: passwordErrors.length > 0,
      enableUpdateMode: duplicateErrors.length > 0,
      splitIntoSmallerBatches: errors.length > 10,
      importManagersFirst: managerErrors.map(e => e.canRetry)
    }
  }
}

// Validate fixes before retry
export async function validateFixes(
  originalErrors: RecoverableError[],
  proposedFixes: { rowIndex: number; fixes: Record<string, unknown> }[]
): Promise<{
  validFixes: { rowIndex: number; fixes: Record<string, unknown> }[]
  invalidFixes: { rowIndex: number; error: string }[]
  readyForRetry: boolean
}> {
  const validFixes: { rowIndex: number; fixes: Record<string, unknown> }[] = []
  const invalidFixes: { rowIndex: number; error: string }[] = []

  for (const fix of proposedFixes) {
    const originalError = originalErrors.find(e => e.rowIndex === fix.rowIndex)
    
    if (!originalError) {
      invalidFixes.push({
        rowIndex: fix.rowIndex,
        error: 'No corresponding original error found'
      })
      continue
    }

    // Validate fix based on error type
    const validation = validateFixForErrorType(originalError, fix.fixes)
    
    if (validation.isValid) {
      validFixes.push(fix)
    } else {
      invalidFixes.push({
        rowIndex: fix.rowIndex,
        error: validation.error
      })
    }
  }

  return {
    validFixes,
    invalidFixes,
    readyForRetry: invalidFixes.length === 0 && validFixes.length > 0
  }
}

// Validate individual fix for specific error type
function validateFixForErrorType(
  originalError: RecoverableError,
  fixes: Record<string, unknown>
): { isValid: boolean; error: string } {
  switch (originalError.errorType) {
    case 'password_weak':
      const password = fixes.password as string
      if (!password) {
        return { isValid: false, error: 'Password fix is required' }
      }
      if (fixes.userType === 'operational') {
        if (!/^\d{4,6}$/.test(password)) {
          return { isValid: false, error: 'PIN must be 4-6 digits' }
        }
      } else {
        if (password.length < 8) {
          return { isValid: false, error: 'Password must be at least 8 characters' }
        }
      }
      break

    case 'duplicate':
      const hasIdentifierChange = Boolean(
        fixes.email || fixes.username || fixes.employeeId || fixes.personID
      )
      if (!hasIdentifierChange) {
        return { isValid: false, error: 'Must change at least one identifier (email, username, employeeId, or personID)' }
      }
      break

    case 'manager_not_found':
      const hasManagerChange = Boolean(
        fixes.managerPersonID || fixes.managerEmployeeId
      )
      if (!hasManagerChange) {
        return { isValid: false, error: 'Must provide valid manager identifier or remove manager reference' }
      }
      break

    case 'validation':
      // Generic validation - check that required fields are provided
      if (fixes.name === undefined && originalError.errorMessage.includes('name')) {
        return { isValid: false, error: 'Name is required' }
      }
      if (fixes.role === undefined && originalError.errorMessage.includes('role')) {
        return { isValid: false, error: 'Role is required' }
      }
      break
  }

  return { isValid: true, error: '' }
}

// Bulk apply common fixes
export async function bulkApplyCommonFixes(
  errors: RecoverableError[]
): Promise<{ rowIndex: number; fixes: Record<string, unknown> }[]> {
  const fixes: { rowIndex: number; fixes: Record<string, unknown> }[] = []

  for (const error of errors) {
    const rowFix: Record<string, unknown> = {}

    switch (error.errorType) {
      case 'password_weak':
        // Auto-generate password based on user type
        if (error.email && error.email.includes('operational')) {
          rowFix.password = Math.floor(100000 + Math.random() * 900000).toString()
          rowFix.userType = 'operational'
        } else {
          // Generate secure password
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
          let password = ''
          password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
          password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
          password += '0123456789'[Math.floor(Math.random() * 10)]
          password += '!@#$%^&*'[Math.floor(Math.random() * 8)]
          for (let i = 4; i < 12; i++) {
            password += chars[Math.floor(Math.random() * chars.length)]
          }
          rowFix.password = password.split('').sort(() => Math.random() - 0.5).join('')
        }
        break

      case 'duplicate':
        // Suggest appending timestamp to make unique
        if (error.email) {
          const timestamp = Date.now().toString().slice(-6)
          const [localPart, domain] = error.email.split('@')
          rowFix.email = `${localPart}_${timestamp}@${domain}`
        }
        break

      case 'manager_not_found':
        // Remove manager reference as fallback
        rowFix.managerPersonID = null
        rowFix.managerEmployeeId = null
        break
    }

    if (Object.keys(rowFix).length > 0) {
      fixes.push({
        rowIndex: error.rowIndex,
        fixes: rowFix
      })
    }
  }

  return fixes
}