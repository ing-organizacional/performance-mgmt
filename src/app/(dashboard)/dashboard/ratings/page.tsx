import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma-client'
import DepartmentRatingsClient from './DepartmentRatingsClient'

interface DepartmentRating {
  department: string
  manager: {
    name: string
    email: string | null
  } | null
  ratings: {
    outstanding: number
    exceeds: number
    meets: number
    below: number
    needs: number
    total: number
  }
  employees: {
    total: number
    evaluated: number
    pending: number
  }
  allEmployees: {
    id: string
    name: string
    rating: number
    status: string
    evaluationId: string
    isManager: boolean
  }[]
  criticalEmployees: {
    id: string
    name: string
    rating: number
    status: string
    evaluationId: string
    isManager: boolean
  }[]
}

async function getDepartmentRatings(companyId: string) {
  // Get all evaluations with employee department info
  const evaluations = await prisma.evaluation.findMany({
    where: {
      companyId,
      status: 'completed'
    },
    select: {
      id: true,
      overallRating: true,
      status: true,
      employee: {
        select: {
          id: true,
          name: true,
          department: true,
          role: true
        }
      }
    }
  })

  // Get all employees by department with their managers
  const allEmployees = await prisma.user.findMany({
    where: {
      companyId,
      active: true,
      role: { in: ['employee', 'manager', 'hr'] }
    },
    select: {
      department: true,
      role: true,
      name: true,
      email: true,
      manager: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })

  // Group by department and find department managers
  const departmentData = new Map<string, DepartmentRating>()

  // First, identify department managers (users who are managers and have employees in that department)
  const departmentManagers = new Map<string, { name: string; email: string | null }>()
  
  allEmployees.forEach(employee => {
    const dept = employee.department || 'Unassigned'
    
    // If this is a manager in this department, they could be the department manager
    if (employee.role === 'manager' && employee.department === dept) {
      departmentManagers.set(dept, {
        name: employee.name,
        email: employee.email
      })
    }
  })

  // Initialize departments from all employees
  allEmployees.forEach(employee => {
    const dept = employee.department || 'Unassigned'
    if (!departmentData.has(dept)) {
      departmentData.set(dept, {
        department: dept,
        manager: departmentManagers.get(dept) || employee.manager || null,
        ratings: {
          outstanding: 0,
          exceeds: 0,
          meets: 0,
          below: 0,
          needs: 0,
          total: 0
        },
        employees: {
          total: 0,
          evaluated: 0,
          pending: 0
        },
        allEmployees: [],
        criticalEmployees: []
      })
    }
    departmentData.get(dept)!.employees.total++
  })

  // Add evaluation ratings and collect critical employees
  evaluations.forEach(evaluation => {
    const dept = evaluation.employee.department || 'Unassigned'
    const departmentInfo = departmentData.get(dept)

    if (departmentInfo && evaluation.overallRating) {
      departmentInfo.employees.evaluated++
      departmentInfo.ratings.total++
      
      // Add to all employees list
      departmentInfo.allEmployees.push({
        id: evaluation.employee.id,
        name: evaluation.employee.name,
        rating: evaluation.overallRating,
        status: evaluation.status,
        evaluationId: evaluation.id,
        isManager: evaluation.employee.role === 'manager'
      })
      
      // Add to critical employees list if rating is 1 or 2
      if (evaluation.overallRating <= 2) {
        departmentInfo.criticalEmployees.push({
          id: evaluation.employee.id,
          name: evaluation.employee.name,
          rating: evaluation.overallRating,
          status: evaluation.status,
          evaluationId: evaluation.id,
          isManager: evaluation.employee.role === 'manager'
        })
      }
      
      switch (evaluation.overallRating) {
        case 5:
          departmentInfo.ratings.outstanding++
          break
        case 4:
          departmentInfo.ratings.exceeds++
          break
        case 3:
          departmentInfo.ratings.meets++
          break
        case 2:
          departmentInfo.ratings.below++
          break
        case 1:
          departmentInfo.ratings.needs++
          break
      }
    }
  })

  // Calculate pending evaluations
  departmentData.forEach(dept => {
    dept.employees.pending = dept.employees.total - dept.employees.evaluated
  })

  // Convert to array and sort by priority (problematic departments first, then by completion)
  return Array.from(departmentData.values()).sort((a, b) => {
    // Calculate priority scores
    const getScore = (dept: DepartmentRating) => {
      const completionRate = dept.employees.total > 0 ? (dept.employees.evaluated / dept.employees.total) : 0
      const needsAttentionRate = dept.ratings.total > 0 ? ((dept.ratings.needs + dept.ratings.below) / dept.ratings.total) : 0
      
      // Higher score = needs more attention (shown first)
      let score = 0
      if (completionRate < 0.5) score += 100 // Low completion
      if (needsAttentionRate > 0.3) score += 50  // High needs attention
      if (dept.employees.pending > dept.employees.total * 0.5) score += 25 // Many pending
      
      return score
    }
    
    const scoreA = getScore(a)
    const scoreB = getScore(b) 
    
    // If same priority, sort by department name
    if (scoreA === scoreB) {
      return a.department.localeCompare(b.department)
    }
    
    return scoreB - scoreA // Higher score first (more urgent)
  })
}


export default async function DepartmentRatingsPage() {
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

  // Fetch department ratings data (Server Component)
  const departments = await getDepartmentRatings(companyId)

  return <DepartmentRatingsClient departments={departments} />
}