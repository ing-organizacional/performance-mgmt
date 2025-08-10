'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Settings, ArrowLeft, Play } from 'lucide-react'
import type { UpsertOptions } from '@/lib/actions/csv-import'

interface CSVConfigurationStepProps {
  upsertOptions: UpsertOptions
  onOptionsChange: (options: UpsertOptions) => void
  onExecute: () => void
  onBack: () => void
  isLoading: boolean
}

const fieldOptions = [
  { id: 'name', label: 'Name', required: true },
  { id: 'email', label: 'Email' },
  { id: 'username', label: 'Username' },
  { id: 'role', label: 'Role', required: true },
  { id: 'department', label: 'Department' },
  { id: 'userType', label: 'User Type' },
  { id: 'employeeId', label: 'Employee ID' },
  { id: 'position', label: 'Position' },
  { id: 'shift', label: 'Shift' },
  { id: 'password', label: 'Password' }
]

export function CSVConfigurationStep({ 
  upsertOptions, 
  onOptionsChange, 
  onExecute, 
  onBack, 
  isLoading 
}: CSVConfigurationStepProps) {
  
  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    const currentFields = upsertOptions.selectedFields || []
    const newFields = checked
      ? [...currentFields, fieldId]
      : currentFields.filter(f => f !== fieldId)
    
    onOptionsChange({
      ...upsertOptions,
      selectedFields: newFields
    })
  }

  const handleOptionChange = (key: keyof UpsertOptions, value: boolean) => {
    onOptionsChange({
      ...upsertOptions,
      [key]: value
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
          <Settings className="h-4 w-4" />
          Step 3: Configure Import Options
        </CardTitle>
        <CardDescription className="text-gray-600 text-sm">
          Choose which fields to import and configure import behavior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Import Actions */}
        <div>
          <h4 className="font-medium mb-2 text-gray-900 text-sm">Import Actions</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="createNew"
                checked={upsertOptions.createNew}
                onCheckedChange={(checked) => handleOptionChange('createNew', Boolean(checked))}
              />
              <div>
                <label htmlFor="createNew" className="text-sm font-medium">
                  Create new users
                </label>
                <div className="text-xs text-gray-600">
                  Import users that don&apos;t exist
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateExisting"
                checked={upsertOptions.updateExisting}
                onCheckedChange={(checked) => handleOptionChange('updateExisting', Boolean(checked))}
              />
              <div>
                <label htmlFor="updateExisting" className="text-sm font-medium">
                  Update existing users
                </label>
                <div className="text-xs text-gray-600">
                  Update existing users
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Field Selection */}
        <div>
          <h4 className="font-medium mb-3 text-gray-900">Fields to Import/Update</h4>
          <div className="grid grid-cols-2 gap-3">
            {fieldOptions.map((field) => {
              const isSelected = (upsertOptions.selectedFields || []).includes(field.id)
              return (
                <div key={field.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.id}
                    checked={isSelected}
                    onCheckedChange={(checked) => handleFieldToggle(field.id, Boolean(checked))}
                    disabled={field.required}
                  />
                  <label htmlFor={field.id} className="text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            * Required fields are always imported
          </p>
        </div>

        <Separator />

        {/* Error Handling Options */}
        <div>
          <h4 className="font-medium mb-3 text-gray-900">Error Handling</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="skipOnError"
                checked={upsertOptions.skipOnError || false}
                onCheckedChange={(checked) => handleOptionChange('skipOnError', Boolean(checked))}
              />
              <label htmlFor="skipOnError" className="text-sm font-medium">
                Skip rows with errors
              </label>
              <span className="text-xs text-gray-600 ml-2">
                Continue import even if some rows fail
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="continueOnValidationError"
                checked={upsertOptions.continueOnValidationError || false}
                onCheckedChange={(checked) => handleOptionChange('continueOnValidationError', Boolean(checked))}
              />
              <label htmlFor="continueOnValidationError" className="text-sm font-medium">
                Continue on validation errors
              </label>
              <span className="text-xs text-gray-600 ml-2">
                Process valid rows even if some have validation issues
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoFixPasswords"
                checked={upsertOptions.autoFixPasswords || false}
                onCheckedChange={(checked) => handleOptionChange('autoFixPasswords', Boolean(checked))}
              />
              <label htmlFor="autoFixPasswords" className="text-sm font-medium">
                Auto-fix weak passwords
              </label>
              <span className="text-xs text-gray-600 ml-2">
                Automatically strengthen passwords that don&apos;t meet requirements
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Performance Options */}
        <div>
          <h4 className="font-medium mb-3 text-gray-900">Performance Options</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useBatching"
                checked={upsertOptions.useBatching || false}
                onCheckedChange={(checked) => handleOptionChange('useBatching', Boolean(checked))}
              />
              <label htmlFor="useBatching" className="text-sm font-medium">
                Enable batch processing
              </label>
              <span className="text-xs text-gray-600 ml-2">
                Process large imports in batches for better performance
              </span>
            </div>
          </div>
          
          {upsertOptions.useBatching && (
            <div className="ml-6 mt-2">
              <label className="text-sm text-gray-700">
                Batch size: {upsertOptions.batchSize || 200} users per batch
              </label>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h4 className="font-medium mb-2">Import Summary</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <div>• Actions: {upsertOptions.createNew ? 'Create new' : ''} {upsertOptions.createNew && upsertOptions.updateExisting ? '& ' : ''}{upsertOptions.updateExisting ? 'Update existing' : ''}</div>
            <div>• Fields: {(upsertOptions.selectedFields || []).length} selected</div>
            <div>• Error handling: {upsertOptions.skipOnError ? 'Skip errors' : 'Stop on errors'}</div>
            <div>• Performance: {upsertOptions.useBatching ? `Batch processing (${upsertOptions.batchSize || 200})` : 'Standard processing'}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Preview
          </Button>
          <Button 
            onClick={onExecute}
            disabled={isLoading || (!upsertOptions.createNew && !upsertOptions.updateExisting)}
            className="flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-600"
          >
            <Play className="h-4 w-4" />
            {isLoading ? 'Importing...' : 'Execute Import'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}