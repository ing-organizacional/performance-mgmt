'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      window.location.href = '/login'
      return
    }

    // Direct redirect based on role - use window.location for faster navigation
    const userRole = (session.user as any)?.role
    if (userRole === 'hr') {
      window.location.href = '/dashboard'
    } else if (userRole === 'manager') {
      window.location.href = '/evaluations'
    } else {
      window.location.href = '/my-evaluations'
    }
  }, [session, status])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Redirecting...</div>
    </div>
  )
}
