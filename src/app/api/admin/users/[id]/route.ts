import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'
import bcrypt from 'bcryptjs'
import { requireHRRole } from '@/lib/auth-middleware'

interface UserUpdateData {
  name?: string
  email?: string | null
  username?: string | null
  role?: string
  managerId?: string | null
  userType?: string
  department?: string | null
  employeeId?: string | null
  active?: boolean
  passwordHash?: string
  pinCode?: string | null
}

// GET /api/admin/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireHRRole(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { user: authUser } = authResult

  try {
    const { id } = await params
    
    const user = await prisma.user.findUnique({
      where: { 
        id,
        companyId: authUser.companyId
      },
      include: {
        company: { select: { name: true, code: true } },
        manager: { select: { name: true, email: true } },
        employees: { select: { name: true, email: true, role: true } },
        evaluationsReceived: {
          select: { id: true, periodType: true, periodDate: true, status: true, overallRating: true },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch user' 
    }, { status: 500 })
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireHRRole(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { user: authUser } = authResult

  try {
    const { id } = await params
    const body = await request.json()
    const { 
      name, 
      email, 
      username, 
      role, 
      managerId, 
      userType, 
      password, 
      department,
      employeeId,
      active 
    } = body

    // Check if user exists in same company
    const existingUser = await prisma.user.findUnique({
      where: { 
        id,
        companyId: authUser.companyId
      }
    })

    if (!existingUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Prepare update data
    const updateData: UserUpdateData = {
      name: name || existingUser.name,
      email: email !== undefined ? email : existingUser.email,
      username: username !== undefined ? username : existingUser.username,
      role: role || existingUser.role,
      managerId: managerId !== undefined ? managerId : existingUser.managerId,
      userType: userType || existingUser.userType,
      department: department !== undefined ? department : existingUser.department,
      employeeId: employeeId !== undefined ? employeeId : existingUser.employeeId,
      active: active !== undefined ? active : existingUser.active
    }

    // Hash new password if provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12)
      if (userType === 'operational') {
        updateData.pinCode = password
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        company: { select: { name: true, code: true } },
        manager: { select: { name: true, email: true } }
      }
    })

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update user' 
    }, { status: 500 })
  }
}

// DELETE /api/admin/users/[id] - Delete user (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireHRRole(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { user: authUser } = authResult

  try {
    const { id } = await params

    // Soft delete - just set active to false
    const user = await prisma.user.update({
      where: { 
        id,
        companyId: authUser.companyId
      },
      data: { active: false },
      select: { name: true, email: true, username: true }
    })

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User deactivated successfully'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete user' 
    }, { status: 500 })
  }
}