// Performance cycle business logic
// Centralized cycle operations and validation

import { prisma } from '@/lib/prisma-client'
import { PerformanceCycle, EvaluationCycle } from '@/types'

export class CycleService {
  static async createCycle(
    companyId: string, 
    createdBy: string, 
    data: { name: string; startDate: Date; endDate: Date }
  ): Promise<PerformanceCycle> {
    // Check if there's already an active cycle
    const activeCycle = await this.getActiveCycle(companyId)
    if (activeCycle) {
      throw new Error('Only one active cycle is allowed at a time. Please close the current active cycle first.')
    }

    const cycle = await prisma.performanceCycle.create({
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'active' as const,
        companyId,
        createdBy
      }
    })
    
    return cycle as PerformanceCycle
  }

  static async updateCycleStatus(
    cycleId: string, 
    companyId: string, 
    status: 'active' | 'closed' | 'archived',
    closedBy?: string
  ): Promise<PerformanceCycle> {
    // If activating a cycle, ensure no other active cycles exist
    if (status === 'active') {
      const activeCycle = await prisma.performanceCycle.findFirst({
        where: {
          companyId,
          status: 'active',
          id: { not: cycleId }
        }
      })

      if (activeCycle) {
        throw new Error('Only one active cycle is allowed at a time. Please close other active cycles first.')
      }
    }

    const updateData: {
      status: string
      closedAt?: Date | null
      closedBy?: string | null
    } = { status }

    if (status === 'closed') {
      updateData.closedAt = new Date()
      updateData.closedBy = closedBy
    } else if (status === 'active') {
      updateData.closedAt = null
      updateData.closedBy = null
    }

    const updatedCycle = await prisma.performanceCycle.update({
      where: { id: cycleId },
      data: updateData
    })
    
    return updatedCycle as PerformanceCycle
  }

  static async deleteCycle(cycleId: string, companyId: string): Promise<void> {
    // Check if cycle has dependent data
    const cycle = await prisma.performanceCycle.findFirst({
      where: { id: cycleId, companyId },
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

    if (!cycle) {
      throw new Error('Cycle not found')
    }

    const hasData = cycle._count.evaluations > 0 || 
                   cycle._count.evaluationItems > 0 || 
                   cycle._count.partialAssessments > 0

    if (hasData) {
      throw new Error(`Cannot delete cycle - it contains ${cycle._count.evaluations} evaluations, ${cycle._count.evaluationItems} items, and ${cycle._count.partialAssessments} assessments. Archive it instead.`)
    }

    await prisma.performanceCycle.delete({
      where: { id: cycleId }
    })
  }

  static async getCyclesByCompany(companyId: string): Promise<EvaluationCycle[]> {
    const cycles = await prisma.performanceCycle.findMany({
      where: { companyId },
      include: {
        _count: {
          select: {
            evaluations: true,
            evaluationItems: true,
            partialAssessments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return cycles as EvaluationCycle[]
  }

  static async getActiveCycle(companyId: string): Promise<PerformanceCycle | null> {
    const cycle = await prisma.performanceCycle.findFirst({
      where: {
        companyId,
        status: 'active' as const
      }
    })
    
    return cycle as PerformanceCycle | null
  }

  static async getCycleById(cycleId: string, companyId: string): Promise<EvaluationCycle | null> {
    const cycle = await prisma.performanceCycle.findFirst({
      where: { id: cycleId, companyId },
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
    
    return cycle as EvaluationCycle | null
  }

  static validateDateRange(startDate: Date, endDate: Date): void {
    if (endDate <= startDate) {
      throw new Error('End date must be after start date')
    }

    const now = new Date()
    if (startDate < now && Math.abs(startDate.getTime() - now.getTime()) > 24 * 60 * 60 * 1000) {
      throw new Error('Start date cannot be more than 24 hours in the past')
    }
  }
}