/**
 * CSV Import Workflow Component
 * 
 * Comprehensive CSV import workflow for bulk user management with multi-step validation,
 * preview, configuration, and execution. Provides enterprise-grade import capabilities
 * with error handling, rollback functionality, and detailed audit trails.
 * 
 * Key Features:
 * - Multi-step import workflow (upload, preview, configure, execute)
 * - Real-time CSV validation with detailed error reporting
 * - Flexible upsert configuration for create/update operations
 * - Import history tracking with rollback capabilities
 * - Progress tracking with visual step indicators
 * - Modular component architecture for maintainability
 * - Internationalization support for global deployment
 * 
 * Workflow Steps:
 * 1. Upload: File selection and initial validation
 * 2. Preview: Data parsing and validation with error display
 * 3. Configure: Upsert options and field selection
 * 4. Execute: Import execution with progress tracking
 * 5. Complete: Results summary and next actions
 * 
 * Data Management:
 * - CSV parsing with comprehensive field validation
 * - Duplicate detection and handling strategies
 * - Field mapping and transformation options
 * - Batch processing for large datasets
 * - Transaction safety with rollback support
 * 
 * Error Handling:
 * - Field-level validation with specific error messages
 * - Global error reporting for file-level issues
 * - Partial success handling for mixed results
 * - User-friendly error presentation with correction guidance
 * 
 * Security Features:
 * - File type and size validation
 * - Data sanitization and validation
 * - Role-based access control for import operations
 * - Audit logging for all import activities
 * 
 * User Experience:
 * - Progress visualization with step-by-step guidance
 * - Configurable import options with sensible defaults
 * - History view with detailed import summaries
 * - Rollback functionality for error recovery
 */

'use client'

import { useState, useRef, useCallback } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History } from 'lucide-react'
import { 
  previewCSVImport, 
  executeCSVImport, 
  getImportHistory,
  rollbackImport,
  type ImportPreviewResult,
  type ImportExecutionResult,
  type ImportHistoryEntry,
  type UpsertOptions 
} from '@/lib/actions/csv-import'

// Import modular components
import { CSVUploadStep } from './csv-import/CSVUploadStep'
import { CSVPreviewStep } from './csv-import/CSVPreviewStep'
import { CSVConfigurationStep } from './csv-import/CSVConfigurationStep'
import { CSVExecutionStep } from './csv-import/CSVExecutionStep'
import { CSVImportHistory } from './csv-import/CSVImportHistory'

interface CSVImportWorkflowProps {
  onImportComplete?: () => void
}

type ImportStep = 'upload' | 'preview' | 'configure' | 'execute' | 'complete'

export function CSVImportWorkflow({ onImportComplete }: CSVImportWorkflowProps) {
  const { t } = useLanguage()
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [originalFormData, setOriginalFormData] = useState<FormData | null>(null)
  const [previewResult, setPreviewResult] = useState<ImportPreviewResult | null>(null)
  const [executionResult, setExecutionResult] = useState<ImportExecutionResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [showHistory, setShowHistory] = useState(false)
  const [importHistory, setImportHistory] = useState<ImportHistoryEntry[]>([])
  
  // Configuration options
  const [upsertOptions, setUpsertOptions] = useState<UpsertOptions>({
    updateExisting: true,
    createNew: true,
    requireConfirmation: false,
    selectedFields: [
      'name', 'email', 'username', 'role', 'department', 
      'userType', 'employeeId', 'position', 'shift'
    ]
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError('')
      setPreviewResult(null)
      setExecutionResult(null)
      setCurrentStep('upload')
    }
  }

  const handlePreview = async () => {
    if (!file) return
    
    setIsLoading(true)
    setError('')
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const result = await previewCSVImport(formData)
      setPreviewResult(result)
      
      if (result.success) {
        setCurrentStep('preview')
      } else {
        setError(result.globalErrors.join(', ') || 'Preview failed')
      }
    } catch {
      setError('Failed to preview CSV file')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfigure = () => {
    setCurrentStep('configure')
  }

  const handleExecute = async () => {
    if (!file || !previewResult) return
    
    setIsLoading(true)
    setError('')
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      // Store original FormData for retry functionality
      setOriginalFormData(formData)
      
      const result = await executeCSVImport(formData, upsertOptions)
      setExecutionResult(result)
      
      if (result.success || result.partialSuccess) {
        setCurrentStep('complete')
        onImportComplete?.()
      } else {
        setError(result.message || 'Import execution failed')
      }
    } catch {
      setError('Failed to execute CSV import')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setCurrentStep('upload')
    setFile(null)
    setOriginalFormData(null)
    setPreviewResult(null)
    setExecutionResult(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const loadImportHistory = useCallback(async () => {
    try {
      const result = await getImportHistory()
      if (result.success) {
        setImportHistory(result.history)
        setShowHistory(true)
      }
    } catch {
      setError('Failed to load import history')
    }
  }, [])

  const handleRollback = async (auditLogId: string) => {
    if (!confirm('Are you sure you want to rollback this import? This action cannot be undone.')) {
      return
    }

    try {
      const result = await rollbackImport(auditLogId)
      if (result.success) {
        alert('Import rolled back successfully')
        loadImportHistory() // Refresh history
        onImportComplete?.() // Refresh user list
      } else {
        alert(result.error || 'Failed to rollback import')
      }
    } catch {
      alert('Failed to rollback import')
    }
  }

  const getStepNumber = (step: ImportStep) => {
    const steps = ['upload', 'preview', 'configure', 'execute', 'complete']
    return steps.indexOf(step) + 1
  }

  // Show history view
  if (showHistory) {
    return (
      <CSVImportHistory
        importHistory={importHistory}
        onBack={() => setShowHistory(false)}
        onRollback={handleRollback}
        onLoadHistory={loadImportHistory}
      />
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header with Progress and History Button */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <CardTitle className="text-gray-900 text-lg">{t.users.csvImportWorkflow}</CardTitle>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>{t.users.step} {getStepNumber(currentStep)} {t.common.of} 4</span>
                </div>
                {/* Progress Steps */}
                <div className="flex items-center gap-1">
                  {(['upload', 'preview', 'configure', 'complete'] as ImportStep[]).map((step, index) => (
                    <div key={step} className="flex items-center">
                      <Badge 
                        variant={
                          getStepNumber(currentStep) > index + 1 ? 'default' :
                          currentStep === step ? 'default' : 'secondary'
                        }
                        className="text-xs w-6 h-6 rounded-full flex items-center justify-center"
                      >
                        {index + 1}
                      </Badge>
                      {index < 3 && <div className="w-3 h-px bg-border mx-1" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={loadImportHistory}
              className="flex items-center gap-1 px-3 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90"
            >
              <History className="h-4 w-4" />
              {t.users.viewHistory}
            </button>
          </div>
        </CardHeader>
      </Card>

      {/* Step Content */}
      {currentStep === 'upload' && (
        <CSVUploadStep
          file={file}
          isLoading={isLoading}
          error={error}
          onFileSelect={handleFileSelect}
          onPreview={handlePreview}
          t={t}
        />
      )}

      {currentStep === 'preview' && previewResult && (
        <CSVPreviewStep
          previewResult={previewResult}
          onConfigure={handleConfigure}
          onBack={() => setCurrentStep('upload')}
          t={t}
        />
      )}

      {currentStep === 'configure' && (
        <CSVConfigurationStep
          upsertOptions={upsertOptions}
          onOptionsChange={setUpsertOptions}
          onExecute={handleExecute}
          onBack={() => setCurrentStep('preview')}
          isLoading={isLoading}
          t={t}
        />
      )}

      {currentStep === 'complete' && executionResult && (
        <CSVExecutionStep
          executionResult={executionResult}
          originalFormData={originalFormData}
          onReset={handleReset}
          onImportComplete={onImportComplete}
          t={t}
        />
      )}
    </div>
  )
}