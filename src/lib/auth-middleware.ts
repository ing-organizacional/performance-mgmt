import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export interface AuthUser {
  id: string
  role: string
  companyId: string
  userType: string
  department?: string
}

export async function requireAuth(): Promise<{ user: AuthUser } | NextResponse> {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ 
      success: false, 
      error: 'Authentication required' 
    }, { status: 401 })
  }

  const sessionUser = session.user as AuthUser & { id: string }
  const user: AuthUser = {
    id: sessionUser.id,
    role: sessionUser.role,
    companyId: sessionUser.companyId,
    userType: sessionUser.userType,
    department: sessionUser.department
  }

  return { user }
}

export async function requireHRRole(_request: NextRequest): Promise<{ user: AuthUser } | NextResponse> {
  const authResult = await requireAuth()
  
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { user } = authResult

  if (user.role !== 'hr') {
    return NextResponse.json({ 
      success: false, 
      error: 'Access denied - HR role required' 
    }, { status: 403 })
  }

  return { user }
}

export async function requireManagerOrHR(_request: NextRequest): Promise<{ user: AuthUser } | NextResponse> {
  const authResult = await requireAuth()
  
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { user } = authResult

  if (user.role !== 'hr' && user.role !== 'manager') {
    return NextResponse.json({ 
      success: false, 
      error: 'Access denied - Manager or HR role required' 
    }, { status: 403 })
  }

  return { user }
}