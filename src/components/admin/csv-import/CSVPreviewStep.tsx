'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Eye, 
  Settings, 
  AlertCircle, 
  CheckCircle, 
  Users, 
  UserPlus, 
  UserCheck 
} from 'lucide-react'
import type { ImportPreviewResult } from '@/lib/actions/csv-import'

interface CSVPreviewStepProps {
  previewResult: ImportPreviewResult
  onConfigure: () => void
  onBack: () => void
}

export function CSVPreviewStep({ previewResult, onConfigure, onBack }: CSVPreviewStepProps) {
  if (!previewResult.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Import Preview Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              {previewResult.globalErrors.join(', ')}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button variant="outline" onClick={onBack}>
              Back to Upload
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const validUsersForDisplay = previewResult.users.filter(user => user.validationErrors.length === 0).slice(0, 5)
  const invalidUsersForDisplay = previewResult.users.filter(user => user.validationErrors.length > 0).slice(0, 5)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
          <Eye className="h-4 w-4" />
          Step 2: Preview Results
        </CardTitle>
        <CardDescription className="text-gray-600 text-sm">
          Review the analysis of your CSV file before importing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Statistics */}
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded">
            <Users className="h-4 w-4 text-blue-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-blue-600">{previewResult.totalRows}</div>
            <div className="text-xs font-medium text-blue-700">Total</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded">
            <CheckCircle className="h-4 w-4 text-green-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-green-600">{previewResult.validRows}</div>
            <div className="text-xs font-medium text-green-700">Valid</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded">
            <UserPlus className="h-4 w-4 text-blue-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-blue-600">{previewResult.createCount}</div>
            <div className="text-xs font-medium text-blue-700">New</div>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded">
            <UserCheck className="h-4 w-4 text-amber-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-amber-600">{previewResult.updateCount}</div>
            <div className="text-xs font-medium text-amber-700">Updates</div>
          </div>
        </div>

        {/* Error Summary */}
        {previewResult.invalidRows > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{previewResult.invalidRows} rows have validation errors</strong> and will be skipped unless auto-fixed during import.
            </AlertDescription>
          </Alert>
        )}

        {/* Valid Users Preview */}
        {validUsersForDisplay.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 text-green-800 text-sm">Valid Users (Preview)</h4>
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {validUsersForDisplay.map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{user.name}</div>
                      <div className="text-gray-600 truncate">
                        {user.email || user.username} • {user.role} • {user.department || 'No dept'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Badge variant={user.action === 'create' ? 'default' : 'secondary'} className="text-xs px-1">
                        {user.action === 'create' ? 'New' : 'Upd'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              {previewResult.validRows > 5 && (
                <div className="text-xs text-gray-600 text-center pt-2 border-t border-green-300 mt-2">
                  ... and {previewResult.validRows - 5} more valid users
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invalid Users Preview */}
        {invalidUsersForDisplay.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 text-red-800 text-sm">Users with Errors (Preview)</h4>
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <div className="space-y-2">
                {invalidUsersForDisplay.map((user, index) => (
                  <div key={index} className="flex items-start justify-between p-2 bg-white rounded text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-red-600 text-xs mt-1">
                        {user.validationErrors.slice(0, 2).join(', ')}
                        {user.validationErrors.length > 2 && ' ...'}
                      </div>
                    </div>
                    <Badge variant="destructive" className="text-xs px-1 ml-2">Error</Badge>
                  </div>
                ))}
                {previewResult.invalidRows > 5 && (
                  <div className="text-xs text-gray-600 text-center pt-2 border-t border-red-300 mt-2">
                    ... and {previewResult.invalidRows - 5} more users with errors
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <button onClick={onBack} className="px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700">
            Back
          </button>
          <button 
            onClick={onConfigure}
            disabled={previewResult.validRows === 0}
            className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-600"
          >
            <Settings className="h-3 w-3" />
            Configure Import
          </button>
        </div>
      </CardContent>
    </Card>
  )
}