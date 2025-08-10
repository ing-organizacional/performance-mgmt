'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useExport } from '@/hooks/useExport'
import EmployeeSelector from './EmployeeSelector'
import DepartmentSelector from './DepartmentSelector'

interface ExportOption {
  id: string
  label: string
  description: string
  icon: string
  type: 'individual' | 'department' | 'company' | 'template'
}

interface SelectedExport {
  optionId: string
  format: 'excel' | 'pdf'
}

interface PDFExportCenterProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
}

const getIcon = (iconName: string) => {
  const iconClasses = "w-5 h-5"
  switch (iconName) {
    case 'building':
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h1a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    case 'department':
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    case 'star':
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    case 'warning':
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    case 'users':
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    case 'target':
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'document':
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    default:
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
  }
}

// Get file format icons
const getFormatIcon = (format: 'excel' | 'pdf') => {
  const iconClasses = "w-4 h-4"
  if (format === 'excel') {
    return (
      <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 2v10H4V5h12zM8 7v1h1V7H8zm0 2v1h1V9H8zm0 2v1h1v-1H8zm2-4v1h1V7h-1zm0 2v1h1V9h-1zm0 2v1h1v-1h-1zm2-4v1h1V7h-1zm0 2v1h1V9h-1zm0 2v1h1v-1h-1z" />
      </svg>
    )
  } else {
    return (
      <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    )
  }
}

export default function PDFExportCenter({ isOpen, onClose, companyId }: PDFExportCenterProps) {
  const { t } = useLanguage()
  const { isExporting, exportError, exportCompany, exportTeam, exportSelected, exportTopPerformers, exportNeedsAttention, exportSelectedDepartments } = useExport()
  const [selectedExports, setSelectedExports] = useState<SelectedExport[]>([])
  const [bulkFormat, setBulkFormat] = useState<'excel' | 'pdf' | null>(null)
  const [showCustomSelection, setShowCustomSelection] = useState(false)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
  const [showDepartmentSelection, setShowDepartmentSelection] = useState(false)
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])

  if (!isOpen) return null

  const exportOptions: ExportOption[] = [
    {
      id: 'company-overview',
      label: t.dashboard.companyOverview || 'Company Overview',
      description: t.dashboard.allEmployeesAllDepartments || 'All employees across all departments',
      icon: 'building',
      type: 'company'
    },
    {
      id: 'department-summary',
      label: t.dashboard.departmentSummary || 'Department Summary',
      description: t.dashboard.departmentBreakdown || 'Performance breakdown by department',
      icon: 'department',
      type: 'department'
    },
    {
      id: 'top-performers',
      label: t.dashboard.topPerformers || 'Top Performers',
      description: t.dashboard.highestRatedEmployees || 'Employees with ratings 4-5',
      icon: 'star',
      type: 'template'
    },
    {
      id: 'needs-attention',
      label: t.dashboard.needsAttention || 'Needs Attention',
      description: t.dashboard.employeesNeedingSupport || 'Employees with ratings 1-2',
      icon: 'warning',
      type: 'template'
    },
    {
      id: 'manager-reports',
      label: t.dashboard.managerReports || 'Manager Reports',
      description: t.dashboard.reportsGroupedByManager || 'Performance reports grouped by manager',
      icon: 'document',
      type: 'template'
    },
    {
      id: 'custom-selection',
      label: t.dashboard.customSelection || 'Custom Selection',
      description: t.dashboard.selectSpecificEmployees || 'Choose specific employees or departments',
      icon: 'target',
      type: 'individual'
    }
  ]

  const handleExportAll = async () => {
    try {
      // Export all selected options using Server Actions
      for (const selectedExport of selectedExports) {
        const option = exportOptions.find(opt => opt.id === selectedExport.optionId)
        if (option) {
          switch (option.id) {
            case 'company-overview':
              // Company-wide overview export
              await exportCompany(selectedExport.format)
              break
            case 'department-summary':
              // Department summary export - use selected departments
              await exportSelectedDepartments(selectedDepartments, selectedExport.format)
              break
            case 'top-performers':
              // Top performers export (ratings 4-5)
              await exportTopPerformers(selectedExport.format)
              break
            case 'needs-attention':
              // Needs attention export (ratings 1-2)
              await exportNeedsAttention(selectedExport.format)
              break
            case 'manager-reports':
              // Manager reports export
              await exportTeam(selectedExport.format)
              break
            case 'custom-selection':
              // Use selected employees export
              await exportSelected(selectedEmployeeIds, selectedExport.format)
              break
          }
          
          // Small delay between exports to avoid overwhelming
          if (selectedExports.length > 1) {
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
    // Handle custom selection specially
    if (optionId === 'custom-selection') {
      setShowCustomSelection(!showCustomSelection)
      if (!showCustomSelection) {
        const format = bulkFormat || 'pdf'
        setSelectedExports(prev => {
          const existing = prev.find(exp => exp.optionId === optionId)
          return existing ? prev : [...prev, { optionId, format }]
        })
      } else {
        setSelectedExports(prev => prev.filter(exp => exp.optionId !== optionId))
        setSelectedEmployeeIds([])
      }
      return
    }

    // Handle department selection specially
    if (optionId === 'department-summary') {
      setShowDepartmentSelection(!showDepartmentSelection)
      if (!showDepartmentSelection) {
        const format = bulkFormat || 'pdf'
        setSelectedExports(prev => {
          const existing = prev.find(exp => exp.optionId === optionId)
          return existing ? prev : [...prev, { optionId, format }]
        })
      } else {
        setSelectedExports(prev => prev.filter(exp => exp.optionId !== optionId))
        setSelectedDepartments([])
      }
      return
    }

    setSelectedExports(prev => {
      const existingExport = prev.find(exp => exp.optionId === optionId)
      
      if (existingExport) {
        // Remove if exists
        return prev.filter(exp => exp.optionId !== optionId)
      } else {
        // Add with default format (or bulk format if set)
        const format = bulkFormat || 'pdf'
        return [...prev, { optionId, format }]
      }
    })
  }

  const toggleFormat = (optionId: string, format: 'excel' | 'pdf') => {
    setSelectedExports(prev => 
      prev.map(exp => 
        exp.optionId === optionId 
          ? { ...exp, format }
          : exp
      )
    )
  }

  const isSelected = (optionId: string) => {
    return selectedExports.some(exp => exp.optionId === optionId)
  }

  const getSelectedFormat = (optionId: string): 'excel' | 'pdf' => {
    const export_ = selectedExports.find(exp => exp.optionId === optionId)
    return export_?.format || 'pdf'
  }

  const handleBulkAction = (format: 'excel' | 'pdf') => {
    setBulkFormat(format)
    const allExports = exportOptions.map(option => ({ optionId: option.id, format }))
    setSelectedExports(allExports)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
        onClick={onClose}
        aria-hidden="true" 
      />
      
      {/* Modal Container - Mobile First */}
      <div className="relative min-h-screen flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="relative bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-3xl lg:max-w-4xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300">
          {/* Header - Fixed */}
          <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t.dashboard.exportCenter || 'Export Center'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {t.dashboard.selectReportsAndFormats || 'Choose reports and formats to export'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 active:scale-95 transition-all duration-150 touch-manipulation"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content - Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            
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

            {/* Quick Action Buttons */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-5 mb-6 border border-gray-200/50">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {t.dashboard.quickActions}
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleBulkAction('pdf')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 active:scale-95 transition-all duration-150 text-sm font-medium touch-manipulation min-h-[40px]"
                >
                  {getFormatIcon('pdf')}
                  {t.dashboard.exportAllPDF}
                </button>
                <button
                  onClick={() => handleBulkAction('excel')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 active:scale-95 transition-all duration-150 text-sm font-medium touch-manipulation min-h-[40px]"
                >
                  {getFormatIcon('excel')}
                  {t.dashboard.exportAllExcel}
                </button>
                <button
                  onClick={() => setSelectedExports([])}
                  className="px-4 py-2.5 text-gray-600 hover:bg-gray-200 active:scale-95 rounded-lg transition-all duration-150 text-sm font-medium touch-manipulation min-h-[40px]"
                >
                  {t.dashboard.clearAll}
                </button>
              </div>
            </div>

            {/* Report Options - Enhanced Grid */}
            <div className="grid gap-4">
              {exportOptions.map((option) => {
                const selected = isSelected(option.id)
                const selectedFormat = getSelectedFormat(option.id)
                const isCustomSelection = option.id === 'custom-selection'
                const isDepartmentSelection = option.id === 'department-summary'
                
                return (
                  <div key={option.id}>
                    <div
                      className={`rounded-lg border-2 p-4 transition-all duration-150 cursor-pointer touch-manipulation ${
                        selected
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]'
                      }`}
                      onClick={() => toggleOption(option.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleOption(option.id)}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex items-center gap-2">
                            {getIcon(option.icon)}
                            <div>
                              <h3 className="text-base font-semibold text-gray-900">{option.label}</h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {isCustomSelection && selectedEmployeeIds.length > 0 
                                  ? `${selectedEmployeeIds.length} ${t.dashboard.employeesSelected}`
                                  : isDepartmentSelection && selectedDepartments.length > 0
                                  ? `${selectedDepartments.length} ${t.dashboard.departmentsSelected}`
                                  : option.description
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Format Toggle - Only show when selected */}
                        {selected && (
                          <div 
                            className="flex items-center bg-white rounded-lg border border-gray-200 p-1 shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => toggleFormat(option.id, 'pdf')}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 touch-manipulation min-h-[36px] ${
                                selectedFormat === 'pdf'
                                  ? 'bg-red-100 text-red-700 shadow-sm'
                                  : 'text-gray-600 hover:bg-gray-100 active:scale-95'
                              }`}
                            >
                              {getFormatIcon('pdf')}
                              PDF
                            </button>
                            <button
                              onClick={() => toggleFormat(option.id, 'excel')}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 touch-manipulation min-h-[36px] ${
                                selectedFormat === 'excel'
                                  ? 'bg-green-100 text-green-700 shadow-sm'
                                  : 'text-gray-600 hover:bg-gray-100 active:scale-95'
                              }`}
                            >
                              {getFormatIcon('excel')}
                              XLS
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Custom Employee Selection - Show when custom selection is active */}
                    {isCustomSelection && showCustomSelection && (
                      <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">{t.dashboard.selectEmployeesToExport}</h4>
                        <EmployeeSelector 
                          onSelectionChange={setSelectedEmployeeIds}
                          companyId={companyId}
                        />
                      </div>
                    )}

                    {/* Department Selection - Show when department summary is active */}
                    {isDepartmentSelection && showDepartmentSelection && (
                      <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">{t.dashboard.selectDepartmentsToExport}</h4>
                        <DepartmentSelector 
                          onSelectionChange={setSelectedDepartments}
                          companyId={companyId}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer - Fixed */}
          <div className="flex-shrink-0 flex items-center justify-between p-6 border-t border-gray-200 bg-white">
            <div className="text-sm text-gray-600">
              {selectedExports.length > 0 ? (
                <>
                  <div className="font-medium text-gray-900">
                    {selectedExports.length} {selectedExports.length === 1 ? t.dashboard.reportSelected : t.dashboard.reportsSelectedPlural}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-4">
                    <span className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-md">
                      {getFormatIcon('excel')} 
                      <span className="font-medium">{selectedExports.filter(exp => exp.format === 'excel').length}</span>
                    </span>
                    <span className="flex items-center gap-1.5 px-2 py-1 bg-red-50 rounded-md">  
                      {getFormatIcon('pdf')} 
                      <span className="font-medium">{selectedExports.filter(exp => exp.format === 'pdf').length}</span>
                    </span>
                  </div>
                </>
              ) : (
                <span className="text-gray-500">{t.dashboard.selectReportsToExport}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:scale-95 transition-all duration-150 touch-manipulation min-h-[44px]"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleExportAll}
                disabled={selectedExports.length === 0 || isExporting || 
                  (showCustomSelection && selectedEmployeeIds.length === 0) ||
                  (showDepartmentSelection && selectedDepartments.length === 0)}
                className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-all duration-150 touch-manipulation min-h-[44px] ${
                  selectedExports.length === 0 || isExporting || 
                  (showCustomSelection && selectedEmployeeIds.length === 0) ||
                  (showDepartmentSelection && selectedDepartments.length === 0)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 active:scale-95 shadow-sm'
                }`}
              >
                {isExporting ? (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse"></div>
                    </div>
                    <span className="animate-pulse">{t.dashboard.exporting || 'Exporting...'}</span>
                  </div>
                ) : (
                  selectedExports.length === 0 
                    ? t.dashboard.selectReportsFirst
                    : showCustomSelection && selectedEmployeeIds.length === 0
                    ? t.dashboard.selectEmployeesFirst
                    : showDepartmentSelection && selectedDepartments.length === 0
                    ? t.dashboard.selectDepartmentsFirst
                    : selectedExports.length === 1 ? t.dashboard.exportFiles.replace('{count}', selectedExports.length.toString()) : t.dashboard.exportFilesPlural.replace('{count}', selectedExports.length.toString())
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}