'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Settings, ArrowLeft, Play } from 'lucide-react'
import type { UpsertOptions } from '@/lib/actions/csv-import'
import type { Translations } from '@/lib/i18n'

interface CSVConfigurationStepProps {
  upsertOptions: UpsertOptions
  onOptionsChange: (options: UpsertOptions) => void
  onExecute: () => void
  onBack: () => void
  isLoading: boolean
  t: Translations
}

export function CSVConfigurationStep({ 
  upsertOptions, 
  onOptionsChange, 
  onExecute, 
  onBack, 
  isLoading,
  t
}: CSVConfigurationStepProps) {
  
  const fieldOptions = [
    { id: 'name', label: t.users.name, required: true },
    { id: 'email', label: t.users.email },
    { id: 'username', label: t.users.username },
    { id: 'role', label: t.users.role, required: true },
    { id: 'department', label: t.users.department },
    { id: 'userType', label: t.users.userType },
    { id: 'employeeId', label: t.users.employeeId },
    { id: 'position', label: t.users.position },
    { id: 'shift', label: t.users.shift },
    { id: 'password', label: t.users.password }
  ]
  
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
          {t.users.step} 3: {t.users.configureImportOptions}
        </CardTitle>
        <CardDescription className="text-gray-600 text-sm">
          {t.users.chooseFieldsAndBehavior}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Import Actions */}
        <div>
          <h4 className="font-medium mb-2 text-gray-900 text-sm">{t.users.importActions}</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="createNew"
                checked={upsertOptions.createNew}
                onCheckedChange={(checked) => handleOptionChange('createNew', Boolean(checked))}
              />
              <div>
                <label htmlFor="createNew" className="text-sm font-medium">
                  {t.users.createNewUsers}
                </label>
                <div className="text-xs text-gray-600">
                  {t.users.importUsersDontExist}
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
                  {t.users.updateExistingUsers}
                </label>
                <div className="text-xs text-gray-600">
                  {t.users.updateExistingUsersDesc}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Field Selection */}
        <div>
          <h4 className="font-medium mb-3 text-gray-900">{t.users.fieldsToImportUpdate}</h4>
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
            {t.users.requiredFieldsAlwaysImported}
          </p>
        </div>

        <Separator />

        {/* Error Handling Options */}
        <div>
          <h4 className="font-medium mb-3 text-gray-900">{t.users.errorHandling}</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="skipOnError"
                checked={upsertOptions.skipOnError || false}
                onCheckedChange={(checked) => handleOptionChange('skipOnError', Boolean(checked))}
              />
              <label htmlFor="skipOnError" className="text-sm font-medium">
                {t.users.skipRowsWithErrors}
              </label>
              <span className="text-xs text-gray-600 ml-2">
                {t.users.continueImportEvenFail}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="continueOnValidationError"
                checked={upsertOptions.continueOnValidationError || false}
                onCheckedChange={(checked) => handleOptionChange('continueOnValidationError', Boolean(checked))}
              />
              <label htmlFor="continueOnValidationError" className="text-sm font-medium">
                {t.users.continueOnValidationErrors}
              </label>
              <span className="text-xs text-gray-600 ml-2">
                {t.users.processValidRowsEvenIssues}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoFixPasswords"
                checked={upsertOptions.autoFixPasswords || false}
                onCheckedChange={(checked) => handleOptionChange('autoFixPasswords', Boolean(checked))}
              />
              <label htmlFor="autoFixPasswords" className="text-sm font-medium">
                {t.users.autoFixWeakPasswords}
              </label>
              <span className="text-xs text-gray-600 ml-2">
                {t.users.autoStrengthenPasswords}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Performance Options */}
        <div>
          <h4 className="font-medium mb-3 text-gray-900">{t.users.performanceOptions}</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useBatching"
                checked={upsertOptions.useBatching || false}
                onCheckedChange={(checked) => handleOptionChange('useBatching', Boolean(checked))}
              />
              <label htmlFor="useBatching" className="text-sm font-medium">
                {t.users.enableBatchProcessing}
              </label>
              <span className="text-xs text-gray-600 ml-2">
                {t.users.processLargeImportsBatches}
              </span>
            </div>
          </div>
          
          {upsertOptions.useBatching && (
            <div className="ml-6 mt-2">
              <label className="text-sm text-gray-700">
                {t.users.batchSizeUsers.replace('{size}', String(upsertOptions.batchSize || 200))}
              </label>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h4 className="font-medium mb-2">{t.users.importSummary}</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <div>{t.users.actionsLabel} {upsertOptions.createNew ? t.users.createNew : ''} {upsertOptions.createNew && upsertOptions.updateExisting ? '& ' : ''}{upsertOptions.updateExisting ? t.users.updateExisting : ''}</div>
            <div>{t.users.fieldsSelected.replace('{count}', String((upsertOptions.selectedFields || []).length))}</div>
            <div>{t.users.errorHandlingLabel} {upsertOptions.skipOnError ? t.users.skipErrors : t.users.stopOnErrors}</div>
            <div>{t.users.performanceLabel} {upsertOptions.useBatching ? t.users.batchProcessing.replace('{size}', String(upsertOptions.batchSize || 200)) : t.users.standardProcessing}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.users.backToPreview}
          </Button>
          <Button 
            onClick={onExecute}
            disabled={isLoading || (!upsertOptions.createNew && !upsertOptions.updateExisting)}
            className="flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-600"
          >
            <Play className="h-4 w-4" />
            {isLoading ? t.users.importing : t.users.executeImport}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}