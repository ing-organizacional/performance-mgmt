import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'

// GET /api/health - Health check endpoint for Docker and monitoring
export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'performance-management-system',
      database: 'connected'
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'performance-management-system',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}