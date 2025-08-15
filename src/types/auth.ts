/**
 * Authentication and Session Type Definitions
 * 
 * Comprehensive type definitions for authentication, authorization, and session management.
 * Extends NextAuth default types to support the application's role-based access control
 * and multi-tenant architecture. Provides type safety for all authentication flows.
 * 
 * Key Features:
 * - Extended NextAuth session and JWT types with custom user properties
 * - Role-based permission system with granular access control
 * - Multi-tenant authentication with company isolation
 * - Support for both office and operational user types
 * - Flexible authentication credential handling
 * - Middleware configuration types for route protection
 * 
 * Authentication Flow:
 * - Credential-based authentication with username/email + password
 * - Company code validation for multi-tenant access
 * - Role-based session enrichment with department and position data
 * - JWT token customization for server-side authorization
 * 
 * Permission System:
 * - Hierarchical role structure (employee < manager < hr)
 * - Granular permission definitions for feature access
 * - Route-level authorization configuration
 */

export interface SessionUser {
  id: string
  name: string
  email: string
  role: 'employee' | 'manager' | 'hr'
  companyId: string
  userType: 'office' | 'operational'
  department?: string
  position?: string
}

// NextAuth session extension
declare module 'next-auth' {
  interface Session {
    user: SessionUser
  }

  interface User {
    id: string
    name: string
    email: string
    role: 'employee' | 'manager' | 'hr'
    companyId: string
    userType: 'office' | 'operational'
    department?: string
    position?: string
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role: 'employee' | 'manager' | 'hr'
    companyId: string
    userType: 'office' | 'operational'
    department?: string
    position?: string
  }
}

// Authentication credential types
export interface AuthCredentials {
  identifier: string
  password: string
  companyCode?: string
}

export interface AuthResult {
  success: boolean
  user?: SessionUser
  error?: string
}

// Permission types
export type Permission = 
  | 'view_dashboard' 
  | 'manage_users' 
  | 'manage_cycles' 
  | 'view_reports' 
  | 'evaluate_employees'
  | 'view_own_evaluations'

export interface RolePermissions {
  hr: Permission[]
  manager: Permission[]
  employee: Permission[]
}

// Authentication middleware types  
export interface AuthMiddlewareConfig {
  requireAuth?: boolean
  requireRole?: 'hr' | 'manager' | 'employee' | 'hr_or_manager'
  redirectTo?: string
}