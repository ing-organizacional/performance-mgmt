'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'

interface Evaluation {
  id: string
  period: string
  status: 'draft' | 'submitted' | 'approved'
  overallRating: number | null
  submittedAt: string | null
  managerName: string
}

export default function MyEvaluationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [evaluations, setEvaluations] = useState<Evaluation[]>([
    {
      id: '1',
      period: 'Q1 2024',
      status: 'approved',
      overallRating: 4,
      submittedAt: '2024-03-15',
      managerName: 'John Manager'
    },
    {
      id: '2',
      period: 'Q4 2023',
      status: 'approved',
      overallRating: 3,
      submittedAt: '2023-12-20',
      managerName: 'John Manager'
    },
    {
      id: '3',
      period: 'Q3 2023',
      status: 'approved',
      overallRating: 4,
      submittedAt: '2023-09-25',
      managerName: 'John Manager'
    }
  ])

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'submitted': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRatingStars = (rating: number | null) => {
    if (!rating) return <span className="text-gray-400">Not rated</span>
    
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{t.nav.myEvaluations}</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {session?.user?.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-lg hover:bg-green-700 active:scale-95 transition-all duration-150 touch-manipulation"
                title={t.auth.signOut}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Current Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Current Period</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Q1 2024
            </span>
          </div>
          
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Evaluation Complete!
            </h3>
            <p className="text-gray-600 mb-4">
              Your Q1 2024 performance evaluation has been submitted and approved.
            </p>
            <div className="flex items-center justify-center mb-2">
              {getRatingStars(4)}
              <span className="ml-2 text-sm font-medium text-gray-700">
                Exceeds Expectations
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Reviewed by {evaluations[0]?.managerName}
            </p>
          </div>
        </div>

        {/* Evaluation History */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Evaluation History</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {evaluations.map((evaluation) => (
              <div key={evaluation.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium text-gray-900">
                        {evaluation.period}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(evaluation.status)}`}>
                        {evaluation.status.charAt(0).toUpperCase() + evaluation.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center">
                        {getRatingStars(evaluation.overallRating)}
                        {evaluation.overallRating && (
                          <span className="ml-2 text-sm text-gray-600">
                            ({evaluation.overallRating}/5)
                          </span>
                        )}
                      </div>
                      {evaluation.submittedAt && (
                        <span className="text-sm text-gray-500">
                          {new Date(evaluation.submittedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500 mt-1">
                      Reviewed by {evaluation.managerName}
                    </p>
                  </div>
                  
                  <div className="ml-4">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">4.0</div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">3</div>
              <div className="text-sm text-gray-600">Completed Reviews</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              🏆 Consistently exceeding expectations in performance reviews
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}