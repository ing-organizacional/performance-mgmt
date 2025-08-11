'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  AlertCircle, 
  RotateCcw, 
  Download,
  Users,
  UserPlus,
  UserCheck,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import type { ImportExecutionResult, RetryImportResult } from '@/lib/actions/csv-import'
import { bulkApplyCommonFixes, retryFailedRows } from '@/lib/actions/csv-import'
import type { Translations } from '@/lib/i18n'

interface CSVExecutionStepProps {
  executionResult: ImportExecutionResult
  originalFormData?: FormData | null
  onReset: () => void
  onImportComplete?: () => void
  t: Translations
}

export function CSVExecutionStep({ 
  executionResult, 
  originalFormData,
  onReset, 
  onImportComplete,
  t
}: CSVExecutionStepProps) {
  const router = useRouter()
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryResult, setRetryResult] = useState<RetryImportResult | null>(null)
  const originalFormDataRef = useRef<FormData | null>(null)
  
  // Store original form data when component mounts
  if (originalFormData && !originalFormDataRef.current) {
    originalFormDataRef.current = originalFormData
  }

  const downloadErrorReport = () => {
    if (!executionResult.errors.length) return
    
    const errorReport = [
      t.users.importErrorReport,
      `${t.users.generated} ${new Date().toLocaleString()}`,
      '',
      t.users.summaryLabel,
      `${t.users.totalErrorsReport} ${executionResult.errors.length}`,
      `${t.users.createdUsersReport} ${executionResult.created}`,
      `${t.users.updatedUsersReport} ${executionResult.updated}`,
      `${t.users.failedUsersReport} ${executionResult.failed}`,
      '',
      t.users.errorsLabel,
      ...executionResult.errors.map((error, index) => `${index + 1}. ${error}`)
    ].join('\n')
    
    const blob = new Blob([errorReport], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `import-errors-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleRetryWithAutoFix = async () => {
    if (!originalFormDataRef.current || !executionResult.recoverableErrors?.length) return
    
    setIsRetrying(true)
    setRetryResult(null)
    
    try {
      // Apply auto-fixes to recoverable errors
      const commonFixes = await bulkApplyCommonFixes(executionResult.recoverableErrors)
      
      if (commonFixes.length === 0) {
        alert('No auto-fixes available for these errors')
        setIsRetrying(false)
        return
      }
      
      // Retry with the auto-fixes
      const result = await retryFailedRows(
        originalFormDataRef.current,
        executionResult.recoverableErrors,
        commonFixes
      )
      
      setRetryResult(result)
      
      if (result.success || result.partialSuccess) {
        onImportComplete?.()
      }
      
    } catch (error) {
      console.error('Error during retry:', error)
      alert(`${t.users.retryFailed}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${
          executionResult.success ? 'text-green-600' : 'text-red-600'
        }`}>
          {executionResult.success ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {executionResult.success ? t.users.importCompleted : t.users.importFailed}
        </CardTitle>
        <CardDescription className="text-gray-700">
          {executionResult.message}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Results Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <UserPlus className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{executionResult.created}</div>
            <div className="text-sm font-medium text-green-700">{t.users.usersCreated}</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <UserCheck className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{executionResult.updated}</div>
            <div className="text-sm font-medium text-blue-700">{t.users.usersUpdated}</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-600">{executionResult.failed}</div>
            <div className="text-sm font-medium text-red-700">{t.users.failed}</div>
          </div>
        </div>

        {/* Success Message */}
        {executionResult.success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{t.users.importCompletedSuccessfully}</strong> {t.users.usersWereCreated.replace('{created}', String(executionResult.created)).replace('{updated}', String(executionResult.updated))}
              {executionResult.failed > 0 && ` ${t.users.usersFailedToImport.replace('{failed}', String(executionResult.failed))}`}
            </AlertDescription>
          </Alert>
        )}

        {/* Partial Success Message */}
        {executionResult.partialSuccess && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{t.users.importPartiallyCompleted}</strong> {t.users.someUsersProcessed.replace('{failed}', String(executionResult.failed))}
            </AlertDescription>
          </Alert>
        )}

        {/* Failure Message */}
        {!executionResult.success && !executionResult.partialSuccess && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{t.users.importFailedMessage}</strong> {executionResult.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Errors Section */}
        {executionResult.errors.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-red-700">{t.users.importErrors} ({executionResult.errors.length})</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadErrorReport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {t.users.downloadErrorReport}
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {executionResult.errors.slice(0, 10).map((error, index) => (
                <div key={index} className="p-3 border rounded-lg bg-red-50 border-red-200">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              ))}
              {executionResult.errors.length > 10 && (
                <div className="text-sm text-gray-600 text-center py-2">
                  {t.users.andMoreErrors.replace('{count}', String(executionResult.errors.length - 10))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recoverable Errors */}
        {executionResult.recoverableErrors && executionResult.recoverableErrors.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-amber-700">{t.users.recoverableErrors} ({executionResult.recoverableErrors.length})</h4>
              {originalFormDataRef.current && (
                <Button
                  onClick={handleRetryWithAutoFix}
                  disabled={isRetrying}
                  size="sm"
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                  {isRetrying ? t.users.retryingErrors : t.users.applyAutoFixes}
                </Button>
              )}
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {executionResult.recoverableErrors.slice(0, 5).map((error, index) => (
                <div key={index} className="p-3 border rounded-lg bg-amber-50 border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{error.name}</div>
                      <div className="text-sm text-amber-700">{error.errorMessage}</div>
                      {error.suggestedFix && (
                        <div className="text-sm text-gray-600 mt-1">
                          {t.users.suggestedFix} {error.suggestedFix}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{error.errorType}</Badge>
                      {error.canRetry && originalFormDataRef.current && (
                        <Button
                          onClick={() => handleRetryWithAutoFix()}
                          disabled={isRetrying}
                          size="sm"
                          variant="default"
                          className="h-6 px-2 text-xs"
                        >
                          <RefreshCw className={`h-3 w-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
                          {isRetrying ? t.users.retryingErrors : t.users.retryThis}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {executionResult.recoverableErrors.length > 5 && (
                <div className="text-sm text-gray-600 text-center py-2">
                  {t.users.andMoreRecoverableErrors.replace('{count}', String(executionResult.recoverableErrors.length - 5))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Critical Errors */}
        {executionResult.criticalErrors && executionResult.criticalErrors.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 text-red-700">{t.users.criticalErrors} ({executionResult.criticalErrors.length})</h4>
            <div className="space-y-2">
              {executionResult.criticalErrors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{error.errorType}:</strong> {error.errorMessage}
                    {error.requiresAdminAction && (
                      <div className="mt-1 text-sm">
                        <Badge variant="destructive">{t.users.requiresAdminAction}</Badge>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Retry Results */}
        {retryResult && (
          <div>
            <h4 className={`font-medium mb-3 ${retryResult.success ? 'text-green-700' : 'text-amber-700'}`}>
              {retryResult.success ? t.users.retryComplete : t.users.retryFailed}
            </h4>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <Alert className={retryResult.success ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}>
                <CheckCircle className={`h-4 w-4 ${retryResult.success ? 'text-green-600' : 'text-amber-600'}`} />
                <AlertDescription>
                  <div className="space-y-1">
                    <div>
                      <strong>{t.users.retriedRows.replace('{count}', String(retryResult.retriedRows))}</strong>
                    </div>
                    {retryResult.created > 0 && (
                      <div>{t.users.usersWereCreated.replace('{created}', String(retryResult.created)).replace('{updated}', String(retryResult.updated))}</div>
                    )}
                    {retryResult.failed > 0 && (
                      <div className="text-amber-700">{t.users.stillFailed.replace('{count}', String(retryResult.failed))}</div>
                    )}
                    <div className={retryResult.failed === 0 ? 'text-green-700' : 'text-amber-700'}>
                      {retryResult.failed === 0 ? t.users.allErrorsFixed : t.users.someErrorsRemain}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={onReset} variant="outline" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            {t.users.importAnotherFile}
          </Button>
          {(executionResult.success || executionResult.partialSuccess) && (
            <Button 
              onClick={() => {
                router.push('/users')
              }}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              {t.users.viewUsers}
            </Button>
          )}
        </div>

        {/* Next Steps */}
        {executionResult.success && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">{t.users.nextSteps}</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>{t.users.reviewImportedUsers}</li>
              <li>{t.users.verifyManagerRelationships}</li>
              <li>{t.users.testLoginCredentials}</li>
              <li>{t.users.updateAdditionalSettings}</li>
            </ul>
          </div>
        )}

        {executionResult.partialSuccess && (
          <div className="bg-amber-50 p-4 rounded-lg">
            <h4 className="font-medium text-amber-800 mb-2">{t.users.partialSuccessActionRequired}</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>{t.users.reviewAndFixErrors}</li>
              <li>{t.users.reimportCorrectedFile}</li>
              <li>{t.users.checkImportedUsers}</li>
              <li>{t.users.considerErrorRecovery}</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}