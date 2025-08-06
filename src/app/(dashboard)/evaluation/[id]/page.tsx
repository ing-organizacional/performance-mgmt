'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ExportButton } from '@/components/features/dashboard'
import type { OKRItem, CompetencyItem } from '@/types'

interface EvaluationDetail {
  id: string
  employee: {
    name: string
    email: string | null
    department: string | null
  }
  manager: {
    name: string
  }
  periodType: string
  periodDate: string
  okrsData: Record<string, OKRItem>
  competenciesData: Record<string, CompetencyItem>
  overallRating: number | null
  managerComments: string | null
  status: string
  createdAt: string
}

export default function EvaluationDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    // Mock evaluation data - in real app, fetch from API
    setEvaluation({
      id: params.id as string,
      employee: {
        name: 'Office Employee 1',
        email: 'employee1@demo.com',
        department: 'Operations'
      },
      manager: {
        name: 'John Manager'
      },
      periodType: 'quarterly',
      periodDate: '2024-Q1',
      okrsData: {
        okr_1: {
          id: 'okr_1',
          title: 'Increase Sales by 20%',
          description: 'Achieve 20% increase in quarterly sales',
          type: 'okr' as const,
          rating: 4,
          comment: 'Exceeded target by 5%'
        },
        okr_2: {
          id: 'okr_2',
          title: 'Launch New Product Line',
          description: 'Successfully launch the new product line',
          type: 'okr' as const,
          rating: 3,
          comment: 'Delayed but quality improved'
        }
      },
      competenciesData: {
        competency_1: {
          id: 'competency_1',
          title: 'Communication',
          description: 'Communication skills assessment',
          type: 'competency' as const,
          rating: 5,
          comment: 'Excellent presentation skills'
        },
        competency_2: {
          id: 'competency_2',
          title: 'Leadership',
          description: 'Leadership skills assessment',
          type: 'competency' as const,
          rating: 4,
          comment: 'Good team motivation'
        }
      },
      overallRating: 4,
      managerComments: 'Strong performance overall. Continue focus on leadership development.',
      status: 'submitted',
      createdAt: '2024-03-15T10:30:00Z'
    })
    setLoading(false)
  }, [session, status, router, params.id])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!evaluation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Evaluation not found</div>
      </div>
    )
  }

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Needs Improvement'
      case 2: return 'Below Expectations'
      case 3: return 'Meets Expectations'
      case 4: return 'Exceeds Expectations'
      case 5: return 'Outstanding'
      default: return 'Not Rated'
    }
  }

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
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
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="flex items-center gap-3">
              <ExportButton
                evaluationId={evaluation.id}
                type="evaluation"
                format="pdf"
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Export PDF
              </ExportButton>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-4xl mx-auto">
        {/* Employee Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Performance Evaluation</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              evaluation.status === 'submitted' ? 'bg-green-100 text-green-800' : 
              evaluation.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              {evaluation.status.toUpperCase()}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Employee Information</h3>
              <p className="text-gray-600"><strong>Name:</strong> {evaluation.employee.name}</p>
              {evaluation.employee.email && (
                <p className="text-gray-600"><strong>Email:</strong> {evaluation.employee.email}</p>
              )}
              {evaluation.employee.department && (
                <p className="text-gray-600"><strong>Department:</strong> {evaluation.employee.department}</p>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Evaluation Details</h3>
              <p className="text-gray-600"><strong>Period:</strong> {evaluation.periodType} {evaluation.periodDate}</p>
              <p className="text-gray-600"><strong>Manager:</strong> {evaluation.manager.name}</p>
              <p className="text-gray-600"><strong>Completed:</strong> {new Date(evaluation.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Overall Rating */}
        {evaluation.overallRating && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Overall Performance Rating</h2>
            <div className="flex items-center gap-4">
              {getRatingStars(evaluation.overallRating)}
              <span className="text-lg font-medium text-gray-900">
                {evaluation.overallRating}/5 - {getRatingText(evaluation.overallRating)}
              </span>
            </div>
          </div>
        )}

        {/* OKRs */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Objectives and Key Results</h2>
          <div className="space-y-6">
            {Object.entries(evaluation.okrsData).map(([key, okr]: [string, OKRItem]) => (
              <div key={key} className="border-b border-gray-200 pb-4 last:border-b-0">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{okr.title}</h3>
                <div className="flex items-center gap-3 mb-2">
                  {getRatingStars(okr.rating ?? 0)}
                  <span className="text-sm text-gray-600">
                    {okr.rating ?? 0}/5 - {getRatingText(okr.rating ?? 0)}
                  </span>
                </div>
                {okr.comment && (
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{okr.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Competencies */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Competencies</h2>
          <div className="space-y-6">
            {Object.entries(evaluation.competenciesData).map(([key, competency]: [string, CompetencyItem]) => (
              <div key={key} className="border-b border-gray-200 pb-4 last:border-b-0">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{competency.title}</h3>
                <div className="flex items-center gap-3 mb-2">
                  {getRatingStars(competency.rating ?? 0)}
                  <span className="text-sm text-gray-600">
                    {competency.rating ?? 0}/5 - {getRatingText(competency.rating ?? 0)}
                  </span>
                </div>
                {competency.comment && (
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{competency.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Manager Comments */}
        {evaluation.managerComments && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Manager Comments</h2>
            <p className="text-gray-700 bg-blue-50 p-4 rounded-md">{evaluation.managerComments}</p>
          </div>
        )}
      </div>
    </div>
  )
}