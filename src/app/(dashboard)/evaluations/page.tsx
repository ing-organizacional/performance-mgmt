/**
 * Evaluations Management Page Component
 * 
 * Team evaluation management interface for managers and HR to oversee their team's
 * performance evaluation progress. Provides comprehensive team analytics, individual
 * employee evaluation tracking, and evaluation workflow management capabilities.
 * 
 * Key Features:
 * - Team evaluation overview with summary statistics
 * - Individual employee evaluation progress tracking
 * - Evaluation status management (draft, submitted, completed)
 * - Team performance analytics and average scoring
 * - Reopened evaluations monitoring and alerts
 * - Role-based access control for managers and HR
 * - Active performance cycle integration
 * 
 * Team Management:
 * - Complete team member listing with evaluation status
 * - Latest evaluation tracking per employee
 * - Performance rating aggregation and averages
 * - Progress categorization (pending, in-progress, completed)
 * - Employee-specific evaluation history access
 * 
 * Analytics and Insights:
 * - Team summary statistics with completion rates
 * - Average team performance scoring
 * - Evaluation progress distribution
 * - Overdue and pending evaluation identification
 * - Reopened evaluation tracking for quality management
 * 
 * Workflow Integration:
 * - Active performance cycle awareness
 * - Evaluation creation and assignment workflows
 * - Status tracking throughout evaluation lifecycle
 * - Manager oversight and approval processes
 * - HR administrative access to all teams
 * 
 * Access Control:
 * - Manager role: Access to direct reports only
 * - HR role: Company-wide access to all teams
 * - Employee role: Redirected to personal evaluation view
 * - Session validation with proper role enforcement
 * 
 * Data Processing:
 * - Server-side team data aggregation
 * - Efficient database queries for team metrics
 * - Real-time evaluation status calculations
 * - Latest evaluation tracking per employee
 * - Performance metric calculations and averages
 */

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma-client'
import EvaluationsClient from './EvaluationsClient'
import { getReopenedEvaluationsCount } from '@/lib/actions/evaluations'
import { getManagerTeam } from '@/lib/actions/team'

// Employee interface moved to EvaluationsClient for consistency

export default async function EvaluationsPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const userRole = session.user.role
  const companyId = session.user.companyId

  // Only managers and HR can access this page
  if (userRole !== 'manager' && userRole !== 'hr') {
    redirect('/my-evaluations')
  }

  // Use cached team data
  const teamData = await getManagerTeam()

  // Get current active cycle for HR users
  let currentCycleId: string | null = null
  if (userRole === 'hr') {
    const activeCycle = await prisma.performanceCycle.findFirst({
      where: {
        companyId,
        status: 'active'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    currentCycleId = activeCycle?.id || null
  }

  // Transform team data to match EvaluationsClient interface
  const transformedEmployees = teamData.employees.map(employee => ({
    id: employee.id,
    name: employee.name,
    email: employee.email,
    department: employee.department,
    role: employee.role,
    _count: employee._count,
    evaluationsReceived: employee.evaluationsReceived.map(evaluation => ({
      id: evaluation.id,
      status: evaluation.status,
      overallRating: evaluation.overallRating,
      evaluationItemsData: evaluation.evaluationItemsData,
      createdAt: evaluation.createdAt ? new Date(evaluation.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: evaluation.updatedAt ? new Date(evaluation.updatedAt).toISOString() : new Date().toISOString(),
      isReopened: evaluation.isReopened,
      previousStatus: evaluation.previousStatus,
      reopenedAt: evaluation.reopenedAt ? new Date(evaluation.reopenedAt).toISOString() : null,
      reopenedBy: evaluation.reopenedBy,
      reopenedReason: evaluation.reopenedReason,
      completionCount: evaluation.completionCount
    }))
  }))

  // Get reopened evaluations count for managers and HR
  let reopenedCount = 0
  if (userRole === 'manager' || userRole === 'hr') {
    const reopenedResult = await getReopenedEvaluationsCount()
    if (reopenedResult.success && reopenedResult.count) {
      reopenedCount = reopenedResult.count
    }
  }

  return (
    <EvaluationsClient 
      employees={transformedEmployees}
      teamSummary={teamData.summary}
      currentCycleId={currentCycleId}
      userRole={userRole}
      reopenedEvaluationsCount={reopenedCount}
    />
  )
}