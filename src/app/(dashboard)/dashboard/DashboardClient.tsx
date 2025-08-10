'use client'

import { useState, useEffect } from 'react'
import { PDFExportCenter } from '@/components/features/dashboard'
import { useLanguage } from '@/contexts/LanguageContext'
import type { EvaluationCycle } from '@/types'
import {
  DashboardHeader,
  DashboardMetrics,
  CriticalActionsAlert,
  OverdueDraftsCard,
  PendingApprovalsCard,
  AdministrativeActionsPanel
} from './components'

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

interface PerformanceCycle {
  id: string
  name: string
  status: string
  startDate: string
  endDate: string
  createdBy: string
  closedBy?: string | null
  closedAt?: string | null
  _count: {
    evaluations: number
    evaluationItems: number
    partialAssessments: number
  }
}

interface OverdueDraft {
  id: string
  employeeName: string
  employeeDepartment: string | null
  managerName: string
  createdAt: string
  daysOverdue: number
}

interface PendingApproval {
  id: string
  employeeId: string
  employeeName: string
  employeeDepartment: string | null
  managerName: string
  submittedAt: string
  daysPending: number
}

interface DashboardClientProps {
  userRole: string
  companyId: string
  companyName: string
  completionStats: CompletionStats
  ratingDistribution: RatingDistribution
  activeCycle: EvaluationCycle | null
  allCycles: PerformanceCycle[]
  overdueDrafts: OverdueDraft[]
  pendingApprovals: PendingApproval[]
  overdueApprovalsCount: number
}

export default function DashboardClient({
  companyId,
  companyName,
  completionStats,
  ratingDistribution,
  activeCycle,
  allCycles,
  overdueDrafts,
  pendingApprovals,
  overdueApprovalsCount
}: DashboardClientProps) {
  const { t } = useLanguage()
  const [isExportCenterOpen, setIsExportCenterOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState<string>('')

  // Update time only on client-side to prevent hydration mismatch
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(`${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`)
    }
    
    updateTime() // Set initial time
    const interval = setInterval(updateTime, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Dashboard Header */}
      <DashboardHeader 
        companyName={companyName}
        activeCycle={activeCycle}
        allCycles={allCycles}
      />

      {/* Main Dashboard Content */}
      <main className="max-w-8xl mx-auto px-6 lg:px-8 py-8">
        
        {/* Key Metrics Section */}
        <DashboardMetrics 
          completionStats={completionStats}
          ratingDistribution={ratingDistribution}
        />

        {/* Critical Actions and Status Updates */}
        <div className="space-y-6 mb-8">
          
          {/* Critical Actions Alert */}
          <CriticalActionsAlert completionStats={completionStats} />

          {/* Overdue Drafts and Pending Approvals Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OverdueDraftsCard overdueDrafts={overdueDrafts} />
            <PendingApprovalsCard 
              pendingApprovals={pendingApprovals}
              overdueApprovalsCount={overdueApprovalsCount}
            />
          </div>
        </div>

        {/* Administrative Actions Panel */}
        <AdministrativeActionsPanel 
          onExportCenterOpen={() => setIsExportCenterOpen(true)}
        />
      </main>

      {/* Enhanced Footer */}
      <footer className="border-t border-gray-200/50 bg-white/80 backdrop-blur-lg mt-12">
        <div className="max-w-8xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{t.dashboard.lastUpdated}: </span>
              {currentTime || 'Loading...'}
            </div>
            <div className="text-xs text-gray-500">
              © 2025 - <a 
                href="https://www.ing-organizacional.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-gray-700 transition-colors font-medium"
              >
                Ingeniería Organizacional
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* PDF Export Center Modal */}
      <PDFExportCenter 
        isOpen={isExportCenterOpen}
        onClose={() => setIsExportCenterOpen(false)}
        companyId={companyId}
      />
    </div>
  )
}