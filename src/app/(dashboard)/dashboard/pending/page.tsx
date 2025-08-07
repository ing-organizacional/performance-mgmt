import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma-client'
import PendingEvaluationsClient from './PendingEvaluationsClient'

interface PendingEmployee {
  id: string
  name: string
  department: string | null
  role: string
  manager: {
    name: string
    email: string | null
  } | null
  hasEvaluation: boolean
  evaluationId?: string
}

async function getPendingEvaluations(companyId: string) {
  // Get all active employees
  const allEmployees = await prisma.user.findMany({
    where: {
      companyId,
      active: true,
      role: { in: ['employee', 'manager'] } // Exclude HR from evaluations
    },
    select: {
      id: true,
      name: true,
      department: true,
      role: true,
      manager: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: [
      { department: 'asc' },
      { name: 'asc' }
    ]
  })

  // Get all completed evaluations
  const completedEvaluations = await prisma.evaluation.findMany({
    where: {
      companyId,
      status: 'completed'
    },
    select: {
      id: true,
      employeeId: true
    }
  })

  // Create a Set of employee IDs who have completed evaluations
  const evaluatedEmployeeIds = new Set(
    completedEvaluations.map(evaluation => evaluation.employeeId)
  )

  // Create a Map of evaluation IDs by employee ID
  const evaluationMap = new Map(
    completedEvaluations.map(evaluation => [evaluation.employeeId, evaluation.id])
  )

  // Filter employees to get pending ones
  const pendingEmployees: PendingEmployee[] = allEmployees.map(employee => {
    const hasEvaluation = evaluatedEmployeeIds.has(employee.id)
    return {
      ...employee,
      hasEvaluation,
      evaluationId: evaluationMap.get(employee.id)
    }
  })

  return pendingEmployees
}

export default async function PendingEvaluationsPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const userRole = session.user.role
  if (userRole !== 'hr' && userRole !== 'manager') {
    redirect('/my-evaluations')
  }

  const companyId = session.user.companyId
  if (!companyId) {
    redirect('/login')
  }

  // Fetch pending evaluations data (Server Component)
  const employees = await getPendingEvaluations(companyId)

  // Separate completed and pending
  const completedEmployees = employees.filter(emp => emp.hasEvaluation)
  const pendingEmployees = employees.filter(emp => !emp.hasEvaluation)

  return (
    <PendingEvaluationsClient 
      completedEmployees={completedEmployees}
      pendingEmployees={pendingEmployees}
    />
  )
}