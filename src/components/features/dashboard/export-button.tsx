'use client'

import { useExport } from '@/hooks/useExport'

interface ExportButtonProps {
  evaluationId?: string
  type?: 'evaluation' | 'team' | 'department' | 'company'
  department?: string
  format?: 'pdf' | 'excel'
  children?: React.ReactNode
  className?: string
}

export default function ExportButton({
  evaluationId,
  type = 'company',
  department,
  format = 'excel',
  children,
  className = "px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
}: ExportButtonProps) {
  const { isExporting, exportEvaluationById, exportTeam, exportDepartment, exportCompany } = useExport()

  const handleExport = async () => {
    if (isExporting) return

    try {
      switch (type) {
        case 'evaluation':
          if (!evaluationId) throw new Error('Evaluation ID is required for evaluation exports')
          await exportEvaluationById(evaluationId, format)
          break
        case 'team':
          await exportTeam(format)
          break
        case 'department':
          await exportDepartment(department, format)
          break
        case 'company':
        default:
          await exportCompany(format)
          break
      }
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`${className} ${isExporting ? 'bg-gray-400 cursor-not-allowed' : ''}`}
    >
      {isExporting ? (
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
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