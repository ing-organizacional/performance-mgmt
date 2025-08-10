'use client'

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
  AlertTriangle
} from 'lucide-react'
import type { ImportExecutionResult } from '@/lib/actions/csv-import'

interface CSVExecutionStepProps {
  executionResult: ImportExecutionResult
  onReset: () => void
  onImportComplete?: () => void
}

export function CSVExecutionStep({ 
  executionResult, 
  onReset, 
  onImportComplete 
}: CSVExecutionStepProps) {

  const downloadErrorReport = () => {
    if (!executionResult.errors.length) return
    
    const errorReport = [
      'Import Error Report',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'Summary:',
      `- Total errors: ${executionResult.errors.length}`,
      `- Created users: ${executionResult.created}`,
      `- Updated users: ${executionResult.updated}`,
      `- Failed users: ${executionResult.failed}`,
      '',
      'Errors:',
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
          {executionResult.success ? 'Import Completed' : 'Import Failed'}
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
            <div className="text-sm font-medium text-green-700">Users Created</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <UserCheck className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{executionResult.updated}</div>
            <div className="text-sm font-medium text-blue-700">Users Updated</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-600">{executionResult.failed}</div>
            <div className="text-sm font-medium text-red-700">Failed</div>
          </div>
        </div>

        {/* Success Message */}
        {executionResult.success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Import completed successfully!</strong> {executionResult.created} users were created and {executionResult.updated} users were updated.
              {executionResult.failed > 0 && ` ${executionResult.failed} users failed to import.`}
            </AlertDescription>
          </Alert>
        )}

        {/* Partial Success Message */}
        {executionResult.partialSuccess && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Import partially completed.</strong> Some users were processed successfully, but {executionResult.failed} users failed to import.
            </AlertDescription>
          </Alert>
        )}

        {/* Failure Message */}
        {!executionResult.success && !executionResult.partialSuccess && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Import failed!</strong> {executionResult.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Errors Section */}
        {executionResult.errors.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-red-700">Import Errors ({executionResult.errors.length})</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadErrorReport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Error Report
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
                  ... and {executionResult.errors.length - 10} more errors (download full report)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recoverable Errors */}
        {executionResult.recoverableErrors && executionResult.recoverableErrors.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 text-amber-700">Recoverable Errors ({executionResult.recoverableErrors.length})</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {executionResult.recoverableErrors.slice(0, 5).map((error, index) => (
                <div key={index} className="p-3 border rounded-lg bg-amber-50 border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{error.name}</div>
                      <div className="text-sm text-amber-700">{error.errorMessage}</div>
                      {error.suggestedFix && (
                        <div className="text-sm text-gray-600 mt-1">
                          Suggested fix: {error.suggestedFix}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{error.errorType}</Badge>
                      {error.canRetry && (
                        <Badge variant="default">Can Retry</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {executionResult.recoverableErrors.length > 5 && (
                <div className="text-sm text-gray-600 text-center py-2">
                  ... and {executionResult.recoverableErrors.length - 5} more recoverable errors
                </div>
              )}
            </div>
          </div>
        )}

        {/* Critical Errors */}
        {executionResult.criticalErrors && executionResult.criticalErrors.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 text-red-700">Critical Errors ({executionResult.criticalErrors.length})</h4>
            <div className="space-y-2">
              {executionResult.criticalErrors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{error.errorType}:</strong> {error.errorMessage}
                    {error.requiresAdminAction && (
                      <div className="mt-1 text-sm">
                        <Badge variant="destructive">Requires Admin Action</Badge>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={onReset} variant="outline" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Import Another File
          </Button>
          {(executionResult.success || executionResult.partialSuccess) && (
            <Button 
              onClick={() => {
                onImportComplete?.()
                // Could redirect to user management or dashboard
              }}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              View Users
            </Button>
          )}
        </div>

        {/* Next Steps */}
        {executionResult.success && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Next Steps</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Review imported users in the User Management section</li>
              <li>• Verify manager relationships are correctly established</li>
              <li>• Test login credentials for new users</li>
              <li>• Update any additional user settings as needed</li>
            </ul>
          </div>
        )}

        {executionResult.partialSuccess && (
          <div className="bg-amber-50 p-4 rounded-lg">
            <h4 className="font-medium text-amber-800 mb-2">Partial Success - Action Required</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Review and fix errors in the original CSV file</li>
              <li>• Re-import the corrected file with only failed users</li>
              <li>• Check imported users for data accuracy</li>
              <li>• Consider using error recovery features for fixable issues</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}