'use client'

import { useState } from 'react'

interface ExportButtonProps {
  evaluationId?: string
  companyId?: string
  periodType?: string
  periodDate?: string
  format: 'pdf' | 'excel'
  children?: React.ReactNode
  className?: string
}

export default function ExportButton({
  evaluationId,
  companyId,
  periodType,
  periodDate,
  format,
  children,
  className = "px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (isExporting) return

    setIsExporting(true)
    try {
      let url = ''
      
      if (evaluationId) {
        url = `/api/export/evaluation/${evaluationId}?format=${format}`
      } else if (companyId) {
        url = `/api/export/company/${companyId}?format=${format}`
        if (periodType) url += `&periodType=${periodType}`
        if (periodDate) url += `&periodDate=${periodDate}`
      } else {
        throw new Error('Either evaluationId or companyId is required')
      }

      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Export failed')
      }

      // Create blob and download
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      
      // Get filename from response headers or create default
      const contentDisposition = response.headers.get('content-disposition')
      let filename = `export.${format === 'excel' ? 'xlsx' : 'pdf'}`
      
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename="(.+)"/)
        if (matches) {
          filename = matches[1]
        }
      }
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
    } catch (error) {
      console.error('Export error:', error)
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={className}
    >
      {isExporting ? (
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Exporting...
        </div>
      ) : (
        children || `Export ${format.toUpperCase()}`
      )}
    </button>
  )
}