import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'
import bcrypt from 'bcryptjs'
import { requireHRRole } from '@/lib/auth-middleware'

interface ImportUserData {
  name: string
  email?: string
  username?: string
  role: string
  department?: string
  userType?: string
  password?: string
  employeeId?: string
  personID?: string
  managerPersonID?: string
  managerEmployeeId?: string
  companyCode?: string
}

interface ImportResults {
  success: number
  failed: number
  errors: string[]
}

// POST /api/admin/import - Import users from CSV file
export async function POST(request: NextRequest) {
  const authResult = await requireHRRole()
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { user } = authResult

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'CSV file is required' 
      }, { status: 400 })
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ 
        success: false, 
        error: 'File must be a CSV' 
      }, { status: 400 })
    }

    // Parse CSV file
    const csvText = await file.text()
    const lines = csvText.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json({ 
        success: false, 
        error: 'CSV must have header row and at least one data row' 
      }, { status: 400 })
    }

    // Parse header row
    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''))
    
    // Parse data rows
    const users: ImportUserData[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''))
      if (values.length !== headers.length) continue // Skip malformed rows
      
      const userData: Partial<ImportUserData> = {}
      headers.forEach((header, index) => {
        const value = values[index]
        if (value && value !== '') {
          (userData as Record<string, string>)[header] = value
        }
      })
      
      // Only add users with required fields
      if (userData.name && userData.role) {
        users.push(userData as ImportUserData)
      }
    }

    if (users.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No valid user data found in CSV' 
      }, { status: 400 })
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
            passwordHash: await bcrypt.hash(password || 'changeme123', 12),
            pinCode: (userType === 'operational') ? (password || '1234') : null,
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