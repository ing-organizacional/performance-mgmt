/**
 * User Password Management
 * 
 * Handles password-related operations including password changes
 * with validation, authentication checks, and audit logging.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma-client'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'
import { auditUserManagement } from '@/lib/services/audit-service'
import { changePasswordSchema } from './schemas'

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