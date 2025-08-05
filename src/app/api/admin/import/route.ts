import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'
import bcrypt from 'bcryptjs'

// POST /api/admin/import - Import users from CSV data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { users, companyId } = body

    if (!users || !Array.isArray(users)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Users array is required' 
      }, { status: 400 })
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

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
          managerEmail 
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

        // Use provided companyId or find company by code
        let targetCompanyId = companyId
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

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
          where: {
            AND: [
              { companyId: targetCompanyId },
              {
                OR: [
                  email ? { email } : {},
                  username ? { username } : {}
                ]
              }
            ]
          }
        })

        if (existingUser) {
          results.failed++
          results.errors.push(`User already exists: ${email || username}`)
          continue
        }

        // Find manager if specified
        let managerId = null
        if (managerEmail) {
          const manager = await prisma.user.findFirst({
            where: { 
              email: managerEmail,
              companyId: targetCompanyId 
            }
          })
          if (manager) {
            managerId = manager.id
          } else {
            results.errors.push(`Manager not found: ${managerEmail} for user ${name}`)
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
      results
    })
  } catch (error) {
    console.error('Error importing users:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to import users' 
    }, { status: 500 })
  }
}