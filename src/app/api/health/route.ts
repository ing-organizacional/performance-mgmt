import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'
import { validateQueryParams, healthCheckSchema } from '@/lib/validation'

// GET /api/health - Health check endpoint for Docker and monitoring
export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const { searchParams } = new URL(request.url)
    const queryValidation = validateQueryParams(healthCheckSchema, searchParams)
    if (!queryValidation.success) {
      return queryValidation.response
    }
    const { detailed } = queryValidation.data

    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    
    interface HealthInfo {
      status: 'healthy' | 'unhealthy'
      timestamp: string
      service: string
      database: 'connected' | 'disconnected'
      details?: {
        totalUsers: number
        totalCompanies: number
        uptime: number
        nodeVersion: string
        environment: string
      }
      error?: string
    }

    const healthInfo: HealthInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'performance-management-system',
      database: 'connected'
    }

    // Add detailed information if requested
    if (detailed) {
      const [userCount, companyCount] = await Promise.all([
        prisma.user.count(),
        prisma.company.count()
      ])

      healthInfo.details = {
        totalUsers: userCount,
        totalCompanies: companyCount,
        uptime: process.uptime(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development'
      }
    }
    
    return NextResponse.json(healthInfo)
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