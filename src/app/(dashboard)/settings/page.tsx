import { Suspense } from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma-client'
import SettingsClient from './SettingsClient'
import BackButton from './BackButton'

export default async function SettingsPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  // Fetch fresh user data from database to get current department info
  const freshUserData = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      userType: true,
      companyId: true
    }
  })

  if (!freshUserData) {
    redirect('/login')
  }

  // Combine session user with fresh database data
  const user = {
    ...session.user,
    department: freshUserData.department || undefined,
    name: freshUserData.name,
    email: freshUserData.email || session.user.email
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        </div>
        
        <Suspense fallback={
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }>
          <SettingsClient user={user} />
        </Suspense>
      </div>
    </div>
  )
}