import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'
import { requireHRRole } from '@/lib/auth-middleware'

// GET /api/admin/companies - List all companies
export async function GET() {
  const authResult = await requireHRRole()
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { user } = authResult

  try {
    const companies = await prisma.company.findMany({
      where: {
        id: user.companyId
      },
      include: {
        _count: {
          select: {
            users: true,
            evaluations: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json({
      success: true,
      data: companies,
      count: companies.length
    })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch companies' 
    }, { status: 500 })
  }
}