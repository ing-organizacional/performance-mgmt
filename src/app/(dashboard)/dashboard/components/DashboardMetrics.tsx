'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'

interface CompletionStats {
  total: number
  completed: number
  inProgress: number
  pending: number
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

interface DashboardMetricsProps {
  completionStats: CompletionStats
  ratingDistribution: RatingDistribution
}

export function DashboardMetrics({ 
  completionStats, 
  ratingDistribution 
}: DashboardMetricsProps) {
  const router = useRouter()
  const { t } = useLanguage()

  const completionPercentage = completionStats.total > 0 
    ? Math.round((completionStats.completed / completionStats.total) * 100)
    : 0

  // Calculate trend indicators
  const totalRatings = Object.values(ratingDistribution).reduce((sum, count) => sum + count, 0)
  const averageRating = totalRatings > 0 
    ? (ratingDistribution.outstanding * 5 + ratingDistribution.exceeds * 4 + ratingDistribution.meets * 3 + ratingDistribution.below * 2 + ratingDistribution.needs * 1) / totalRatings
    : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
      
      {/* Primary Completion Metric */}
      <Link href="/dashboard/pending" className="lg:col-span-2 group">
        <div className="bg-white rounded-2xl border border-gray-200/60 p-8 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 group">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors mb-2">
                {t.dashboard.completionStatus}
              </h2>
              <p className="text-sm text-gray-600">{t.dashboard.clickToManagePending}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary mb-1">{completionPercentage}%</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">{t.dashboard.completeStatus}</div>
            </div>
          </div>
          
          {/* Enhanced Progress Bar */}
          <div className="mb-6">
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="text-2xl font-bold text-green-600 mb-1">{completionStats.completed}</div>
              <div className="text-xs font-semibold text-green-700 uppercase tracking-wide">{t.dashboard.completed}</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="text-2xl font-bold text-blue-600 mb-1">{completionStats.inProgress}</div>
              <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">{t.dashboard.inProgressStatus}</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-100">
              <div className="text-2xl font-bold text-orange-600 mb-1">{completionStats.pending}</div>
              <div className="text-xs font-semibold text-orange-700 uppercase tracking-wide">{t.dashboard.remaining}</div>
            </div>
          </div>
        </div>
      </Link>

      {/* Quick Stats Cards */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{t.dashboard.totalEmployeesHeader}</h3>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-gray-900">{completionStats.total}</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{t.dashboard.avgRatingHeader}</h3>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
        </div>
      </div>

      {/* Performance Distribution */}
      <button 
        onClick={() => router.push('/dashboard/ratings')}
        className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 text-left"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">{t.dashboard.generalResults}</h3>
          <svg className="w-5 h-5 text-gray-400 hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        
        <div className="space-y-3">
          {[
            { 
              key: 'outstanding', 
              label: t.dashboard.outstanding,
              bgClass: 'bg-emerald-50',
              borderClass: 'border-emerald-100',
              dotClass: 'bg-emerald-500',
              textClass: 'text-emerald-800',
              countClass: 'text-emerald-700',
              barBgClass: 'bg-emerald-200',
              barFillClass: 'bg-emerald-600'
            },
            { 
              key: 'exceeds', 
              label: t.dashboard.exceeds,
              bgClass: 'bg-blue-50',
              borderClass: 'border-blue-100',
              dotClass: 'bg-blue-500',
              textClass: 'text-blue-800',
              countClass: 'text-blue-700',
              barBgClass: 'bg-blue-200',
              barFillClass: 'bg-blue-600'
            },
            { 
              key: 'meets', 
              label: t.dashboard.meets,
              bgClass: 'bg-gray-50',
              borderClass: 'border-gray-100',
              dotClass: 'bg-gray-500',
              textClass: 'text-gray-800',
              countClass: 'text-gray-700',
              barBgClass: 'bg-gray-200',
              barFillClass: 'bg-gray-600'
            },
            { 
              key: 'below', 
              label: t.dashboard.below,
              bgClass: 'bg-amber-50',
              borderClass: 'border-amber-100',
              dotClass: 'bg-amber-500',
              textClass: 'text-amber-800',
              countClass: 'text-amber-700',
              barBgClass: 'bg-amber-200',
              barFillClass: 'bg-amber-600'
            },
            { 
              key: 'needs', 
              label: t.dashboard.needsImprovement,
              bgClass: 'bg-red-50',
              borderClass: 'border-red-100',
              dotClass: 'bg-red-500',
              textClass: 'text-red-800',
              countClass: 'text-red-700',
              barBgClass: 'bg-red-200',
              barFillClass: 'bg-red-600'
            }
          ].map(({ key, label, bgClass, borderClass, dotClass, textClass, countClass, barBgClass, barFillClass }) => {
            const count = ratingDistribution[key as keyof RatingDistribution]
            const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0
            
            return (
              <div key={key} className={`flex items-center justify-between p-3 rounded-lg border ${bgClass} ${borderClass}`}>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${dotClass}`}></div>
                  <span className={`text-sm font-semibold ${textClass}`}>{label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-base font-bold ${countClass}`}>{count}</span>
                  <div className={`w-16 rounded-full h-2 ${barBgClass}`}>
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${barFillClass}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </button>
    </div>
  )
}