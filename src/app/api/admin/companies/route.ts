import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'

// GET /api/admin/companies - List all companies
export async function GET() {
  try {
    const companies = await prisma.company.findMany({
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