import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'
import { requireHRRole } from '@/lib/auth-middleware'

interface CycleCreateData {
  name: string
  startDate: string
  endDate: string
}

// GET /api/admin/cycles - List all performance cycles for the company
export async function GET(request: NextRequest) {
  const authResult = await requireHRRole(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { user } = authResult

  try {

    const cycles = await prisma.performanceCycle.findMany({
      where: {
        companyId: user.companyId
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
  const authResult = await requireHRRole(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { user } = authResult

  try {
    const body = await request.json() as CycleCreateData
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
          companyId: user.companyId,
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
        companyId: user.companyId,
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