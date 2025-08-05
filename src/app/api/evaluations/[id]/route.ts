import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'

// GET /api/evaluations/[id] - Get individual evaluation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const userId = session.user.id
    
    const userRole = session.user.role

    // Only managers can access evaluations they created
    if (userRole !== 'manager') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied - Manager role required' 
      }, { status: 403 })
    }

    const evaluation = await prisma.evaluation.findUnique({
      where: { 
        id: id,
        managerId: userId // Ensure manager can only access their own evaluations
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!evaluation) {
      return NextResponse.json({ 
        success: false, 
        error: 'Evaluation not found' 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: evaluation
    })
  } catch (error) {
    console.error('Error fetching evaluation:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch evaluation' 
    }, { status: 500 })
  }
}