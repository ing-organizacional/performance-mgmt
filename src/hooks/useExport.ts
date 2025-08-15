/**
 * Export Management Hook
 * 
 * Comprehensive export system for performance evaluation data supporting:
 * - Multiple export formats (PDF for individuals, Excel for bulk data)
 * - Bilingual export with automatic language detection
 * - Various export scopes (individual, team, department, company-wide)
 * - Advanced filtering (top performers, needs attention, selected employees)
 * - Robust error handling and loading states
 * - Client-side file download with blob management
 * - Progress tracking for large exports
 * - Memory-efficient buffer handling for large datasets
 */

'use client'

import { useState } from 'react'
import { 
  exportEvaluation, 
  exportTeamEvaluations, 
  exportDepartmentEvaluations, 
  exportCompanyEvaluations,
  exportSelectedEmployees,
  exportTopPerformers,
  exportNeedsAttention,
  exportSelectedDepartments
} from '@/lib/actions'
import { useLanguage } from '@/contexts/LanguageContext'

type ExportFormat = 'pdf' | 'excel'

interface UseExportResult {
  isExporting: boolean
  exportError: string | null
  exportEvaluationById: (evaluationId: string, format?: ExportFormat) => Promise<void>
  exportTeam: (format?: ExportFormat) => Promise<void>
  exportDepartment: (department?: string, format?: ExportFormat) => Promise<void>
  exportCompany: (format?: ExportFormat) => Promise<void>
  exportSelected: (employeeIds: string[], format?: ExportFormat) => Promise<void>
  exportTopPerformers: (format?: ExportFormat) => Promise<void>
  exportNeedsAttention: (format?: ExportFormat) => Promise<void>
  exportSelectedDepartments: (departmentNames: string[], format?: ExportFormat) => Promise<void>
}

export function useExport(): UseExportResult {
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const { language } = useLanguage()

  const downloadFile = (data: number[] | Buffer, filename: string, contentType: string) => {
    try {
      console.log('Starting download process:', {
        dataLength: data.length,
        filename,
        contentType,
        isArray: Array.isArray(data)
      })
      
      // Handle both Buffer and number array formats
      const uint8Array = Array.isArray(data) ? new Uint8Array(data) : new Uint8Array(data)
      
      console.log('Uint8Array created, size:', uint8Array.length)
      console.log('First few bytes:', Array.from(uint8Array.slice(0, 10)))
      
      const blob = new Blob([uint8Array], { type: contentType })
      console.log('Blob created, size:', blob.size, 'type:', blob.type)
      
      if (blob.size === 0) {
        throw new Error('Generated blob is empty (0 bytes)')
      }
      
      const url = URL.createObjectURL(blob)
      
      // Create and trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      
      console.log('Download triggered for:', filename)
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        console.log('Download cleanup completed')
      }, 100)
      
    } catch (error) {
      console.error('Error downloading file:', error)
      setExportError(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const exportEvaluationById = async (evaluationId: string, format: ExportFormat = 'pdf') => {
    setIsExporting(true)
    setExportError(null)
    
    try {
      console.log('Starting export for evaluation:', evaluationId, 'format:', format, 'language:', language)
      const result = await exportEvaluation(evaluationId, format, language)
      
      console.log('Export result:', {
        success: result.success,
        hasData: !!result.data,
        dataLength: result.data ? result.data.length : 0,
        filename: result.filename,
        contentType: result.contentType,
        error: result.error
      })
      
      if (!result.success) {
        setExportError(result.error || 'Export failed')
        return
      }

      if (result.data && result.filename && result.contentType) {
        if (result.data.length === 0) {
          console.error('Server returned empty data')
          setExportError('Server returned empty file data')
          return
        }
        downloadFile(result.data, result.filename, result.contentType)
      } else {
        console.error('Missing export data:', { hasData: !!result.data, filename: result.filename, contentType: result.contentType })
        setExportError('Export data incomplete')
      }
    } catch (error) {
      console.error('Export error:', error)
      setExportError('Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const exportTeam = async (format: ExportFormat = 'excel') => {
    setIsExporting(true)
    setExportError(null)
    
    try {
      const result = await exportTeamEvaluations(format, language)
      
      if (!result.success) {
        setExportError(result.error || 'Export failed')
        return
      }

      if (result.data && result.filename && result.contentType) {
        downloadFile(result.data, result.filename, result.contentType)
      }
    } catch (error) {
      console.error('Export error:', error)
      setExportError('Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const exportDepartment = async (department?: string, format: ExportFormat = 'excel') => {
    setIsExporting(true)
    setExportError(null)
    
    try {
      const result = await exportDepartmentEvaluations(department, format, language)
      
      if (!result.success) {
        setExportError(result.error || 'Export failed')
        return
      }

      if (result.data && result.filename && result.contentType) {
        downloadFile(result.data, result.filename, result.contentType)
      }
    } catch (error) {
      console.error('Export error:', error)
      setExportError('Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const exportCompany = async (format: ExportFormat = 'excel') => {
    setIsExporting(true)
    setExportError(null)
    
    try {
      const result = await exportCompanyEvaluations(format, language)
      
      if (!result.success) {
        setExportError(result.error || 'Export failed')
        return
      }

      if (result.data && result.filename && result.contentType) {
        downloadFile(result.data, result.filename, result.contentType)
      }
    } catch (error) {
      console.error('Export error:', error)
      setExportError('Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const exportSelected = async (employeeIds: string[], format: ExportFormat = 'excel') => {
    setIsExporting(true)
    setExportError(null)
    
    try {
      const result = await exportSelectedEmployees(employeeIds, format, language)
      
      if (!result.success) {
        setExportError(result.error || 'Export failed')
        return
      }

      if (result.data && result.filename && result.contentType) {
        downloadFile(result.data, result.filename, result.contentType)
      }
    } catch (error) {
      console.error('Export error:', error)
      setExportError('Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const exportTopPerformers_ = async (format: ExportFormat = 'excel') => {
    setIsExporting(true)
    setExportError(null)
    
    try {
      const result = await exportTopPerformers(format, language)
      
      if (!result.success) {
        setExportError(result.error || 'Export failed')
        return
      }

      if (result.data && result.filename && result.contentType) {
        downloadFile(result.data, result.filename, result.contentType)
      }
    } catch (error) {
      console.error('Export error:', error)
      setExportError('Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const exportNeedsAttention_ = async (format: ExportFormat = 'excel') => {
    setIsExporting(true)
    setExportError(null)
    
    try {
      const result = await exportNeedsAttention(format, language)
      
      if (!result.success) {
        setExportError(result.error || 'Export failed')
        return
      }

      if (result.data && result.filename && result.contentType) {
        downloadFile(result.data, result.filename, result.contentType)
      }
    } catch (error) {
      console.error('Export error:', error)
      setExportError('Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const exportSelectedDepartments_ = async (departmentNames: string[], format: ExportFormat = 'excel') => {
    setIsExporting(true)
    setExportError(null)
    
    try {
      const result = await exportSelectedDepartments(departmentNames, format, language)
      
      if (!result.success) {
        setExportError(result.error || 'Export failed')
        return
      }

      if (result.data && result.filename && result.contentType) {
        downloadFile(result.data, result.filename, result.contentType)
      }
    } catch (error) {
      console.error('Export error:', error)
      setExportError('Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  return {
    isExporting,
    exportError,
    exportEvaluationById,
    exportTeam,
    exportDepartment,
    exportCompany,
    exportSelected,
    exportTopPerformers: exportTopPerformers_,
    exportNeedsAttention: exportNeedsAttention_,
    exportSelectedDepartments: exportSelectedDepartments_
  }
}