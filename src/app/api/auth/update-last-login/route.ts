import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'
import { rateLimit, AUTH_RATE_LIMITS } from '@/lib/rate-limit'
// Remove unused import

export async function POST(request: Request) {
  // Rate limiting for auth endpoint
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIp || request.headers.get('host') || 'unknown'
  
  const rateLimitResult = rateLimit(
    `update-last-login:${ip}`,
    AUTH_RATE_LIMITS.LOGIN
  )
  
  if (!rateLimitResult.success) {
    return NextResponse.json({
      success: false,
      error: 'Too many requests. Please try again later.'
    }, { 
      status: 429,
      headers: {
        'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
      }
    })
  }
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
  } catch {
    // Error updating last login
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update last login' 
    }, { status: 500 })
  }
}