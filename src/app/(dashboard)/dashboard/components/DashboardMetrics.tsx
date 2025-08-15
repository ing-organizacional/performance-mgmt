'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { Users, Star, ChevronRight } from 'lucide-react'

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
      
      {/* Primary Completion Metric */}
      <Link href="/dashboard/pending" className="md:col-span-2 lg:col-span-2 group">
        <div className="bg-white rounded-2xl border border-gray-200/60 p-6 lg:p-8 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 group">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 lg:mb-6">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-base lg:text-lg font-bold text-gray-900 group-hover:text-primary transition-colors mb-2">
                {t.dashboard.completionStatus}
              </h2>
              <p className="text-sm text-gray-600 hidden sm:block">{t.dashboard.clickToManagePending}</p>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-3xl lg:text-4xl font-bold text-primary mb-1">{completionPercentage}%</div>
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
          <div className="grid grid-cols-3 gap-1 sm:gap-4">
            <div className="text-center p-1.5 sm:p-2 lg:p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="text-lg lg:text-xl font-bold text-green-600 mb-0.5">{completionStats.completed}</div>
              <div className="text-xs font-semibold text-green-700 uppercase tracking-tighter leading-tight hyphens-auto break-words px-0.5">{t.dashboard.completed}</div>
            </div>
            <div className="text-center p-1.5 sm:p-2 lg:p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-lg lg:text-xl font-bold text-blue-600 mb-0.5">{completionStats.inProgress}</div>
              <div className="text-xs font-semibold text-blue-700 uppercase tracking-tighter leading-tight hyphens-auto break-words px-0.5">{t.dashboard.inProgressStatus}</div>
            </div>
            <div className="text-center p-1.5 sm:p-2 lg:p-3 bg-orange-50 rounded-lg border border-orange-100">
              <div className="text-lg lg:text-xl font-bold text-orange-600 mb-0.5">{completionStats.pending}</div>
              <div className="text-xs font-semibold text-orange-700 uppercase tracking-tighter leading-tight hyphens-auto break-words px-0.5">{t.dashboard.remaining}</div>
            </div>
          </div>
        </div>
      </Link>

      {/* Quick Stats Cards */}
      <div className="md:col-span-2 lg:col-span-1 grid grid-cols-2 md:grid-cols-1 gap-4 lg:space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200/60 p-4 lg:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h3 className="text-xs lg:text-sm font-semibold text-gray-900 uppercase tracking-wide">{t.dashboard.totalEmployeesHeader}</h3>
            <Users className="w-4 lg:w-5 h-4 lg:h-5 text-gray-400" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-gray-900">{completionStats.total}</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/60 p-4 lg:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h3 className="text-xs lg:text-sm font-semibold text-gray-900 uppercase tracking-wide">{t.dashboard.avgRatingHeader}</h3>
            <Star className="w-4 lg:w-5 h-4 lg:h-5 text-gray-400" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
        </div>
      </div>

      {/* Performance Distribution */}
      <button 
        onClick={() => router.push('/dashboard/ratings')}
        className="md:col-span-2 lg:col-span-1 bg-white rounded-2xl border border-gray-200/60 p-4 lg:p-6 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 text-left min-h-[44px]"
      >
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <h3 className="text-base lg:text-lg font-bold text-gray-900">{t.dashboard.generalResults}</h3>
          <ChevronRight className="w-5 h-5 text-gray-400 hover:text-primary transition-colors" />
        </div>
        
        <div className="space-y-2 lg:space-y-3">
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
              <div key={key} className={`flex items-center justify-between p-2 lg:p-3 rounded-lg border ${bgClass} ${borderClass}`}>
                <div className="flex items-center flex-1 min-w-0">
                  <div className={`w-3 h-3 rounded-full mr-2 lg:mr-3 flex-shrink-0 ${dotClass}`}></div>
                  <span className={`text-xs lg:text-sm font-semibold ${textClass} truncate`}>{label}</span>
                </div>
                <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
                  <span className={`text-sm lg:text-base font-bold ${countClass}`}>{count}</span>
                  <div className={`w-12 lg:w-16 rounded-full h-2 ${barBgClass}`}>
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