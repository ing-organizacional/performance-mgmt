import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'

// GET /api/evaluation-items/all - Get all evaluation items with assignment info
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const userId = session.user.id
    const userRole = (session.user as any).role
    const companyId = (session.user as any).companyId

    // Get all evaluation items for the company
    const items = await prisma.evaluationItem.findMany({
      where: {
        companyId,
        active: true
      },
      include: {
        creator: {
          select: {
            name: true,
            role: true
          }
        },
        individualAssignments: {
          include: {
            employee: {
              select: {
                name: true,
                email: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: [
        { level: 'asc' }, // company, department, manager
        { sortOrder: 'asc' }
      ]
    })

    // Transform to include assignment information
    const formattedItems = items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      type: item.type,
      level: item.level,
      createdBy: item.creator.name,
      creatorRole: item.creator.role,
      assignedEmployees: item.individualAssignments.map(assignment => assignment.employee.name),
      assignedEmployeeIds: item.individualAssignments.map(assignment => assignment.employeeId)
    }))

    return NextResponse.json({ 
      success: true,
      items: formattedItems 
    })
  } catch (error) {
    console.error('Error fetching all evaluation items:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch evaluation items',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}