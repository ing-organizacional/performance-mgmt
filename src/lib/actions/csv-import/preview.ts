/**
 * CSV Import Preview Functions
 * 
 * Handles CSV file analysis, validation, and preview generation
 * for the user import system with comprehensive error reporting.
 */

'use server'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'
import { requireHRRole } from '@/lib/auth-middleware'
import { importUserSchema, parseCSV, validateFile } from '@/lib/validation'
import type {
  ImportPreviewResult,
  ImportPreviewUser,
  ExistingUser,
  ManagerUser
} from './types'
import {
  validateRequiredFields,
  validatePasswordRequirements
} from './validation-helpers'

// CSV Import Preview Server Action
export async function previewCSVImport(formData: FormData): Promise<ImportPreviewResult> {
  const startTime = Date.now()
  
  try {
    const authResult = await requireHRRole()
    if (authResult instanceof NextResponse) {
      return {
        success: false,
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        createCount: 0,
        updateCount: 0,
        users: [],
        globalErrors: ['Authentication failed'],
        parseErrors: []
      }
    }

    const { user } = authResult
    const file = formData.get('file') as File
    
    if (!file) {
      return {
        success: false,
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        createCount: 0,
        updateCount: 0,
        users: [],
        globalErrors: ['CSV file is required'],
        parseErrors: []
      }
    }

    // Validate file format and size
    const validation = validateFile(file)
    if (!validation.valid) {
      return {
        success: false,
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        createCount: 0,
        updateCount: 0,
        users: [],
        globalErrors: [validation.error],
        parseErrors: []
      }
    }

    // Parse CSV
    const parseResult = await parseCSV(file, importUserSchema, { 
      skipHeader: true,
      maxRows: 10000 // Reasonable limit for preview
    })
    
    if (!parseResult.success) {
      return {
        success: false,
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        createCount: 0,
        updateCount: 0,
        users: [],
        globalErrors: ['Failed to parse CSV file'],
        parseErrors: [parseResult.error]
      }
    }

    const users = parseResult.data
    let validRows = 0
    let createCount = 0
    let updateCount = 0
    const previewUsers: ImportPreviewUser[] = []

    // Get existing users for duplicate detection
    const existingUsers = await prisma.user.findMany({
      where: { companyId: user.companyId },
      select: {
        id: true,
        email: true,
        username: true,
        employeeId: true,
        personID: true
      }
    })

    // Get managers for relationship validation
    const managers = await prisma.user.findMany({
      where: {
        companyId: user.companyId,
        role: { in: ['manager', 'hr'] }
      },
      select: {
        id: true,
        personID: true,
        employeeId: true,
        name: true
      }
    })

    // Process each user for preview
    for (const userData of users) {
      const validationErrors: string[] = []
      let action: 'create' | 'update' = 'create'
      let existingUserId: string | null = null
      let managerFound = true

      // Validate required fields
      validationErrors.push(...validateRequiredFields(userData))

      // Check for existing user
      const existingUser = existingUsers.find((u: ExistingUser) => 
        (userData.email && u.email === userData.email) ||
        (userData.username && u.username === userData.username) ||
        (userData.employeeId && u.employeeId === userData.employeeId) ||
        (userData.personID && u.personID === userData.personID)
      )

      if (existingUser) {
        action = 'update'
        existingUserId = existingUser.id
        updateCount++
      } else {
        createCount++
      }

      // Validate manager relationship
      if (userData.managerPersonID || userData.managerEmployeeId) {
        const manager = managers.find((m: ManagerUser) => 
          (userData.managerPersonID && m.personID === userData.managerPersonID) ||
          (userData.managerEmployeeId && m.employeeId === userData.managerEmployeeId)
        )
        if (!manager) {
          managerFound = false
          const identifier = userData.managerPersonID ? 
            `PersonID: ${userData.managerPersonID}` : 
            `EmployeeID: ${userData.managerEmployeeId}`
          validationErrors.push(`Manager not found with ${identifier}`)
        }
      }

      // Validate password requirements
      validationErrors.push(...validatePasswordRequirements(userData))

      if (validationErrors.length === 0) {
        validRows++
      }

      previewUsers.push({
        name: userData.name,
        email: userData.email,
        username: userData.username,
        role: userData.role,
        department: userData.department,
        userType: userData.userType || 'office',
        employeeId: userData.employeeId,
        personID: userData.personID || '',
        managerPersonID: userData.managerPersonID,
        managerEmployeeId: userData.managerEmployeeId,
        companyCode: userData.companyCode,
        position: userData.position,
        shift: userData.shift,
        password: userData.password || '',
        action,
        existingUserId,
        validationErrors,
        managerFound
      })
    }

    // Log preview operation
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        userRole: user.role,
        timestamp: new Date(),
        action: 'csv_import_preview',
        entityType: 'User',
        metadata: {
          fileName: file.name,
          totalRows: users.length,
          validRows,
          invalidRows: users.length - validRows,
          createCount,
          updateCount,
          executionTimeMs: Date.now() - startTime
        }
      }
    })

    return {
      success: true,
      totalRows: users.length,
      validRows,
      invalidRows: users.length - validRows,
      createCount,
      updateCount,
      users: previewUsers,
      globalErrors: [],
      parseErrors: []
    }

  } catch (error) {
    console.error('Error previewing CSV import:', error)
    return {
      success: false,
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      createCount: 0,
      updateCount: 0,
      users: [],
      globalErrors: ['Failed to preview CSV import'],
      parseErrors: []
    }
  }
}