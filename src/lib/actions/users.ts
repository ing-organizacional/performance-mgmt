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
  position: z.string().optional().or(z.literal('')),
  employeeId: z.string().optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  pinCode: z.string().optional().or(z.literal('')),
  active: z.boolean().default(true)
})

const editUserSchema = userSchema.extend({
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal(''))
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
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
      position: formData.get('position'),
      employeeId: formData.get('employeeId'),
      password: formData.get('password'),
      pinCode: formData.get('pinCode'),
      active: formData.get('active') === 'on' ? true : formData.get('active') === null ? true : false
    }

    const result = userSchema.safeParse(rawData)
    
    if (!result.success) {
      return {
        success: false,
        errors: result.error.flatten().fieldErrors,
        messageKey: 'validationFailed',
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
        messageKey: 'userWithEmailExists',
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
        position: userData.position || null,
        employeeId: userData.employeeId || null,
        passwordHash,
        pinCode: userData.pinCode || null,
        requiresPinOnly: userData.userType === 'operational' && !!userData.pinCode,
        active: userData.active
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
      messageKey: 'userCreatedSuccessfully',
      message: 'User created successfully'
    }
  } catch (error) {
    console.error('Error creating user:', error)
    return {
      success: false,
      messageKey: 'failedToCreateUser',
      message: 'Failed to create user',
      errors: {}
    }
  }
}

export async function updateUser(userId: string, formData: FormData) {
  try {
    await requireHRAccess()

    // Get current user data to detect if archiving is needed
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        manager: {
          select: { name: true, email: true }
        }
      }
    })

    if (!existingUser) {
      return {
        success: false,
        messageKey: 'userNotFound',
        message: 'User not found'
      }
    }

    const rawData = {
      name: formData.get('name'),
      email: formData.get('email'),
      username: formData.get('username'),
      role: formData.get('role'),
      companyId: formData.get('companyId'),
      managerId: formData.get('managerId'),
      userType: formData.get('userType') || 'office',
      department: formData.get('department'),
      position: formData.get('position'),
      employeeId: formData.get('employeeId'),
      password: formData.get('password'),
      pinCode: formData.get('pinCode'),
      active: formData.get('active') === 'on' ? true : formData.get('active') === null ? false : false
    }

    // Check if this is an archival request (active changing from true to false)
    const isArchivalRequest = existingUser.active === true && rawData.active === false

    const result = editUserSchema.safeParse(rawData)
    
    if (!result.success) {
      return {
        success: false,
        errors: result.error.flatten().fieldErrors,
        messageKey: 'validationFailed',
        message: 'Validation failed'
      }
    }

    const userData = result.data

    // If this is an archival request, use the existing archiveUser function
    if (isArchivalRequest) {
      // Check if user manages other employees (can't archive managers with active reports)
      const activeReportsCount = await prisma.user.count({
        where: {
          managerId: userId,
          active: true
        }
      })

      if (activeReportsCount > 0) {
        return {
          success: false,
          messageKey: 'cannotArchiveManagerWithActiveReports',
          message: `Cannot archive manager with active reports. Please reassign or archive their ${activeReportsCount} report(s) first.`
        }
      }

      // Use the archiveUser function with automatic reason
      const archiveResult = await archiveUser(userId, 'User deactivated via edit form')
      
      if (archiveResult.success) {
        return {
          success: true,
          messageKey: 'employeeArchivedSuccessfully',
          message: 'Employee archived successfully'
        }
      } else {
        return archiveResult
      }
    }

    // Check for existing email/username (excluding current user)
    const duplicateUser = await prisma.user.findFirst({
      where: {
        companyId: userData.companyId,
        id: { not: userId },
        OR: [
          userData.email ? { email: userData.email } : {},
          userData.username ? { username: userData.username } : {}
        ].filter(condition => Object.keys(condition).length > 0)
      }
    })

    if (duplicateUser) {
      return {
        success: false,
        messageKey: 'userWithEmailExists',
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
      position: string | null
      employeeId: string | null
      pinCode: string | null
      requiresPinOnly: boolean
      active: boolean
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
      position: userData.position || null,
      employeeId: userData.employeeId || null,
      pinCode: userData.pinCode || null,
      requiresPinOnly: userData.userType === 'operational' && !!userData.pinCode,
      active: userData.active
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
      messageKey: 'userUpdatedSuccessfully',
      message: 'User updated successfully'
    }
  } catch (error) {
    console.error('Error updating user:', error)
    return {
      success: false,
      messageKey: 'failedToUpdateUser',
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
        messageKey: 'userNotFound',
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
        messageKey: 'cannotDeleteUserManagesEmployees',
        messageData: { count: dependentCount },
        message: `Cannot delete user - they manage ${dependentCount} employee(s). Please reassign their reports first.`
      }
    }

    // Check for evaluations where user is the employee
    const employeeEvaluationsCount = await prisma.evaluation.count({
      where: { employeeId: userId }
    })

    // Check for evaluations where user is the manager
    const managerEvaluationsCount = await prisma.evaluation.count({
      where: { managerId: userId }
    })

    // Check for evaluation item assignments
    const evaluationAssignmentsCount = await prisma.evaluationItemAssignment.count({
      where: { 
        OR: [
          { employeeId: userId },
          { assignedBy: userId }
        ]
      }
    })

    // Check for partial assessments
    const partialAssessmentsCount = await prisma.partialAssessment.count({
      where: {
        OR: [
          { employeeId: userId },
          { assessedBy: userId }
        ]
      }
    })

    // If user has evaluation-related data, provide detailed error message
    if (employeeEvaluationsCount > 0 || managerEvaluationsCount > 0 || evaluationAssignmentsCount > 0 || partialAssessmentsCount > 0) {
      const evaluationDetails = {
        employeeEvaluationsCount,
        managerEvaluationsCount,
        evaluationAssignmentsCount,
        partialAssessmentsCount
      }

      return {
        success: false,
        messageKey: 'cannotDeleteUserHasEvaluations',
        messageData: evaluationDetails,
        message: `Cannot delete user - they have evaluation data. These evaluation records must be handled first to maintain data integrity.`
      }
    }

    // Store user data for audit log before deletion
    const userDataForAudit = {
      name: userToDelete.name,
      email: userToDelete.email,
      username: userToDelete.username,
      role: userToDelete.role,
      department: userToDelete.department,
      employeeId: userToDelete.employeeId
    }

    // Delete user (BiometricCredentials will cascade due to onDelete: Cascade)
    await prisma.user.delete({
      where: { id: userId }
    })

    // Audit the user deletion
    await auditUserManagement(
      currentUser.id,
      currentUser.role,
      currentUser.companyId,
      'delete',
      userId,
      userDataForAudit,
      undefined,
      'User deleted by HR'
    )

    revalidatePath('/users')
    return {
      success: true,
      messageKey: 'userDeletedSuccessfully',
      message: 'User deleted successfully'
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    
    // Check if it's a foreign key constraint error
    if (error instanceof Error && error.message.includes('foreign key constraint')) {
      return {
        success: false,
        messageKey: 'cannotDeleteDueToConstraints',
        message: 'Cannot delete user due to existing evaluation data. Please contact your system administrator.'
      }
    }
    
    return {
      success: false,
      messageKey: 'failedToDeleteUser',
      message: 'Failed to delete user'
    }
  }
}

export async function changePassword(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'Authentication required'
      }
    }

    const rawData = {
      currentPassword: formData.get('currentPassword'),
      newPassword: formData.get('newPassword'),
      confirmPassword: formData.get('confirmPassword')
    }

    const result = changePasswordSchema.safeParse(rawData)
    
    if (!result.success) {
      return {
        success: false,
        errors: result.error.flatten().fieldErrors,
        message: 'Validation failed'
      }
    }

    const { currentPassword, newPassword } = result.data

    // Get user's current password hash
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true }
    })

    if (!user?.passwordHash) {
      return {
        success: false,
        message: 'No password set for this account'
      }
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isCurrentPasswordValid) {
      return {
        success: false,
        message: 'Current password is incorrect',
        errors: { currentPassword: ['Current password is incorrect'] }
      }
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12)

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newPasswordHash }
    })

    // Audit log for password change
    await auditUserManagement(
      session.user.id,
      session.user.role,
      session.user.companyId,
      'update',
      session.user.id,
      undefined,
      { action: 'password_change', timestamp: new Date().toISOString() },
      'Password changed by user'
    )

    revalidatePath('/settings')
    return {
      success: true,
      message: 'Password updated successfully'
    }
  } catch (error) {
    console.error('Error changing password:', error)
    return {
      success: false,
      message: 'Failed to update password'
    }
  }
}

// Advanced function for force deleting users with evaluations (HR only)
export async function forceDeleteUser(userId: string, reason: string) {
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

    // Store user data for audit log before deletion
    const userDataForAudit = {
      name: userToDelete.name,
      email: userToDelete.email,
      username: userToDelete.username,
      role: userToDelete.role,
      department: userToDelete.department,
      employeeId: userToDelete.employeeId
    }

    // Get counts for audit purposes
    const [employeeEvaluationsCount, managerEvaluationsCount, evaluationAssignmentsCount, partialAssessmentsCount, dependentCount] = await Promise.all([
      prisma.evaluation.count({ where: { employeeId: userId } }),
      prisma.evaluation.count({ where: { managerId: userId } }),
      prisma.evaluationItemAssignment.count({ where: { OR: [{ employeeId: userId }, { assignedBy: userId }] } }),
      prisma.partialAssessment.count({ where: { OR: [{ employeeId: userId }, { assessedBy: userId }] } }),
      prisma.user.count({ where: { managerId: userId } })
    ])

    // Use a transaction to handle all deletions
    await prisma.$transaction(async (tx) => {
      // 1. Reassign employees to no manager (set managerId to null)
      if (dependentCount > 0) {
        await tx.user.updateMany({
          where: { managerId: userId },
          data: { managerId: null }
        })
      }

      // 2. Delete partial assessments
      await tx.partialAssessment.deleteMany({
        where: {
          OR: [
            { employeeId: userId },
            { assessedBy: userId }
          ]
        }
      })

      // 3. Delete evaluation item assignments
      await tx.evaluationItemAssignment.deleteMany({
        where: {
          OR: [
            { employeeId: userId },
            { assignedBy: userId }
          ]
        }
      })

      // 4. Delete evaluations where user is involved
      await tx.evaluation.deleteMany({
        where: {
          OR: [
            { employeeId: userId },
            { managerId: userId }
          ]
        }
      })

      // 5. Delete the user (BiometricCredentials will cascade)
      await tx.user.delete({
        where: { id: userId }
      })
    })

    // Audit the forced user deletion with detailed information
    await auditUserManagement(
      currentUser.id,
      currentUser.role,
      currentUser.companyId,
      'delete',
      userId,
      userDataForAudit,
      {
        action: 'force_delete',
        reason,
        deletedData: {
          employeeEvaluations: employeeEvaluationsCount,
          managerEvaluations: managerEvaluationsCount,
          evaluationAssignments: evaluationAssignmentsCount,
          partialAssessments: partialAssessmentsCount,
          managedEmployees: dependentCount
        }
      },
      `Force deleted user with evaluation data. Reason: ${reason}`
    )

    revalidatePath('/users')
    return {
      success: true,
      message: 'User and all related evaluation data deleted successfully'
    }
  } catch (error) {
    console.error('Error force deleting user:', error)
    return {
      success: false,
      message: 'Failed to delete user and evaluation data'
    }
  }
}

// Archive user with snapshot
export async function archiveUser(userId: string, reason?: string) {
  try {
    const currentUser = await requireHRAccess()

    // Get user to archive with complete context
    const userToArchive = await prisma.user.findFirst({
      where: {
        id: userId,
        companyId: currentUser.companyId
      },
      include: {
        company: true,
        manager: {
          select: { name: true, email: true }
        }
      }
    })

    if (!userToArchive) {
      return {
        success: false,
        messageKey: 'userNotFound',
        message: 'User not found'
      }
    }

    if (!userToArchive.active) {
      return {
        success: false,
        message: 'User is already archived'
      }
    }

    // Create snapshot data
    const archiveSnapshot = {
      archivedAt: new Date(),
      archivedReason: reason || null,
      archivedManagerName: userToArchive.manager?.name || null,
      archivedManagerEmail: userToArchive.manager?.email || null,
      archivedDepartment: userToArchive.department || null,
      archivedPosition: userToArchive.position || null,
      archivedCompanyName: userToArchive.company.name
    }

    // Archive the user
    await prisma.user.update({
      where: { id: userId },
      data: {
        active: false,
        ...archiveSnapshot
      }
    })

    // Audit the archive action
    await auditUserManagement(
      currentUser.id,
      currentUser.role,
      currentUser.companyId,
      'archive',
      userId,
      { 
        active: true, 
        manager: userToArchive.manager?.name,
        department: userToArchive.department 
      },
      {
        active: false,
        archivedAt: archiveSnapshot.archivedAt.toISOString(),
        archivedReason: archiveSnapshot.archivedReason,
        archivedManagerName: archiveSnapshot.archivedManagerName,
        archivedManagerEmail: archiveSnapshot.archivedManagerEmail,
        archivedDepartment: archiveSnapshot.archivedDepartment,
        archivedPosition: archiveSnapshot.archivedPosition,
        archivedCompanyName: archiveSnapshot.archivedCompanyName
      },
      reason ? `Archived: ${reason}` : 'User archived'
    )

    return {
      success: true,
      message: 'User archived successfully'
    }
  } catch (error) {
    console.error('Error archiving user:', error)
    return {
      success: false,
      message: 'Failed to archive user'
    }
  }
}

// Bulk archive users
export async function bulkArchiveUsers(userIds: string[], reason?: string) {
  try {
    const currentUser = await requireHRAccess()

    // Get all users to archive
    const usersToArchive = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        companyId: currentUser.companyId,
        active: true
      },
      include: {
        company: true,
        manager: {
          select: { name: true, email: true }
        }
      }
    })

    if (usersToArchive.length === 0) {
      return {
        success: false,
        message: 'No active users found to archive'
      }
    }

    // Check for manager dependencies
    const managersBeingArchived = usersToArchive.filter(user => user.role === 'manager')
    const dependentCount = await prisma.user.count({
      where: {
        managerId: { in: managersBeingArchived.map(m => m.id) },
        active: true
      }
    })

    if (dependentCount > 0) {
      return {
        success: false,
        message: `Cannot archive ${managersBeingArchived.length} manager(s) - they have ${dependentCount} active employee(s). Please reassign their reports first.`
      }
    }

    const archiveTimestamp = new Date()

    // Bulk update all users
    const archivePromises = usersToArchive.map(user =>
      prisma.user.update({
        where: { id: user.id },
        data: {
          active: false,
          archivedAt: archiveTimestamp,
          archivedReason: reason || null,
          archivedManagerName: user.manager?.name || null,
          archivedManagerEmail: user.manager?.email || null,
          archivedDepartment: user.department || null,
          archivedPosition: user.position || null,
          archivedCompanyName: user.company.name
        }
      })
    )

    await Promise.all(archivePromises)

    // Audit the bulk archive action
    await auditUserManagement(
      currentUser.id,
      currentUser.role,
      currentUser.companyId,
      'bulk_archive',
      '', // No single entity ID for bulk action
      {},
      {
        archivedUserIds: userIds,
        archivedCount: usersToArchive.length,
        reason: reason,
        archivedAt: archiveTimestamp.toISOString()
      },
      reason ? `Bulk archived ${usersToArchive.length} users: ${reason}` : `Bulk archived ${usersToArchive.length} users`
    )

    return {
      success: true,
      message: `Successfully archived ${usersToArchive.length} user(s)`
    }
  } catch (error) {
    console.error('Error bulk archiving users:', error)
    return {
      success: false,
      message: 'Failed to archive users'
    }
  }
}

// Unarchive user (restore)
export async function unarchiveUser(userId: string) {
  try {
    const currentUser = await requireHRAccess()

    // Check if user exists and is archived
    const userToUnarchive = await prisma.user.findFirst({
      where: {
        id: userId,
        companyId: currentUser.companyId,
        active: false
      }
    })

    if (!userToUnarchive) {
      return {
        success: false,
        message: 'Archived user not found'
      }
    }

    // Store archive data for audit
    const archiveData = {
      archivedAt: userToUnarchive.archivedAt,
      archivedReason: userToUnarchive.archivedReason,
      archivedManagerName: userToUnarchive.archivedManagerName,
      archivedDepartment: userToUnarchive.archivedDepartment
    }

    // Unarchive the user (clear archive data)
    await prisma.user.update({
      where: { id: userId },
      data: {
        active: true,
        archivedAt: null,
        archivedReason: null,
        archivedManagerName: null,
        archivedManagerEmail: null,
        archivedDepartment: null,
        archivedPosition: null,
        archivedCompanyName: null
      }
    })

    // Audit the unarchive action
    await auditUserManagement(
      currentUser.id,
      currentUser.role,
      currentUser.companyId,
      'unarchive',
      userId,
      { 
        active: false, 
        archivedAt: archiveData.archivedAt ? archiveData.archivedAt.toISOString() : null,
        archivedReason: archiveData.archivedReason,
        archivedManagerName: archiveData.archivedManagerName,
        archivedDepartment: archiveData.archivedDepartment
      },
      { active: true },
      'User unarchived (restored)'
    )

    return {
      success: true,
      message: 'User unarchived successfully'
    }
  } catch (error) {
    console.error('Error unarchiving user:', error)
    return {
      success: false,
      message: 'Failed to unarchive user'
    }
  }
}