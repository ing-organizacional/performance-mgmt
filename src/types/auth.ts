// Authentication and session types
// NextAuth and user session definitions

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