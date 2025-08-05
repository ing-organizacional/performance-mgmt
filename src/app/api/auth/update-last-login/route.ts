import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'

export async function POST() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Update lastLogin for the authenticated user
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastLogin: new Date() }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Last login updated'
    })
  } catch (error) {
    console.error('Error updating last login:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update last login' 
    }, { status: 500 })
  }
}