import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authenticateUser } from '@/lib/auth'
import type { NextAuthConfig } from 'next-auth'

export const config = {
  providers: [
    Credentials({
      credentials: {
        identifier: { label: 'Email or Username' },
        password: { label: 'Password', type: 'password' },
        companyCode: { label: 'Company Code' }
      },
      async authorize(credentials) {
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
            role: user.role,
            companyId: user.companyId,
            userType: user.userType,
            department: user.department
          }
        }

        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.companyId = (user as any).companyId
        token.userType = (user as any).userType
        token.department = (user as any).department
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        ;(session.user as any).role = token.role
        ;(session.user as any).companyId = token.companyId
        ;(session.user as any).userType = token.userType
        ;(session.user as any).department = token.department
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