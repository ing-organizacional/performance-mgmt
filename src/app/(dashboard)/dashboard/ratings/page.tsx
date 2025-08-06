import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma-client'
import Link from 'next/link'
import { LanguageSwitcher } from '@/components/layout'

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
}

async function getDepartmentRatings(companyId: string) {
  // Get all evaluations with employee department info
  const evaluations = await prisma.evaluation.findMany({
    where: {
      companyId,
      status: { in: ['completed', 'submitted', 'approved'] }
    },
    select: {
      overallRating: true,
      employee: {
        select: {
          department: true
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
        }
      })
    }
    departmentData.get(dept)!.employees.total++
  })

  // Add evaluation ratings
  evaluations.forEach(evaluation => {
    const dept = evaluation.employee.department || 'Unassigned'
    const departmentInfo = departmentData.get(dept)

    if (departmentInfo && evaluation.overallRating) {
      departmentInfo.employees.evaluated++
      departmentInfo.ratings.total++
      
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

function DepartmentRatingCard({ department }: { department: DepartmentRating }) {
  const getPercentage = (count: number) => 
    department.ratings.total > 0 ? Math.round((count / department.ratings.total) * 100) : 0

  const completionPercentage = department.employees.total > 0 
    ? Math.round((department.employees.evaluated / department.employees.total) * 100) 
    : 0

  // Determine department status for visual hierarchy
  const getDepartmentStatus = () => {
    if (department.employees.pending > department.employees.total * 0.5) return 'urgent'
    if (department.ratings.needs > department.ratings.total * 0.3) return 'attention' 
    if (completionPercentage === 100) return 'complete'
    return 'normal'
  }

  const status = getDepartmentStatus()
  const statusStyling = {
    urgent: 'border-l-red-500 bg-red-50',
    attention: 'border-l-orange-500 bg-orange-50', 
    complete: 'border-l-green-500 bg-green-50',
    normal: 'border-l-gray-300 bg-white'
  }

  return (
    <div className={`rounded-lg border border-gray-200 border-l-4 p-6 shadow-sm ${statusStyling[status]}`}>
      {/* Enhanced Department Header with Visual Hierarchy */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{department.department}</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-sm font-medium text-gray-700">
              {department.manager ? department.manager.name : 'No Manager'}
            </span>
          </div>
        </div>
        <div className="text-right ml-4">
          <div className="text-3xl font-bold text-gray-900">{completionPercentage}%</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Complete</div>
        </div>
      </div>

      {/* Compact Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white/80 rounded-lg p-3 text-center border border-gray-100">
          <div className="text-lg font-bold text-gray-900">{department.employees.total}</div>
          <div className="text-xs text-gray-600 font-medium">Employees</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center border border-green-100">
          <div className="text-lg font-bold text-green-600">{department.employees.evaluated}</div>
          <div className="text-xs text-gray-600 font-medium">Evaluated</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-100">
          <div className="text-lg font-bold text-orange-600">{department.employees.pending}</div>
          <div className="text-xs text-gray-600 font-medium">Pending</div>
        </div>
      </div>

      {/* Stacked Progress Bar - Performance Distribution */}
      {department.ratings.total > 0 ? (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">Performance Distribution</span>
            <span className="text-sm text-gray-500">{department.ratings.total} evaluations</span>
          </div>
          
          {/* Single comprehensive stacked progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-4 flex overflow-hidden shadow-inner">
            {department.ratings.outstanding > 0 && (
              <div 
                className="bg-green-500 h-full first:rounded-l-full" 
                style={{ width: `${getPercentage(department.ratings.outstanding)}%` }}
                title={`Outstanding: ${department.ratings.outstanding} (${getPercentage(department.ratings.outstanding)}%)`}
              />
            )}
            {department.ratings.exceeds > 0 && (
              <div 
                className="bg-blue-500 h-full" 
                style={{ width: `${getPercentage(department.ratings.exceeds)}%` }}
                title={`Exceeds: ${department.ratings.exceeds} (${getPercentage(department.ratings.exceeds)}%)`}
              />
            )}
            {department.ratings.meets > 0 && (
              <div 
                className="bg-gray-400 h-full" 
                style={{ width: `${getPercentage(department.ratings.meets)}%` }}
                title={`Meets: ${department.ratings.meets} (${getPercentage(department.ratings.meets)}%)`}
              />
            )}
            {department.ratings.below > 0 && (
              <div 
                className="bg-orange-500 h-full" 
                style={{ width: `${getPercentage(department.ratings.below)}%` }}
                title={`Below: ${department.ratings.below} (${getPercentage(department.ratings.below)}%)`}
              />
            )}
            {department.ratings.needs > 0 && (
              <div 
                className="bg-red-500 h-full last:rounded-r-full" 
                style={{ width: `${getPercentage(department.ratings.needs)}%` }}
                title={`Needs Work: ${department.ratings.needs} (${getPercentage(department.ratings.needs)}%)`}
              />
            )}
          </div>
          
          {/* Compact Legend with Key Metrics */}
          <div className="flex justify-between items-center mt-3">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">{department.ratings.outstanding} Outstanding</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">{department.ratings.needs} Need Work</span>
              </div>
            </div>
            {(department.ratings.needs > 0 || department.ratings.below > 0) && (
              <div className="text-xs text-orange-600 font-medium">
                {department.ratings.needs + department.ratings.below} need attention
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <div className="text-sm font-medium">No completed evaluations yet</div>
          <div className="text-xs text-gray-400 mt-1">Evaluations will appear here once submitted</div>
        </div>
      )}
    </div>
  )
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all duration-150 mr-3 touch-manipulation"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Department Ratings</h1>
                <p className="text-sm text-gray-500">{departments.length} departments</p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 px-4 pb-6">
        <div className="max-w-4xl mx-auto">
          {/* Enhanced Overview with Insights */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Performance Insights</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-3xl font-bold mb-1">
                  {departments.reduce((sum, dept) => sum + dept.employees.evaluated, 0)}
                </div>
                <div className="text-blue-100 text-sm font-medium">Total Evaluations</div>
                <div className="text-blue-200 text-xs mt-1">
                  {departments.reduce((sum, dept) => sum + dept.employees.pending, 0)} pending
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">
                  {departments.filter(dept => {
                    const completionRate = dept.employees.total > 0 ? (dept.employees.evaluated / dept.employees.total) : 0
                    return completionRate === 1
                  }).length}
                </div>
                <div className="text-blue-100 text-sm font-medium">Complete Departments</div>
                <div className="text-blue-200 text-xs mt-1">
                  of {departments.length} total
                </div>
              </div>
            </div>
            
            {/* Quick Action Indicators */}
            <div className="mt-4 pt-4 border-t border-blue-400/30">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                  <span className="text-blue-100">
                    {departments.filter(dept => {
                      const needsAttention = dept.ratings.needs + dept.ratings.below
                      return needsAttention > dept.ratings.total * 0.3 && dept.ratings.total > 0
                    }).length} departments need attention
                  </span>
                </div>
                <div className="text-blue-200 text-xs">
                  Swipe down for details →
                </div>
              </div>
            </div>
          </div>

          {/* Department Cards */}
          <div className="space-y-4">
            {departments.map((department) => (
              <DepartmentRatingCard key={department.department} department={department} />
            ))}
          </div>

          {departments.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm text-center">
              <div className="text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Departments Found</h3>
                <p className="text-gray-600">Add employees with departments to see rating distributions.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}