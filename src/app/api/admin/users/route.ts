import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'
import bcrypt from 'bcryptjs'

// GET /api/admin/users - List all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        company: {
          select: { name: true, code: true }
        },
        manager: {
          select: { name: true, email: true }
        },
        _count: {
          select: {
            employees: true,
            evaluationsReceived: true
          }
        }
      },
      orderBy: [
        { company: { name: 'asc' } },
        { name: 'asc' }
      ]
    })
    
    return NextResponse.json({
      success: true,
      data: users,
      count: users.length
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch users' 
    }, { status: 500 })
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      email, 
      username, 
      role, 
      companyId, 
      managerId, 
      userType, 
      password, 
      pinCode,
      department,
      employeeId 
    } = body

    // Validation
    if (!name || !role || !companyId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name, role, and companyId are required' 
      }, { status: 400 })
    }

    if (!email && !username) {
      return NextResponse.json({ 
        success: false, 
        error: 'Either email or username is required' 
      }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        AND: [
          { companyId },
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
      return NextResponse.json({ 
        success: false, 
        error: 'User with this email/username already exists in this company' 
      }, { status: 409 })
    }

    // Hash password
    const passwordHash = password ? await bcrypt.hash(password, 12) : null

    const user = await prisma.user.create({
      data: {
        name,
        email: email || null,
        username: username || null,
        role,
        companyId,
        managerId: managerId || null,
        userType: userType || 'office',
        passwordHash,
        pinCode: pinCode || (userType === 'operational' ? password : null),
        requiresPinOnly: userType === 'operational',
        loginMethod: email ? 'email' : 'username',
        department: department || null,
        employeeId: employeeId || null,
        active: true
      },
      include: {
        company: { select: { name: true, code: true } },
        manager: { select: { name: true, email: true } }
      }
    })

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create user' 
    }, { status: 500 })
  }
}