'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LoadingPage, RedirectingPage } from '@/components/ui'

export default function HomePage() {
  const { data: session, status } = useSession()
  const { t } = useLanguage()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      window.location.href = '/login'
      return
    }

    // Direct redirect based on role - use window.location for faster navigation
    const userRole = session.user?.role
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
      <LoadingPage 
        message={t.common.authenticating}
        subtitle={t.common.authenticationSubtitle}
      />
    )
  }

  return (
    <RedirectingPage 
      message={t.common.welcomeBack}
      destination={t.common.yourDashboard}
    />
  )
}
