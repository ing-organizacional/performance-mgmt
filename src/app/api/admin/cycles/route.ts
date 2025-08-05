import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'

// GET /api/admin/cycles - List all performance cycles for the company
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const userRole = (session.user as any).role
    const companyId = (session.user as any).companyId

    // Only HR can access cycle management
    if (userRole !== 'hr') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied - HR role required' 
      }, { status: 403 })
    }

    const cycles = await prisma.performanceCycle.findMany({
      where: {
        companyId: companyId
      },
      include: {
        closedByUser: {
          select: {
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            evaluations: true,
            evaluationItems: true,
            partialAssessments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      cycles
    })
  } catch (error) {
    console.error('Error fetching cycles:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch cycles' 
    }, { status: 500 })
  }
}

// POST /api/admin/cycles - Create a new performance cycle
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
    const userRole = (session.user as any).role
    const companyId = (session.user as any).companyId

    // Only HR can create cycles
    if (userRole !== 'hr') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied - HR role required' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { name, startDate, endDate } = body

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: name, startDate, endDate' 
      }, { status: 400 })
    }

    // Check for name conflicts
    const existingCycle = await prisma.performanceCycle.findUnique({
      where: {
        companyId_name: {
          companyId,
          name
        }
      }
    })

    if (existingCycle) {
      return NextResponse.json({ 
        success: false, 
        error: 'A cycle with this name already exists' 
      }, { status: 400 })
    }

    const cycle = await prisma.performanceCycle.create({
      data: {
        companyId,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'active'
      },
      include: {
        _count: {
          select: {
            evaluations: true,
            evaluationItems: true,
            partialAssessments: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      cycle,
      message: 'Performance cycle created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating cycle:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create cycle' 
    }, { status: 500 })
  }
}