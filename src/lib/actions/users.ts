'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma-client'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { auditUserManagement } from '@/lib/services/audit-service'

// Validation schemas
const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  username: z.string().min(1, 'Username is required').optional().or(z.literal('')),
  role: z.enum(['hr', 'manager', 'employee'], { 
    message: 'Role must be hr, manager, or employee'
  }),
  companyId: z.string().min(1, 'Company is required'),
  managerId: z.string().optional().or(z.literal('')),
  userType: z.enum(['office', 'operational']).default('office'),
  department: z.string().optional().or(z.literal('')),
  employeeId: z.string().optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  pinCode: z.string().optional().or(z.literal(''))
})

const editUserSchema = userSchema.extend({
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal(''))
})

async function requireHRAccess() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'hr') {
    throw new Error('Access denied - HR role required')
  }
  return session.user
}

export async function createUser(formData: FormData) {
  try {
    const currentUser = await requireHRAccess()

    const rawData = {
      name: formData.get('name'),
      email: formData.get('email'),
      username: formData.get('username'),
      role: formData.get('role'),
      companyId: formData.get('companyId'),
      managerId: formData.get('managerId'),
      userType: formData.get('userType') || 'office',
      department: formData.get('department'),
      employeeId: formData.get('employeeId'),
      password: formData.get('password'),
      pinCode: formData.get('pinCode')
    }

    const result = userSchema.safeParse(rawData)
    
    if (!result.success) {
      return {
        success: false,
        errors: result.error.flatten().fieldErrors,
        message: 'Validation failed'
      }
    }

    const userData = result.data

    // Check for existing email/username
    const existingUser = await prisma.user.findFirst({
      where: {
        companyId: userData.companyId,
        OR: [
          userData.email ? { email: userData.email } : {},
          userData.username ? { username: userData.username } : {}
        ].filter(condition => Object.keys(condition).length > 0)
      }
    })

    if (existingUser) {
      return {
        success: false,
        message: 'User with this email or username already exists',
        errors: {}
      }
    }

    // Hash password if provided
    let passwordHash: string | undefined
    if (userData.password) {
      passwordHash = await bcrypt.hash(userData.password, 12)
    }

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email || null,
        username: userData.username || null,
        role: userData.role,
        companyId: userData.companyId,
        managerId: userData.managerId || null,
        userType: userData.userType,
        department: userData.department || null,
        employeeId: userData.employeeId || null,
        passwordHash,
        pinCode: userData.pinCode || null,
        requiresPinOnly: userData.userType === 'operational' && !!userData.pinCode
      }
    })

    // Audit the user creation
    await auditUserManagement(
      currentUser.id,
      currentUser.role,
      userData.companyId,
      'create',
      newUser.id,
      undefined,
      {
        name: userData.name,
        email: userData.email,
        username: userData.username,
        role: userData.role,
        department: userData.department,
        userType: userData.userType
      }
    )

    revalidatePath('/users')
    return {
      success: true,
      message: 'User created successfully'
    }
  } catch (error) {
    console.error('Error creating user:', error)
    return {
      success: false,
      message: 'Failed to create user',
      errors: {}
    }
  }
}

export async function updateUser(userId: string, formData: FormData) {
  try {
    await requireHRAccess()

    const rawData = {
      name: formData.get('name'),
      email: formData.get('email'),
      username: formData.get('username'),
      role: formData.get('role'),
      companyId: formData.get('companyId'),
      managerId: formData.get('managerId'),
      userType: formData.get('userType') || 'office',
      department: formData.get('department'),
      employeeId: formData.get('employeeId'),
      password: formData.get('password'),
      pinCode: formData.get('pinCode')
    }

    const result = editUserSchema.safeParse(rawData)
    
    if (!result.success) {
      return {
        success: false,
        errors: result.error.flatten().fieldErrors,
        message: 'Validation failed'
      }
    }

    const userData = result.data

    // Check for existing email/username (excluding current user)
    const existingUser = await prisma.user.findFirst({
      where: {
        companyId: userData.companyId,
        id: { not: userId },
        OR: [
          userData.email ? { email: userData.email } : {},
          userData.username ? { username: userData.username } : {}
        ].filter(condition => Object.keys(condition).length > 0)
      }
    })

    if (existingUser) {
      return {
        success: false,
        message: 'User with this email or username already exists',
        errors: {}
      }
    }

    // Prepare update data
    const updateData: {
      name: string
      email: string | null
      username: string | null
      role: string
      companyId: string
      managerId: string | null
      userType: string
      department: string | null
      employeeId: string | null
      pinCode: string | null
      requiresPinOnly: boolean
      passwordHash?: string
    } = {
      name: userData.name,
      email: userData.email || null,
      username: userData.username || null,
      role: userData.role,
      companyId: userData.companyId,
      managerId: userData.managerId || null,
      userType: userData.userType,
      department: userData.department || null,
      employeeId: userData.employeeId || null,
      pinCode: userData.pinCode || null,
      requiresPinOnly: userData.userType === 'operational' && !!userData.pinCode
    }

    // Hash password if provided
    if (userData.password) {
      updateData.passwordHash = await bcrypt.hash(userData.password, 12)
    }

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    revalidatePath('/users')
    return {
      success: true,
      message: 'User updated successfully'
    }
  } catch (error) {
    console.error('Error updating user:', error)
    return {
      success: false,
      message: 'Failed to update user',
      errors: {}
    }
  }
}

export async function deleteUser(userId: string) {
  try {
    const currentUser = await requireHRAccess()

    // Check if user exists and belongs to the same company
    const userToDelete = await prisma.user.findFirst({
      where: {
        id: userId,
        companyId: currentUser.companyId
      }
    })

    if (!userToDelete) {
      return {
        success: false,
        message: 'User not found'
      }
    }

    // Check if user has dependents (employees they manage)
    const dependentCount = await prisma.user.count({
      where: { managerId: userId }
    })

    if (dependentCount > 0) {
      return {
        success: false,
        message: `Cannot delete user - they manage ${dependentCount} employee(s). Please reassign their reports first.`
      }
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId }
    })

    revalidatePath('/users')
    return {
      success: true,
      message: 'User deleted successfully'
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    return {
      success: false,
      message: 'Failed to delete user'
    }
  }
}