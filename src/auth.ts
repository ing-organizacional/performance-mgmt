/**
 * NextAuth v5 Configuration
 * 
 * Configures authentication for the performance management system with support for:
 * - Username/password authentication for office workers
 * - PIN-based authentication for operational workers  
 * - Biometric authentication (WebAuthn/FIDO2) for enhanced security
 * - Company-based multi-tenancy with role-based access control
 * - JWT sessions with 24-hour expiration for security
 */

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authenticateUser } from '@/lib/auth'
import type { NextAuthConfig } from 'next-auth'

export const config = {
  trustHost: true, // Allow localhost and other development hosts
  providers: [
    Credentials({
      credentials: {
        identifier: { label: 'Email or Username' },
        password: { label: 'Password', type: 'password' },
        companyCode: { label: 'Company Code' },
        biometricAuth: { label: 'Biometric Auth' },
        userId: { label: 'User ID' }
      },
      async authorize(credentials) {
        // Handle biometric authentication
        if (credentials?.biometricAuth === 'true' && credentials?.userId) {
          // For biometric auth, we trust the server-side verification has already happened
          // Just fetch the user data by ID
          const { prisma } = await import('@/lib/prisma-client')
          
          const user = await prisma.user.findUnique({
            where: { id: credentials.userId as string },
            include: { company: true }
          })

          if (user) {
            return {
              id: user.id,
              name: user.name,
              email: user.email || `${user.username}@${user.companyId}`,
              role: user.role as 'employee' | 'manager' | 'hr',
              companyId: user.companyId,
              userType: user.userType as 'office' | 'operational',
              department: user.department || undefined,
              position: user.position || undefined
            }
          }

          return null
        }

        // Handle regular username/password authentication
        if (!credentials?.identifier || !credentials?.password) {
          return null
        }

        const user = await authenticateUser(
          credentials.identifier as string,
          credentials.password as string,
          credentials.companyCode as string || undefined
        )

        if (user) {
          return {
            id: user.id,
            name: user.name,
            email: user.email || `${user.username}@${user.companyId}`,
            role: user.role as 'employee' | 'manager' | 'hr',
            companyId: user.companyId,
            userType: user.userType as 'office' | 'operational',
            department: user.department || undefined,
            position: user.position || undefined
          }
        }

        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role as 'employee' | 'manager' | 'hr'
        token.companyId = user.companyId as string
        token.userType = user.userType as 'office' | 'operational'
        token.department = user.department as string | undefined
        token.position = user.position as string | undefined
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as 'employee' | 'manager' | 'hr'
        session.user.companyId = token.companyId as string
        session.user.userType = token.userType as 'office' | 'operational'
        session.user.department = token.department as string | undefined
        session.user.position = token.position as string | undefined
      }
      return session
    }
  },
  pages: {
    signIn: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  }
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)