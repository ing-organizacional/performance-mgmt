import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'
import { toISOStringSafe } from '@/lib/utils/date'
import { validationError } from '@/lib/validation'

// GET /api/evaluation-items - Get evaluation items for specific employee (used in evaluation flow)
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
    const companyId = session.user.companyId
    
    // Validate query parameters
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    
    // Validate employeeId if provided (should be valid CUID)
    if (employeeId && !/^c[a-z0-9]{24}$/.test(employeeId)) {
      return validationError('Invalid employee ID format')
    }
    
    const targetEmployeeId = employeeId || userId

    // Get employee info to determine department and manager
    const employee = await prisma.user.findUnique({
      where: { id: targetEmployeeId },
      select: {
        department: true,
        managerId: true
      }
    })

    if (!employee) {
      return NextResponse.json({ 
        success: false,
        error: 'Employee not found' 
      }, { status: 404 })
    }

    // Get evaluation items that apply to this employee:
    // 1. Company-wide items (all employees)
    // 2. Department-level items (matching department)
    // 3. Manager-level items (same manager)
    // 4. Individual assignments (specific to this employee)

    const companyItems = await prisma.evaluationItem.findMany({
      where: {
        companyId,
        active: true,
        level: 'company'
      },
      include: {
        creator: {
          select: {
            name: true,
            role: true
          }
        },
        deadlineSetByUser: {
          select: {
            name: true,
            role: true
          }
        }
      }
    })

    const departmentItems = await prisma.evaluationItem.findMany({
      where: {
        companyId,
        active: true,
        level: 'department',
        assignedTo: employee.department
      },
      include: {
        creator: {
          select: {
            name: true,
            role: true
          }
        },
        deadlineSetByUser: {
          select: {
            name: true,
            role: true
          }
        }
      }
    })

    const managerItems = await prisma.evaluationItem.findMany({
      where: {
        companyId,
        active: true,
        level: 'manager',
        assignedTo: employee.managerId
      },
      include: {
        creator: {
          select: {
            name: true,
            role: true
          }
        },
        deadlineSetByUser: {
          select: {
            name: true,
            role: true
          }
        }
      }
    })

    // Individual assignments
    const individualAssignments = await prisma.evaluationItemAssignment.findMany({
      where: {
        employeeId: targetEmployeeId,
        companyId
      },
      include: {
        evaluationItem: {
          include: {
            creator: {
              select: {
                name: true,
                role: true
              }
            },
            deadlineSetByUser: {
              select: {
                name: true,
                role: true
              }
            }
          }
        }
      }
    })

    // Combine all items and remove duplicates
    const allItems = [
      ...companyItems,
      ...departmentItems,
      ...managerItems,
      ...individualAssignments.map(assignment => assignment.evaluationItem)
    ]

    // Remove duplicates by ID and sort
    const uniqueItems = allItems.filter((item, index, array) => 
      array.findIndex(i => i.id === item.id) === index
    ).sort((a, b) => {
      // Prioritize company-wide items created in the last 24 hours (newly created)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const aIsNewCompanyItem = a.level === 'company' && new Date(a.createdAt) > oneDayAgo
      const bIsNewCompanyItem = b.level === 'company' && new Date(b.createdAt) > oneDayAgo
      
      if (aIsNewCompanyItem && !bIsNewCompanyItem) return -1
      if (!aIsNewCompanyItem && bIsNewCompanyItem) return 1
      
      // If both are new company items or neither are, sort by creation date (newest first)
      if (aIsNewCompanyItem && bIsNewCompanyItem) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      
      // Default to sortOrder for other items
      return a.sortOrder - b.sortOrder
    })

    // Transform to format expected by evaluation page
    const formattedItems = uniqueItems.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      type: item.type, // 'okr' or 'competency'
      rating: null,
      comment: '',
      level: item.level,
      createdBy: item.creator.name,
      creatorRole: item.creator.role,
      evaluationDeadline: toISOStringSafe(item.evaluationDeadline),
      deadlineSetBy: item.deadlineSetByUser?.name || null,
      deadlineSetByRole: item.deadlineSetByUser?.role || null
    }))

    return NextResponse.json({ 
      success: true,
      items: formattedItems 
    })
  } catch (error) {
    console.error('Error fetching evaluation items:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch evaluation items',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST endpoint removed - now handled by server action createEvaluationItem
// This keeps the API cleaner and more consistent