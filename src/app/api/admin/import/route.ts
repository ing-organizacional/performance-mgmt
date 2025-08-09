import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'
import bcrypt from 'bcryptjs'
import { requireHRRole } from '@/lib/auth-middleware'
import { rateLimit } from '@/lib/rate-limit'
import { 
  importUserSchema, 
  validationError, 
  parseCSV,
  validateFile 
} from '@/lib/validation'

interface ImportResults {
  success: number
  failed: number
  errors: string[]
}

// POST /api/admin/import - Import users from CSV file
export async function POST(request: NextRequest) {
  // Rate limiting for sensitive admin import endpoint
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')  
  const ip = forwardedFor?.split(',')[0] || realIp || request.headers.get('host') || 'unknown'
  
  const rateLimitResult = rateLimit(
    `admin-import:${ip}`,
    { maxAttempts: 10, windowMs: 60 * 60 * 1000 } // 10 attempts per hour for admin operations
  )
  
  if (!rateLimitResult.success) {
    return NextResponse.json({
      success: false,
      error: 'Too many import requests. Please try again later.'
    }, { 
      status: 429,
      headers: {
        'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
      }
    })
  }

  const authResult = await requireHRRole()
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { user } = authResult

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return validationError('CSV file is required')
    }

    // Enhanced file validation
    const fileValidation = validateFile(file, 10 * 1024 * 1024, ['text/csv', 'application/csv', 'text/plain'])
    if (!fileValidation.valid) {
      return validationError(fileValidation.error)
    }

    if (!file.name.endsWith('.csv')) {
      return validationError('File must have .csv extension')
    }

    // Parse CSV with comprehensive validation
    const csvResult = await parseCSV(file, importUserSchema, {
      skipHeader: true,
      maxRows: 1000,
      allowPartialValidation: true
    })

    if (!csvResult.success) {
      return validationError(`CSV parsing failed: ${csvResult.error}`)
    }

    const { data: users, errors: parseErrors } = csvResult

    if (users.length === 0) {
      return validationError('No valid user data found in CSV', parseErrors)
    }

    // Log parsing warnings if any
    if (parseErrors.length > 0) {
      console.warn('CSV parsing warnings:', parseErrors.slice(0, 10)) // Log first 10 warnings
    }

    const results: ImportResults = {
      success: 0,
      failed: 0,
      errors: []
    }

    // Use the current user's company as default
    const finalCompanyId = user.companyId

    for (const userData of users) {
      try {
        const { 
          name, 
          email, 
          username, 
          role, 
          department, 
          userType, 
          password, 
          employeeId,
          personID,
          managerPersonID,
          managerEmployeeId 
        } = userData

        // Validate required fields
        if (!name || !role) {
          results.failed++
          results.errors.push(`Row skipped - missing name or role: ${JSON.stringify(userData)}`)
          continue
        }

        if (!email && !username) {
          results.failed++
          results.errors.push(`Row skipped - missing email or username: ${name}`)
          continue
        }

        if (!personID) {
          results.failed++
          results.errors.push(`Row skipped - missing personID (national ID): ${name}`)
          continue
        }

        // Use provided companyId or authenticated user's company
        let targetCompanyId = finalCompanyId
        if (!targetCompanyId && userData.companyCode) {
          const company = await prisma.company.findFirst({
            where: { code: userData.companyCode }
          })
          if (!company) {
            results.failed++
            results.errors.push(`Company not found: ${userData.companyCode} for user ${name}`)
            continue
          }
          targetCompanyId = company.id
        }

        if (!targetCompanyId) {
          results.failed++
          results.errors.push(`No company specified for user: ${name}`)
          continue
        }

        // Ensure user can only import to their own company
        if (targetCompanyId !== user.companyId) {
          results.failed++
          results.errors.push(`Access denied - cannot import to different company: ${name}`)
          continue
        }

        // Check if user already exists (email, username, employeeId, or personID)
        const existingUser = await prisma.user.findFirst({
          where: {
            AND: [
              { companyId: targetCompanyId },
              {
                OR: [
                  email ? { email } : {},
                  username ? { username } : {},
                  employeeId ? { employeeId } : {},
                  personID ? { personID } : {}
                ].filter(condition => Object.keys(condition).length > 0)
              }
            ]
          }
        })

        if (existingUser) {
          results.failed++
          // Provide specific error message about which field conflicts
          const conflictField = 
            existingUser.email === email ? `email: ${email}` :
            existingUser.username === username ? `username: ${username}` :
            existingUser.employeeId === employeeId ? `employeeId: ${employeeId}` :
            existingUser.personID === personID ? `personID: ${personID}` :
            'unknown field'
          results.errors.push(`User already exists with ${conflictField}`)
          continue
        }

        // Find manager if specified (try personID first, then employeeId)
        let managerId = null
        if (managerPersonID || managerEmployeeId) {
          const manager = await prisma.user.findFirst({
            where: { 
              AND: [
                { companyId: targetCompanyId },
                { role: { in: ['manager', 'hr'] } }, // Ensure only managers/HR can be assigned as managers
                {
                  OR: [
                    managerPersonID ? { personID: managerPersonID } : {},
                    managerEmployeeId ? { employeeId: managerEmployeeId } : {}
                  ].filter(condition => Object.keys(condition).length > 0)
                }
              ]
            }
          })
          if (manager) {
            managerId = manager.id
          } else {
            const identifier = managerPersonID ? `PersonID: ${managerPersonID}` : `EmployeeID: ${managerEmployeeId}`
            results.errors.push(`Manager not found with ${identifier} for user ${name}`)
          }
        }

        // Validate password is provided
        if (!password || password.trim().length === 0) {
          results.failed++
          results.errors.push(`Password is required for user: ${name}`)
          continue
        }

        // Validate password strength (minimum requirements)
        if (userType === 'operational') {
          // PIN validation for operational users
          if (!/^\d{4,6}$/.test(password)) {
            results.failed++
            results.errors.push(`Operational user PIN must be 4-6 digits for user: ${name}`)
            continue
          }
        } else {
          // Password validation for office users
          if (password.length < 8) {
            results.failed++
            results.errors.push(`Password must be at least 8 characters for user: ${name}`)
            continue
          }
        }

        // Create user
        await prisma.user.create({
          data: {
            name,
            email: email || null,
            username: username || null,
            role,
            companyId: targetCompanyId,
            managerId,
            department: department || null,
            employeeId: employeeId || null,
            personID: personID,
            userType: userType || 'office',
            passwordHash: password ? await bcrypt.hash(password, 12) : null,
            pinCode: (userType === 'operational' && password) ? password : null,
            requiresPinOnly: userType === 'operational',
            loginMethod: email ? 'email' : 'username',
            active: true
          }
        })

        results.success++
      } catch (error) {
        results.failed++
        results.errors.push(`Failed to create user ${userData.name}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed: ${results.success} created, ${results.failed} failed`,
      imported: results.success,
      failed: results.failed,
      errors: results.errors
    })
  } catch (error) {
    console.error('Error importing users:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to import users' 
    }, { status: 500 })
  }
}