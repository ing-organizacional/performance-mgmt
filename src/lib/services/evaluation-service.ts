// Evaluation business logic
// Centralized evaluation operations and validation

import { prisma } from '@/lib/prisma-client'
import { EvaluationItem, Evaluation } from '@/types'

export class EvaluationService {
  static async createEvaluationItem(
    companyId: string,
    createdBy: string,
    data: {
      title: string
      description: string
      type: 'okr' | 'competency'
      level: 'company' | 'department' | 'manager'
      assignedTo?: string | null
      cycleId?: string | null
      evaluationDeadline?: Date | null
    }
  ): Promise<EvaluationItem> {
    // Get next sort order
    const maxOrder = await prisma.evaluationItem.aggregate({
      where: { companyId },
      _max: { sortOrder: true }
    })

    const result = await prisma.evaluationItem.create({
      data: {
        companyId,
        title: data.title,
        description: data.description,
        type: data.type,
        level: data.level,
        createdBy,
        assignedTo: data.assignedTo || null,
        cycleId: data.cycleId || null,
        evaluationDeadline: data.evaluationDeadline || null,
        deadlineSetBy: data.evaluationDeadline ? createdBy : null,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
        active: true
      }
    })

    return result as EvaluationItem
  }

  static async updateEvaluationItem(
    itemId: string,
    companyId: string,
    data: {
      title?: string
      description?: string
      evaluationDeadline?: Date | null
      deadlineSetBy?: string | null
    }
  ): Promise<EvaluationItem> {
    const result = await prisma.evaluationItem.update({
      where: { 
        id: itemId,
        companyId // Ensure company isolation
      },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.evaluationDeadline !== undefined && { 
          evaluationDeadline: data.evaluationDeadline,
          deadlineSetBy: data.deadlineSetBy || null
        })
      }
    })

    return result as EvaluationItem
  }

  static async assignItemsToEmployees(
    itemId: string,
    employeeIds: string[],
    assignedBy: string,
    companyId: string
  ): Promise<void> {
    // Create assignments
    const assignments = employeeIds.map(employeeId => ({
      evaluationItemId: itemId,
      employeeId,
      companyId,
      assignedBy
    }))

    await prisma.evaluationItemAssignment.createMany({
      data: assignments
    })
  }

  static async unassignItemsFromEmployees(
    itemId: string,
    employeeIds: string[],
    companyId: string
  ): Promise<void> {
    await prisma.evaluationItemAssignment.deleteMany({
      where: {
        evaluationItemId: itemId,
        employeeId: { in: employeeIds },
        companyId
      }
    })
  }

  static async getEvaluationItemsByCompany(
    companyId: string,
    includeInactive = false
  ): Promise<EvaluationItem[]> {
    const results = await prisma.evaluationItem.findMany({
      where: {
        companyId,
        ...(includeInactive ? {} : { active: true })
      },
      orderBy: { sortOrder: 'asc' }
    })

    return results as EvaluationItem[]
  }

  static async getTeamMembers(managerId: string, companyId: string) {
    return await prisma.user.findMany({
      where: {
        companyId,
        managerId,
        active: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        evaluationsReceived: {
          select: {
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { name: 'asc' }
    })
  }

  static async getUserEvaluations(userId: string, companyId: string): Promise<Evaluation[]> {
    const results = await prisma.evaluation.findMany({
      where: {
        employeeId: userId,
        companyId
      },
      include: {
        manager: {
          select: { name: true, email: true }
        },
        cycle: {
          select: { name: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return results as Evaluation[]
  }

  static calculateUrgency(deadline: Date | null): 'overdue' | 'high' | 'medium' | 'low' | null {
    if (!deadline) return null

    const now = new Date()
    const diffTime = deadline.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'overdue'
    if (diffDays <= 3) return 'high'
    if (diffDays <= 7) return 'medium'
    return 'low'
  }
}