import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    name: string
    email: string
    role: 'employee' | 'manager' | 'hr'
    companyId: string
    userType: 'office' | 'operational'
    department?: string
  }

  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: 'employee' | 'manager' | 'hr'
      companyId: string
      userType: 'office' | 'operational'
      department?: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'employee' | 'manager' | 'hr'
    companyId: string
    userType: 'office' | 'operational'
    department?: string
  }
}