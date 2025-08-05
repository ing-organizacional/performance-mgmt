import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'

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
    
    // Get employeeId from query parameters if evaluating someone else
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
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
    ).sort((a, b) => a.sortOrder - b.sortOrder)

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
      evaluationDeadline: item.evaluationDeadline?.toISOString() || null,
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

// POST /api/evaluation-items - Create new evaluation item
export async function POST(request: NextRequest) {
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

    // Only managers and HR can create items
    if (userRole !== 'manager' && userRole !== 'hr') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied - Manager or HR role required' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, type, level, evaluationDeadline } = body

    if (!title || !description || !type || !level) {
      return NextResponse.json({ 
        success: false, 
        error: 'Title, description, type, and level are required' 
      }, { status: 400 })
    }

    // Validate deadline if provided
    let deadlineDate = null
    if (evaluationDeadline) {
      deadlineDate = new Date(evaluationDeadline)
      if (isNaN(deadlineDate.getTime())) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid deadline date format. Please provide a valid date and time.' 
        }, { status: 400 })
      }
      
      // Deadline must be in the future (at least 1 hour from now)
      const now = new Date()
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
      if (deadlineDate <= oneHourFromNow) {
        return NextResponse.json({ 
          success: false, 
          error: 'Deadline must be at least 1 hour in the future.' 
        }, { status: 400 })
      }

      // Check if deadline is not too far in the future (e.g., more than 2 years)
      const twoYearsFromNow = new Date(now.getTime() + 2 * 365 * 24 * 60 * 60 * 1000)
      if (deadlineDate > twoYearsFromNow) {
        return NextResponse.json({ 
          success: false, 
          error: 'Deadline cannot be more than 2 years in the future.' 
        }, { status: 400 })
      }
    }

    // Validate type and level
    if (!['okr', 'competency'].includes(type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Type must be okr or competency' 
      }, { status: 400 })
    }

    if (!['company', 'department', 'manager'].includes(level)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Level must be company, department, or manager' 
      }, { status: 400 })
    }

    // Permission check
    if (userRole === 'manager' && level === 'company') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only HR can create company-level items' 
      }, { status: 403 })
    }

    // Get user info for assignedTo field
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { department: true }
    })

    let assignedTo = null
    if (level === 'department' && user?.department) {
      assignedTo = user.department
    } else if (level === 'manager') {
      assignedTo = userId
    }

    // Get the next sort order
    const lastItem = await prisma.evaluationItem.findFirst({
      where: { companyId },
      orderBy: { sortOrder: 'desc' }
    })
    const sortOrder = (lastItem?.sortOrder || 0) + 1

    // Create the item
    const newItem = await prisma.evaluationItem.create({
      data: {
        companyId,
        title,
        description,
        type,
        level,
        createdBy: userId,
        assignedTo,
        sortOrder,
        active: true,
        evaluationDeadline: deadlineDate,
        deadlineSetBy: deadlineDate ? userId : null
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

    // Log deadline setting for audit purposes
    if (deadlineDate) {
      const auditLog = {
        timestamp: new Date().toISOString(),
        userId: userId,
        userName: session.user.name,
        userRole: userRole,
        action: 'deadline_set_on_creation',
        itemId: newItem.id,
        itemTitle: newItem.title,
        deadline: deadlineDate.toISOString(),
        companyId: companyId
      }
      console.log('AUDIT: Evaluation item created with deadline:', JSON.stringify(auditLog, null, 2))
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newItem.id,
        title: newItem.title,
        description: newItem.description,
        type: newItem.type,
        level: newItem.level,
        createdBy: newItem.creator.name,
        creatorRole: newItem.creator.role,
        evaluationDeadline: newItem.evaluationDeadline?.toISOString() || null,
        deadlineSetBy: newItem.deadlineSetByUser?.name || null,
        deadlineSetByRole: newItem.deadlineSetByUser?.role || null
      },
      message: 'Evaluation item created successfully'
    })

  } catch (error) {
    console.error('Error creating evaluation item:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create evaluation item',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}