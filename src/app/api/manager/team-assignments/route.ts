import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'

// GET /api/manager/team-assignments - Get team members with their assignment info
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const userId = session.user.id
    
    const userRole = session.user.role
    const companyId = session.user.companyId

    // Only managers can access this endpoint
    if (userRole !== 'manager') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied - Manager role required' 
      }, { status: 403 })
    }

    // Get all team members (employees under this manager)
    const employees = await prisma.user.findMany({
      where: {
        companyId,
        managerId: userId,
        active: true
      },
      include: {
        employeeAssignments: {
          include: {
            evaluationItem: {
              select: {
                id: true,
                title: true,
                type: true,
                level: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Format employee data with assignment counts
    const formattedEmployees = employees.map((employee) => ({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      username: employee.username,
      department: employee.department,
      assignedItems: employee.employeeAssignments.map(assignment => assignment.evaluationItem.id),
      assignmentDetails: employee.employeeAssignments.map(assignment => ({
        itemId: assignment.evaluationItem.id,
        title: assignment.evaluationItem.title,
        type: assignment.evaluationItem.type,
        level: assignment.evaluationItem.level
      }))
    }))

    return NextResponse.json({ 
      success: true,
      employees: formattedEmployees 
    })
  } catch (error) {
    console.error('Error fetching team assignments:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch team assignments',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}