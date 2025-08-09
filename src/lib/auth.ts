import bcrypt from 'bcryptjs'
import { prisma } from './prisma-client'

export interface AuthUser {
  id: string
  name: string
  email?: string
  username?: string
  role: string
  companyId: string
  userType: 'office' | 'operational'
  department?: string
  position?: string
}

export async function authenticateUser(
  identifier: string,
  password: string,
  companyCode?: string
): Promise<AuthUser | null> {
  // Determine if identifier is email or username
  const isEmail = identifier.includes('@')
  
  let user
  
  if (isEmail) {
    // Office worker login
    user = await prisma.user.findFirst({
      where: {
        email: identifier,
        active: true,
        ...(companyCode && {
          company: { code: companyCode }
        })
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        passwordHash: true,
        role: true,
        companyId: true,
        userType: true,
        department: true,
        position: true,
        company: {
          select: { code: true }
        }
      }
    })
  } else {
    // Operational worker login
    user = await prisma.user.findFirst({
      where: {
        username: identifier,
        active: true,
        ...(companyCode && {
          company: { code: companyCode }
        })
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        passwordHash: true,
        role: true,
        companyId: true,
        userType: true,
        department: true,
        position: true,
        company: {
          select: { code: true }
        }
      }
    })
  }

  if (!user || !user.passwordHash) {
    return null
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash)
  if (!isValidPassword) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email || undefined,
    username: user.username || undefined,
    role: user.role,
    companyId: user.companyId,
    userType: user.userType as 'office' | 'operational',
    department: user.department || undefined,
    position: user.position || undefined
  }
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id, active: true },
    include: { company: true }
  })

  if (!user) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email || undefined,
    username: user.username || undefined,
    role: user.role,
    companyId: user.companyId,
    userType: user.userType as 'office' | 'operational',
    department: user.department || undefined,
    position: user.position || undefined
  }
}