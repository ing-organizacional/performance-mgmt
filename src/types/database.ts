/**
 * Database Model Type Definitions
 * 
 * TypeScript interfaces that mirror the Prisma database schema for compile-time type safety.
 * These types ensure consistency between database operations and application logic, providing
 * strict typing for all data access patterns across the performance management system.
 * 
 * Key Features:
 * - Direct mapping to Prisma schema models for type safety
 * - Support for multi-tenancy with company-scoped data isolation
 * - Extended types with computed relations and aggregates
 * - Comprehensive user role and permission modeling
 * - Performance cycle and evaluation workflow support
 * 
 * Core Entities:
 * - Company: Multi-tenant organization structure
 * - User: Employee, manager, and HR user accounts with role hierarchy
 * - Evaluation: Performance evaluation records with ratings and feedback
 * - EvaluationItem: Configurable evaluation criteria (OKRs, competencies)
 * - PerformanceCycle: Time-bounded evaluation periods
 * - PartialAssessment: Incremental evaluation data collection
 * 
 * Extended Types:
 * - UserWithDetails: Users with relationship data and counts
 * - EvaluationCycle: Cycles with related entity statistics
 */

export interface Company {
  id: string
  name: string
  code: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  companyId: string
  email: string | null
  username: string | null
  name: string
  role: 'employee' | 'manager' | 'hr'
  managerId: string | null
  active: boolean
  passwordHash: string | null
  pinCode: string | null
  userType: 'office' | 'operational'
  loginMethod: string
  requiresPinOnly: boolean
  employeeId: string | null
  personID: string | null
  department: string | null
  position: string | null
  shift: string | null
  lastLogin: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Evaluation {
  id: string
  employeeId: string
  managerId: string
  companyId: string
  cycleId: string | null
  periodType: string
  periodDate: string
  evaluationItemsData: string | null
  overallRating: number | null
  managerComments: string | null
  status: 'draft' | 'submitted' | 'completed'
  createdAt: Date
  updatedAt: Date
}

export interface EvaluationItem {
  id: string
  companyId: string
  cycleId: string | null
  title: string
  description: string
  type: 'okr' | 'competency'
  level: 'company' | 'department' | 'manager'
  createdBy: string
  assignedTo: string | null
  active: boolean
  sortOrder: number
  evaluationDeadline: Date | null
  deadlineSetBy: string | null
  createdAt: Date
  updatedAt: Date
}

export interface PerformanceCycle {
  id: string
  companyId: string
  name: string
  startDate: Date
  endDate: Date
  status: 'active' | 'closed' | 'archived'
  closedBy: string | null
  closedAt: Date | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface PartialAssessment {
  id: string
  cycleId: string
  employeeId: string
  evaluationItemId: string
  rating: number | null
  comment: string | null
  assessedBy: string
  assessedAt: Date
  evaluationDate: Date
  isActive: boolean
  assessmentType: string
  companyId: string
  createdAt: Date
  updatedAt: Date
}

// Extended database types with relations
export interface UserWithDetails extends User {
  company?: Pick<Company, 'name' | 'code'>
  manager?: Pick<User, 'name' | 'email'> | null
  _count?: {
    employees: number
    evaluationsReceived: number
  }
}

export interface EvaluationCycle extends PerformanceCycle {
  _count?: {
    evaluations: number
    evaluationItems: number
    partialAssessments: number
  }
}