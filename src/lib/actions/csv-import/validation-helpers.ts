// CSV Import Validation & Helper Functions
// Validation, error handling, and utility functions for CSV import processing

import bcrypt from 'bcryptjs'
import type { ImportPreviewUser, RecoverableError, CriticalError } from './types'

// Enhanced error categorization with detailed analysis
export function categorizeError(
  error: unknown, 
  userData: Partial<ImportPreviewUser>, 
  rowIndex: number
): RecoverableError | CriticalError {
  const errorMessage = error instanceof Error ? error.message : String(error)
  
  // Critical system errors
  if (errorMessage.includes('database') || errorMessage.includes('connection')) {
    return {
      errorType: 'database_connection',
      errorMessage: 'Database connection error - contact system administrator',
      timestamp: new Date(),
      requiresAdminAction: true
    } as CriticalError
  }
  
  if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
    return {
      errorType: 'permission_denied',
      errorMessage: 'Insufficient permissions to perform this operation',
      timestamp: new Date(),
      requiresAdminAction: true
    } as CriticalError
  }
  
  // Recoverable errors with suggested fixes
  if (errorMessage.includes('password')) {
    return {
      rowIndex,
      name: userData.name || 'Unknown',
      email: userData.email,
      errorType: 'password_weak',
      errorMessage: 'Password does not meet security requirements',
      suggestedFix: userData.userType === 'operational' ? 'Use 4-6 digit PIN' : 'Use 8+ character password with mixed case',
      canRetry: true
    } as RecoverableError
  }
  
  if (errorMessage.includes('duplicate') || errorMessage.includes('unique constraint')) {
    return {
      rowIndex,
      name: userData.name || 'Unknown',
      email: userData.email,
      errorType: 'duplicate',
      errorMessage: 'User already exists with this identifier',
      suggestedFix: 'Use different email, username, or employee ID, or enable update mode',
      canRetry: true
    } as RecoverableError
  }
  
  if (errorMessage.includes('manager')) {
    return {
      rowIndex,
      name: userData.name || 'Unknown',
      email: userData.email,
      errorType: 'manager_not_found',
      errorMessage: 'Manager not found in system',
      suggestedFix: 'Import manager first, or remove manager reference',
      canRetry: true
    } as RecoverableError
  }
  
  // General validation errors
  return {
    rowIndex,
    name: userData.name || 'Unknown',
    email: userData.email,
    errorType: 'validation',
    errorMessage: errorMessage,
    suggestedFix: 'Review data format and required fields',
    canRetry: true
  } as RecoverableError
}

// Auto-fix password generation with security best practices
export async function autoFixPassword(userData: Partial<ImportPreviewUser>): Promise<string> {
  if (userData.userType === 'operational') {
    // Generate secure 6-digit PIN
    return Math.floor(100000 + Math.random() * 900000).toString()
  } else {
    // Generate secure password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    
    // Ensure at least one of each character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)] // Uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)] // Lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)] // Number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)] // Special
    
    // Fill remaining characters
    for (let i = 4; i < 12; i++) {
      password += chars[Math.floor(Math.random() * chars.length)]
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }
}

// CSV conversion utilities
export function convertToCsv(data: Record<string, unknown>[]): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const rows = data.map(row => 
    headers.map(header => {
      const value = row[header] || ''
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
    }).join(',')
  )
  
  return [headers.join(','), ...rows].join('\n')
}

// Manual CSV parsing for retry operations
export function parseCSVManually(csvContent: string): Record<string, unknown>[] {
  const lines = csvContent.split('\n')
  const headers = lines[0].split(',')
  
  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = line.split(',')
    const obj: Record<string, unknown> = {}
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index]?.trim() || ''
    })
    return obj
  })
}

// Error analysis and recommendation generation
export function getRecommendedAction(error: RecoverableError): string {
  switch (error.errorType) {
    case 'password_weak':
      return 'Enable auto-fix passwords option or manually update password in CSV'
    case 'duplicate':
      return 'Enable update mode or remove duplicate entries from CSV'
    case 'manager_not_found':
      return 'Import managers first or remove manager references'
    case 'validation':
      return 'Review data format and ensure all required fields are provided'
    default:
      return 'Review error details and fix data accordingly'
  }
}

export function generateRecommendations(
  recoverableErrors: RecoverableError[], 
  criticalErrors: CriticalError[]
): string[] {
  const recommendations: string[] = []

  if (criticalErrors.length > 0) {
    recommendations.push('🚨 Critical errors detected - contact system administrator immediately')
  }

  const passwordErrors = recoverableErrors.filter(e => e.errorType === 'password_weak')
  if (passwordErrors.length > 0) {
    recommendations.push(`💡 ${passwordErrors.length} password errors can be auto-fixed by enabling "Auto-fix passwords" option`)
  }

  const duplicateErrors = recoverableErrors.filter(e => e.errorType === 'duplicate')
  if (duplicateErrors.length > 0) {
    recommendations.push(`🔄 ${duplicateErrors.length} duplicate users can be resolved by enabling "Update existing" mode`)
  }

  const managerErrors = recoverableErrors.filter(e => e.errorType === 'manager_not_found')
  if (managerErrors.length > 0) {
    recommendations.push(`👥 ${managerErrors.length} manager relationship errors - import managers first`)
  }

  if (recoverableErrors.length > 5) {
    recommendations.push('📊 Consider splitting large imports into smaller batches for better error management')
  }

  return recommendations
}

// Performance optimization helpers
export async function hashPasswordsInParallel(
  users: ImportPreviewUser[],
  autoFixPasswords: boolean
): Promise<(string | null)[]> {
  const passwordHashPromises = users.map(async (userData) => {
    // Auto-fix passwords if enabled
    if (autoFixPasswords && userData.validationErrors.some(err => err.includes('password'))) {
      userData.password = await autoFixPassword(userData)
      userData.validationErrors = userData.validationErrors.filter(err => !err.includes('password'))
    }
    
    if (userData.password && userData.userType !== 'operational') {
      return bcrypt.hash(userData.password, 12)
    }
    return null
  })

  return Promise.all(passwordHashPromises)
}

// Validation helpers
export function validateRequiredFields(userData: Partial<ImportPreviewUser>): string[] {
  const errors: string[] = []

  if (!userData.name || !userData.role) {
    errors.push('Missing name or role')
  }

  if (!userData.email && !userData.username) {
    errors.push('Missing email or username')
  }

  if (!userData.personID) {
    errors.push('Missing personID (national ID)')
  }

  return errors
}

export function validatePasswordRequirements(userData: Partial<ImportPreviewUser>): string[] {
  const errors: string[] = []

  if (!userData.password) {
    errors.push('Password is required')
  } else if (userData.userType === 'operational') {
    if (!/^\d{4,6}$/.test(userData.password)) {
      errors.push('Operational user PIN must be 4-6 digits')
    }
  } else {
    if (userData.password.length < 8) {
      errors.push('Password must be at least 8 characters')
    }
  }

  return errors
}

// Batch size optimization
export function calculateOptimalBatchSize(estimatedRows: number, systemCapacity: 'low' | 'medium' | 'high' = 'medium'): number {
  const baseSize = {
    low: 100,
    medium: 200,
    high: 300
  }

  const size = baseSize[systemCapacity]

  // Adjust based on file size
  if (estimatedRows < 500) return Math.min(estimatedRows, size / 2)
  if (estimatedRows > 5000) return Math.max(size, 250)
  
  return size
}