/**
 * Scheduled Import Form Component
 * 
 * Form component for creating and editing scheduled import configurations
 * with comprehensive schedule, source, and notification settings.
 */

import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Calendar, Globe, Key, Mail } from 'lucide-react'
import type { ScheduledImportFormProps } from '../types'

export function ScheduledImportForm({
  isEditing,
  config,
  onConfigChange,
  onSubmit,
  onCancel,
  isLoading
}: ScheduledImportFormProps) {
  const { t } = useLanguage()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900">
          {isEditing ? (t.users.editScheduledImport || 'Edit Scheduled Import') : (t.users.createNewScheduledImport || 'Create New Scheduled Import')}
        </CardTitle>
        <CardDescription className="text-gray-700">
          {t.users.configureAutomatedImports || 'Configure automated imports from external data sources'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Information */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-900 mb-1">{t.users.importName || 'Import Name'} *</label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => onConfigChange({ ...config, name: e.target.value })}
              placeholder="Daily HRIS Sync"
              className="w-full px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-900 mb-1">{t.users.description || 'Description'}</label>
            <input
              type="text"
              value={config.description}
              onChange={(e) => onConfigChange({ ...config, description: e.target.value })}
              placeholder="Optional description"
              className="w-full px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <Separator />

        {/* Schedule Configuration */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2 text-gray-900 text-sm">
            <Calendar className="h-4 w-4" />
            {t.users.schedule || 'Schedule'}
          </h4>
          <div className="grid grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-900 mb-1">{t.users.frequency || 'Frequency'} *</label>
              <select
                value={config.schedule?.frequency}
                onChange={(e) => onConfigChange({
                  ...config,
                  schedule: { ...config.schedule!, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' }
                })}
                className="w-full px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-900 mb-1">{t.users.time || 'Time'} *</label>
              <input
                type="time"
                value={config.schedule?.time}
                onChange={(e) => onConfigChange({
                  ...config,
                  schedule: { ...config.schedule!, time: e.target.value }
                })}
                className="w-full px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-900 mb-1">{t.users.timezone || 'Timezone'} *</label>
              <select
                value={config.schedule?.timezone}
                onChange={(e) => onConfigChange({
                  ...config,
                  schedule: { ...config.schedule!, timezone: e.target.value }
                })}
                className="w-full px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <div>
              {/* Conditional frequency fields */}
              {config.schedule?.frequency === 'weekly' && (
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-1">Day</label>
                  <select
                    value={config.schedule?.dayOfWeek || 0}
                    onChange={(e) => onConfigChange({
                      ...config,
                      schedule: { ...config.schedule!, dayOfWeek: parseInt(e.target.value) }
                    })}
                    className="w-full px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={0}>Sun</option>
                    <option value={1}>Mon</option>
                    <option value={2}>Tue</option>
                    <option value={3}>Wed</option>
                    <option value={4}>Thu</option>
                    <option value={5}>Fri</option>
                    <option value={6}>Sat</option>
                  </select>
                </div>
              )}
              {config.schedule?.frequency === 'monthly' && (
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-1">Day</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={config.schedule?.dayOfMonth || 1}
                    onChange={(e) => onConfigChange({
                      ...config,
                      schedule: { ...config.schedule!, dayOfMonth: parseInt(e.target.value) }
                    })}
                    className="w-full px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Source Configuration */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2 text-gray-900 text-sm">
            <Globe className="h-4 w-4" />
            {t.users.dataSource || 'Data Source'}
          </h4>
          <div className="grid grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-900 mb-1">{t.users.sourceType || 'Source Type'} *</label>
              <select
                value={config.source?.type}
                onChange={(e) => onConfigChange({
                  ...config,
                  source: { ...config.source!, type: e.target.value as 'url' | 'sftp' | 'api' }
                })}
                className="w-full px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="url">URL</option>
                <option value="api">API</option>
                <option value="sftp">SFTP</option>
              </select>
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-medium text-gray-900 mb-1">
                {config.source?.type === 'api' ? 'API Endpoint' : 'URL'} *
              </label>
              <input
                type="url"
                value={config.source?.url}
                onChange={(e) => onConfigChange({
                  ...config,
                  source: { ...config.source!, url: e.target.value }
                })}
                placeholder="https://api.yourcompany.com/employees.csv"
                className="w-full px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Authentication */}
          <div className="bg-gray-50 p-3 rounded">
            <h5 className="font-medium mb-2 flex items-center gap-2 text-gray-900 text-xs">
              <Key className="h-3 w-3" />
              {t.users.authenticationOptional || 'Authentication (Optional)'}
            </h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-1">Username</label>
                <input
                  type="text"
                  value={config.source?.credentials?.username || ''}
                  onChange={(e) => onConfigChange({
                    ...config,
                    source: {
                      ...config.source!,
                      credentials: { ...config.source?.credentials, username: e.target.value }
                    }
                  })}
                  className="w-full px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-1">Password/API Key</label>
                <input
                  type="password"
                  value={config.source?.credentials?.password || config.source?.credentials?.apiKey || ''}
                  onChange={(e) => onConfigChange({
                    ...config,
                    source: {
                      ...config.source!,
                      credentials: { 
                        ...config.source?.credentials, 
                        [config.source?.type === 'api' ? 'apiKey' : 'password']: e.target.value 
                      }
                    }
                  })}
                  className="w-full px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Notifications */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2 text-gray-900 text-sm">
            <Mail className="h-4 w-4" />
            Notifications
          </h4>
          <div>
            <label className="block text-xs font-medium text-gray-900 mb-1">Email Addresses (one per line)</label>
            <textarea
              rows={2}
              value={(config.importOptions?.notificationEmails || []).join('\n')}
              onChange={(e) => onConfigChange({
                ...config,
                importOptions: {
                  ...config.importOptions!,
                  notificationEmails: e.target.value.split('\n').filter(email => email.trim())
                }
              })}
              placeholder="admin@company.com&#10;hr@company.com"
              className="w-full px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-600 mt-1">
              Receive notifications when imports succeed or fail
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-2 pt-2">
          <button
            onClick={onCancel}
            className="px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700"
          >
            {t.users.cancel || 'Cancel'}
          </button>
          <button
            onClick={onSubmit}
            disabled={isLoading || !config.name}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? (t.users.saving || 'Saving...') : (isEditing ? (t.users.update || 'Update') : (t.users.create || 'Create'))}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}