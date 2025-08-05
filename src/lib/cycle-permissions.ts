import { prisma } from './prisma-client'

export interface CyclePermissionCheck {
  canEdit: boolean
  canEditPartialAssessments: boolean
  cycleStatus: string | null
  reason?: string
}

/**
 * Check if a user can edit evaluation data within a performance cycle
 * Ridiculously simple rules:
 * - ACTIVE cycle: Normal editing permissions
 * - CLOSED cycle: Read-only for managers, HR can edit partial assessments only
 * - ARCHIVED cycle: Read-only for everyone except superadmin
 */
export async function canEditInCycle(
  cycleId: string | null,
  userId: string,
  userRole: string,
  itemType: 'evaluation' | 'evaluation_item' | 'partial_assessment' = 'evaluation'
): Promise<CyclePermissionCheck> {
  try {
    // If no cycle is specified, allow editing (backwards compatibility)
    if (!cycleId) {
      return {
        canEdit: true,
        canEditPartialAssessments: userRole === 'hr',
        cycleStatus: null
      }
    }

    // Get cycle status
    const cycle = await prisma.performanceCycle.findUnique({
      where: { id: cycleId },
      select: { status: true }
    })

    if (!cycle) {
      return {
        canEdit: false,
        canEditPartialAssessments: false,
        cycleStatus: null,
        reason: 'Cycle not found'
      }
    }

    const { status } = cycle

    // Handle different cycle statuses
    switch (status) {
      case 'active':
        return {
          canEdit: true,
          canEditPartialAssessments: userRole === 'hr',
          cycleStatus: status
        }

      case 'closed':
        // When closed: read-only for managers, HR can edit partial assessments
        if (userRole === 'hr' && itemType === 'partial_assessment') {
          return {
            canEdit: true,
            canEditPartialAssessments: true,
            cycleStatus: status
          }
        }
        return {
          canEdit: false,
          canEditPartialAssessments: userRole === 'hr',
          cycleStatus: status,
          reason: 'Performance cycle is closed'
        }

      case 'archived':
        // Archived: read-only for everyone except superadmin
        // TODO: Add superadmin role check when implemented
        return {
          canEdit: false,
          canEditPartialAssessments: false,
          cycleStatus: status,
          reason: 'Performance cycle is archived'
        }

      default:
        return {
          canEdit: false,
          canEditPartialAssessments: false,
          cycleStatus: status,
          reason: 'Unknown cycle status'
        }
    }
  } catch (error) {
    console.error('Error checking cycle permissions:', error)
    return {
      canEdit: false,
      canEditPartialAssessments: false,
      cycleStatus: null,
      reason: 'Error checking permissions'
    }
  }
}

/**
 * Middleware function to validate cycle permissions before write operations
 */
export async function validateCycleWritePermission(
  cycleId: string | null,
  userId: string,
  userRole: string,
  itemType: 'evaluation' | 'evaluation_item' | 'partial_assessment' = 'evaluation'
): Promise<{ allowed: boolean; error?: string; status?: number }> {
  const permission = await canEditInCycle(cycleId, userId, userRole, itemType)

  if (!permission.canEdit) {
    return {
      allowed: false,
      error: permission.reason || 'Cannot edit in current cycle status',
      status: 403
    }
  }

  return { allowed: true }
}