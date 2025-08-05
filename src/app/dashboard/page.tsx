'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ExportButton from '@/components/export-button'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'

interface CompletionStats {
  total: number
  completed: number
  overdue: number
  duesSoon: number
}

interface RatingDistribution {
  outstanding: number
  exceeds: number
  meets: number
  below: number
  needs: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [completionStats, setCompletionStats] = useState<CompletionStats>({
    total: 150,
    completed: 87,
    overdue: 12,
    duesSoon: 8
  })
  const [ratingDistribution, setRatingDistribution] = useState<RatingDistribution>({
    outstanding: 15,
    exceeds: 38,
    meets: 82,
    below: 8,
    needs: 7
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    const userRole = (session.user as any)?.role
    if (userRole !== 'hr' && userRole !== 'manager') {
      router.push('/my-evaluations')
      return
    }

    setLoading(false)
  }, [session, status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t.common.loading}</div>
      </div>
    )
  }

  const completionPercentage = Math.round((completionStats.completed / completionStats.total) * 100)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          {/* Title Section */}
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold text-gray-900 truncate">{t.dashboard.hrDashboard}</h1>
              <p className="text-xs text-gray-500">{t.dashboard.q1Reviews}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center justify-center w-9 h-9 bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-95 transition-all duration-150 touch-manipulation ml-3"
              title={t.auth.signOut}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
          
          {/* Actions Section */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/evaluations')}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 active:scale-95 transition-all duration-150 touch-manipulation"
            >
              {t.dashboard.newEvaluation}
            </button>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Completion Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t.dashboard.completionStatus}</h2>
            <span className="text-2xl font-bold text-blue-600">{completionPercentage}%</span>
          </div>
          
          <div className="mb-4">
            <div className="bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completionStats.completed}</div>
              <div className="text-sm text-gray-600">{t.dashboard.completed}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">{completionStats.total - completionStats.completed}</div>
              <div className="text-sm text-gray-600">{t.dashboard.remaining}</div>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="space-y-3">
          {completionStats.overdue > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {completionStats.overdue} {t.dashboard.overdueEvaluations}
                    </h3>
                    <p className="text-sm text-red-600 mt-1">
                      {t.dashboard.pastDueDate}
                    </p>
                  </div>
                </div>
                <button className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors">
                  {t.dashboard.sendReminders}
                </button>
              </div>
            </div>
          )}

          {completionStats.duesSoon > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      {completionStats.duesSoon} {t.dashboard.dueSoon}
                    </h3>
                    <p className="text-sm text-yellow-600 mt-1">
                      {t.dashboard.dueWithinDays}
                    </p>
                  </div>
                </div>
                <button className="px-3 py-1 bg-yellow-600 text-white rounded text-xs font-medium hover:bg-yellow-700 transition-colors">
                  {t.dashboard.viewList}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rating Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.dashboard.ratingDistribution}</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">{t.dashboard.outstanding}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">{ratingDistribution.outstanding}</span>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(ratingDistribution.outstanding / completionStats.completed) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">{t.dashboard.exceeds}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">{ratingDistribution.exceeds}</span>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(ratingDistribution.exceeds / completionStats.completed) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">{t.dashboard.meets}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">{ratingDistribution.meets}</span>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-500 h-2 rounded-full" 
                    style={{ width: `${(ratingDistribution.meets / completionStats.completed) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">{t.dashboard.below}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">{ratingDistribution.below}</span>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full" 
                    style={{ width: `${(ratingDistribution.below / completionStats.completed) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">{t.dashboard.needsImprovement}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">{ratingDistribution.needs}</span>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${(ratingDistribution.needs / completionStats.completed) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.dashboard.quickActions}</h2>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">{t.dashboard.exportAllEvaluations}</span>
              </div>
              <ExportButton
                companyId={(session?.user as any)?.companyId}
                periodType="quarterly"
                periodDate="2024-Q1"
                format="excel"
                className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                Excel
              </ExportButton>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">{t.dashboard.generateReports}</span>
              </div>
              <div className="flex gap-2">
                <ExportButton
                  companyId={(session?.user as any)?.companyId}
                  format="excel"
                  className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
                >
                  {t.dashboard.allPeriods}
                </ExportButton>
              </div>
            </div>

            <button 
              onClick={() => router.push('/users')}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">{t.dashboard.manageUsers}</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button 
              onClick={() => router.push('/okrs')}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Manage OKRs</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push('/evaluations')}
            className="text-sm text-blue-600 font-medium"
          >
            {t.dashboard.startEvaluating}
          </button>
          <span className="text-sm text-gray-500">
            {t.dashboard.lastUpdated}: {new Date().toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  )
}