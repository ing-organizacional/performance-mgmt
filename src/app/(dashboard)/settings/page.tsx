import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma-client'
import SettingsPageContent from './SettingsPageContent'

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
      position: true,
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
    position: freshUserData.position || undefined,
    name: freshUserData.name,
    email: freshUserData.email || session.user.email
  }

  return (
    <SettingsPageContent user={user} />
  )
}