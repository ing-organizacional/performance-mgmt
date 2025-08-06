'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useExport } from '@/hooks/useExport'

interface ExportOption {
  id: string
  label: string
  description: string
  icon: string
  type: 'individual' | 'department' | 'company' | 'template'
}

interface PDFExportCenterProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
}

export default function PDFExportCenter({ isOpen, onClose }: PDFExportCenterProps) {
  const { t } = useLanguage()
  const { isExporting, exportError, exportCompany, exportTeam } = useExport()
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

  if (!isOpen) return null

  const exportOptions: ExportOption[] = [
    {
      id: 'company-overview',
      label: t.dashboard.companyOverview || 'Company Overview',
      description: t.dashboard.allEmployeesAllDepartments || 'All employees across all departments',
      icon: '🏢',
      type: 'company'
    },
    {
      id: 'department-summary',
      label: t.dashboard.departmentSummary || 'Department Summary',
      description: t.dashboard.departmentBreakdown || 'Performance breakdown by department',
      icon: '🏬',
      type: 'department'
    },
    {
      id: 'top-performers',
      label: t.dashboard.topPerformers || 'Top Performers',
      description: t.dashboard.highestRatedEmployees || 'Employees with ratings 4-5',
      icon: '⭐',
      type: 'template'
    },
    {
      id: 'needs-attention',
      label: t.dashboard.needsAttention || 'Needs Attention',
      description: t.dashboard.employeesNeedingSupport || 'Employees with ratings 1-2',
      icon: '⚠️',
      type: 'template'
    },
    {
      id: 'manager-reports',
      label: t.dashboard.managerReports || 'Manager Reports',
      description: t.dashboard.reportsGroupedByManager || 'Performance reports grouped by manager',
      icon: '👥',
      type: 'template'
    },
    {
      id: 'custom-selection',
      label: t.dashboard.customSelection || 'Custom Selection',
      description: t.dashboard.selectSpecificEmployees || 'Choose specific employees or departments',
      icon: '🎯',
      type: 'individual'
    }
  ]

  const handleExportAll = async () => {
    try {
      // Export all selected options using Server Actions
      for (const optionId of selectedOptions) {
        const option = exportOptions.find(opt => opt.id === optionId)
        if (option) {
          switch (option.id) {
            case 'company-overview':
            case 'department-summary':
            case 'top-performers':
            case 'needs-attention':
            case 'custom-selection':
              // All of these use company-wide export
              await exportCompany('excel')
              break
            case 'manager-reports':
              // This uses team export which is role-aware
              await exportTeam('excel')
              break
          }
          
          // Small delay between exports to avoid overwhelming
          if (selectedOptions.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      }
    } finally {
      // Close modal after successful exports or errors
      if (!exportError) {
        onClose()
      }
    }
  }

  const toggleOption = (optionId: string) => {
    setSelectedOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t.dashboard.pdfExportCenter || 'PDF Export Center'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {t.dashboard.selectReportsToExport || 'Select the reports you want to export'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            
            {/* Export Error Display */}
            {exportError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-red-800">{t.dashboard.exportError}</h3>
                    <p className="text-sm text-red-600 mt-1">
                      {exportError === 'Evaluation not found or access denied' ? t.dashboard.evaluationNotFound :
                       exportError === 'Export failed' ? t.dashboard.exportFailed :
                       exportError === 'No evaluations found' ? t.dashboard.noEvaluationsFound :
                       exportError === 'Access denied - HR role required' ? t.dashboard.hrRoleRequired :
                       exportError === 'Access denied - Manager or HR role required' ? t.dashboard.managerOrHrRequired :
                       exportError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {exportOptions.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all duration-150 ${
                    selectedOptions.includes(option.id)
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedOptions.includes(option.id)}
                    onChange={() => toggleOption(option.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-1"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{option.icon}</span>
                      <h3 className="text-sm font-medium text-gray-900">{option.label}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        option.type === 'company' ? 'bg-purple-100 text-purple-700' :
                        option.type === 'department' ? 'bg-blue-100 text-blue-700' :
                        option.type === 'template' ? 'bg-green-100 text-green-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {option.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {selectedOptions.length} {t.dashboard.reportsSelected || 'reports selected'}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleExportAll}
                disabled={selectedOptions.length === 0 || isExporting}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  selectedOptions.length === 0 || isExporting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isExporting ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t.dashboard.exporting || 'Exporting...'}
                  </div>
                ) : (
                  t.dashboard.exportSelected || 'Export Selected'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}