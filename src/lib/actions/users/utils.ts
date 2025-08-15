/**
 * User Management Utilities
 * 
 * Shared utility functions for user management operations
 * including authentication checks and common helper functions.
 */

import { auth } from '@/auth'

export async function requireHRAccess() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'hr') {
    throw new Error('Access denied - HR role required')
  }
  return session.user
}