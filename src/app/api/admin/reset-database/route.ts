import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const userRole = session.user.role
    if (userRole !== 'hr') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied - HR role required' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { confirm } = body

    if (confirm !== 'RESET') {
      return NextResponse.json({ 
        success: false, 
        error: 'Confirmation required' 
      }, { status: 400 })
    }

    // Delete all data in the correct order to avoid foreign key constraints
    console.log('Starting database reset...')

    // Delete in reverse dependency order
    await prisma.auditLog.deleteMany({})
    console.log('Deleted audit logs')

    await prisma.partialAssessment.deleteMany({})
    console.log('Deleted partial assessments')

    await prisma.evaluationItemAssignment.deleteMany({})
    console.log('Deleted evaluation item assignments')

    await prisma.evaluationItem.deleteMany({})
    console.log('Deleted evaluation items')

    await prisma.evaluation.deleteMany({})
    console.log('Deleted evaluations')

    await prisma.performanceCycle.deleteMany({})
    console.log('Deleted performance cycles')

    await prisma.user.deleteMany({})
    console.log('Deleted users')

    await prisma.company.deleteMany({})
    console.log('Deleted companies')

    console.log('Database reset completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Database reset successfully. All data has been permanently deleted.'
    })

  } catch (error) {
    console.error('Error resetting database:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to reset database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}