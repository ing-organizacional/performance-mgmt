import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'

// Simple endpoint - just get all active evaluation items for a company
export async function GET(request: NextRequest) {
  try {
    // Just get all active company-level items (no hardcoded companyId)
    const items = await prisma.evaluationItem.findMany({
      where: {
        active: true,
        level: 'company' // For now, just get company-wide items
      },
      include: {
        creator: {
          select: {
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })

    // Transform to simple format expected by evaluation page
    const formattedItems = items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      type: item.type, // 'okr' or 'competency'
      rating: null,
      comment: '',
      level: item.level,
      createdBy: item.creator.name,
      creatorRole: item.creator.role
    }))

    return NextResponse.json({ items: formattedItems })
  } catch (error) {
    console.error('Error fetching evaluation items:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch evaluation items',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}