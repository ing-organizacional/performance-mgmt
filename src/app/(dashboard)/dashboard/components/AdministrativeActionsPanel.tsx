'use client'

import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { Settings, Clipboard, FolderDown, ChevronRight, Users, RefreshCw, FileText, Clock, Star, Archive } from 'lucide-react'

interface AdministrativeActionsPanelProps {
  onExportCenterOpen: () => void
}

export function AdministrativeActionsPanel({ onExportCenterOpen }: AdministrativeActionsPanelProps) {
  const router = useRouter()
  const { t } = useLanguage()

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 p-8 shadow-sm mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center">
        <Settings className="w-6 h-6 text-indigo-500 mr-3" />
        {t.dashboard.administrativeActions}
      </h2>
      
      {/* Primary Actions - Featured */}
      <div className="mb-8">
        <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          {t.dashboard.primaryManagement}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={() => router.push('/dashboard/company-items')}
            className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mr-4">
                <Clipboard className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="text-lg font-semibold text-gray-900">{t.dashboard.companyAssignments}</div>
                <div className="text-sm text-gray-600">{t.dashboard.manageCompanyOkrsCompetencies}</div>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-blue-600 group-hover:text-blue-700 transition-colors" />
          </button>

          <button 
            onClick={onExportCenterOpen}
            className="flex items-center justify-between p-6 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl hover:from-emerald-100 hover:to-green-100 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mr-4">
                <FolderDown className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="text-lg font-semibold text-gray-900">{t.dashboard.pdfExportCenter}</div>
                <div className="text-sm text-gray-600">{t.dashboard.generateReportsAnalysis}</div>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
          </button>
        </div>
      </div>

      {/* Secondary & Tertiary Actions - Compact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* System Administration */}
        <div>
          <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {t.dashboard.systemAdministration}
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/users')}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <span className="font-medium text-gray-700">{t.dashboard.manageUsers}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </button>

            <button 
              onClick={() => router.push('/users/archive')}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <Archive className="w-5 h-5 text-orange-600" />
                </div>
                <span className="font-medium text-gray-700">{t.dashboard.archivedEmployees}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </button>

            <button 
              onClick={() => router.push('/admin/cycles')}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-gray-700">{t.dashboard.cycles}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </button>
          </div>
        </div>

        {/* Monitoring & Analysis */}
        <div>
          <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {t.dashboard.monitoringAnalysis}
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/dashboard/audit')}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="font-medium text-gray-700">{t.dashboard.auditLogs}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </button>

            <button 
              onClick={() => router.push('/dashboard/deadlines')}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <span className="font-medium text-gray-700">{t.dashboard.deadlines}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </button>

            <button 
              onClick={() => router.push('/dashboard/ratings')}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                  <Star className="w-5 h-5 text-yellow-600" />
                </div>
                <span className="font-medium text-gray-700">{t.dashboard.departmentRatings}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}