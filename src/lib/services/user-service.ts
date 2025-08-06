// User management business logic
// Centralized user operations and data access

import { prisma } from '@/lib/prisma-client'
import bcrypt from 'bcryptjs'
import { UserFormData, User, UserWithDetails } from '@/types'

export class UserService {
  static async createUser(userData: UserFormData): Promise<User> {
    // Hash password if provided
    let passwordHash: string | undefined
    if (userData.password) {
      passwordHash = await bcrypt.hash(userData.password, 12)
    }

    const result = await prisma.user.create({
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

    return result as User
  }

  static async updateUser(userId: string, userData: UserFormData): Promise<User> {
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

    const result = await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    return result as User
  }

  static async deleteUser(userId: string): Promise<void> {
    // Check if user has dependents
    const dependentCount = await prisma.user.count({
      where: { managerId: userId }
    })

    if (dependentCount > 0) {
      throw new Error(`Cannot delete user - they manage ${dependentCount} employee(s). Please reassign their reports first.`)
    }

    await prisma.user.delete({
      where: { id: userId }
    })
  }

  static async getUsersByCompany(companyId: string): Promise<UserWithDetails[]> {
    const results = await prisma.user.findMany({
      where: { companyId, active: true },
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
        { role: 'asc' },
        { name: 'asc' }
      ]
    })

    return results as UserWithDetails[]
  }

  static async checkUserExists(companyId: string, email?: string, username?: string, excludeUserId?: string): Promise<boolean> {
    const conditions = []
    if (email) conditions.push({ email })
    if (username) conditions.push({ username })
    
    if (conditions.length === 0) return false

    const existingUser = await prisma.user.findFirst({
      where: {
        companyId,
        ...(excludeUserId && { id: { not: excludeUserId } }),
        OR: conditions
      }
    })

    return !!existingUser
  }

  static async getManagers(companyId: string): Promise<Array<Pick<User, 'id' | 'name' | 'email'>>> {
    return await prisma.user.findMany({
      where: {
        companyId,
        role: { in: ['manager', 'hr'] },
        active: true
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: { name: 'asc' }
    })
  }
}