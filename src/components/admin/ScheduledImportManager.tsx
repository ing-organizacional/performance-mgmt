'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ToastContainer } from '@/components/ui'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Clock,
  Play,
  Pause,
  Settings,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Calendar,
  Globe,
  Key,
  Mail
} from 'lucide-react'
import {
  getScheduledImports,
  createScheduledImport,
  updateScheduledImport,
  deleteScheduledImport,
  executeScheduledImport,
  type ScheduledImportConfig
} from '@/lib/actions/scheduled-import'

interface ScheduledImportManagerProps {
  onImportComplete?: () => void
}

interface ScheduledImportDisplay extends Omit<ScheduledImportConfig, 'description' | 'status' | 'lastRun' | 'nextRun' | 'errorMessage'> {
  description: string | null
  status: string
  lastRun: Date | null
  nextRun: Date | null
  errorMessage: string | null
  createdAt?: Date
  createdBy?: string
}

export function ScheduledImportManager({ onImportComplete }: ScheduledImportManagerProps) {
  const { t } = useLanguage()
  const { toasts, success, error, removeToast } = useToast()
  const [scheduledImports, setScheduledImports] = useState<ScheduledImportDisplay[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingImport, setEditingImport] = useState<ScheduledImportConfig | null>(null)
  const loadingRef = useRef(false)

  // Form state
  const [formConfig, setFormConfig] = useState<Partial<ScheduledImportConfig>>({
    name: '',
    description: '',
    enabled: true,
    schedule: {
      frequency: 'daily',
      time: '09:00',
      timezone: 'America/New_York'
    },
    source: {
      type: 'url',
      url: '',
      credentials: {}
    },
    importOptions: {
      updateExisting: true,
      createNew: true,
      requireConfirmation: false,
      notificationEmails: []
    },
    status: 'active'
  })

  const loadScheduledImports = useCallback(async () => {
    // Prevent duplicate loading calls
    if (loadingRef.current) {
      return
    }
    
    loadingRef.current = true
    setIsLoading(true)
    try {
      const result = await getScheduledImports()
      if (result.success) {
        setScheduledImports(result.imports)
      } else {
        // Only show error toast for actual errors, not for empty results or auth issues
        console.warn('Failed to load scheduled imports:', result.message)
        setScheduledImports([]) // Set empty array as fallback
        if (result.message && result.message !== 'Authentication failed') {
          error(result.message)
        }
      }
    } catch (err) {
      console.error('Exception loading scheduled imports:', err)
      setScheduledImports([]) // Set empty array as fallback
      error(t.users.failedToLoadScheduledImports || 'Failed to load scheduled imports')
    } finally {
      setIsLoading(false)
      loadingRef.current = false
    }
  }, [error, t.users.failedToLoadScheduledImports])

  useEffect(() => {
    loadScheduledImports()
  }, [loadScheduledImports])

  const handleCreate = async () => {
    if (!formConfig.name || !formConfig.schedule || !formConfig.source) {
      error(t.users.fillAllRequiredFields || 'Please fill in all required fields')
      return
    }

    try {
      const result = await createScheduledImport(formConfig as Omit<ScheduledImportConfig, 'id' | 'lastRun' | 'nextRun'>)
      if (result.success) {
        setShowCreateForm(false)
        resetForm()
        loadScheduledImports()
        success(t.users.scheduledImportCreated || 'Scheduled import created successfully')
      } else {
        error(result.message || (t.common.unknownError || 'Unknown error'))
      }
    } catch {
      error(t.users.failedToCreateScheduledImport || 'Failed to create scheduled import')
    }
  }

  const handleUpdate = async (id: string, updates: Partial<ScheduledImportConfig>) => {
    try {
      const result = await updateScheduledImport(id, updates)
      if (result.success) {
        loadScheduledImports()
        setEditingImport(null)
        success(t.users.scheduledImportUpdated || 'Scheduled import updated successfully')
      } else {
        error(result.message || (t.common.unknownError || 'Unknown error'))
      }
    } catch {
      error(t.users.failedToUpdateScheduledImport || 'Failed to update scheduled import')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const result = await deleteScheduledImport(id)
      if (result.success) {
        loadScheduledImports()
        success(t.users.scheduledImportDeleted || 'Scheduled import deleted successfully')
      } else {
        error(result.message || (t.common.unknownError || 'Unknown error'))
      }
    } catch {
      error(t.users.failedToDeleteScheduledImport || 'Failed to delete scheduled import')
    }
  }

  const handleExecute = async (id: string, name: string) => {
    if (!confirm(`Execute "${name}" now? This will import data immediately.`)) {
      return
    }

    try {
      setIsLoading(true)
      const result = await executeScheduledImport(id)
      if (result.success) {
        loadScheduledImports()
        onImportComplete?.()
        success(`${t.users.importExecutedSuccessfully || 'Import executed successfully'}: ${result.message}`)
      } else {
        error(result.message || (t.common.unknownError || 'Unknown error'))
      }
    } catch {
      error(t.users.failedToExecuteScheduledImport || 'Failed to execute scheduled import')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleEnabled = async (scheduledImport: ScheduledImportDisplay) => {
    await handleUpdate(scheduledImport.id!, { enabled: !scheduledImport.enabled })
  }

  const resetForm = () => {
    setFormConfig({
      name: '',
      description: '',
      enabled: true,
      schedule: {
        frequency: 'daily',
        time: '09:00',
        timezone: 'America/New_York'
      },
      source: {
        type: 'url',
        url: '',
        credentials: {}
      },
      importOptions: {
        updateExisting: true,
        createNew: true,
        requireConfirmation: false,
        notificationEmails: []
      },
      status: 'active'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, label: 'Active', icon: CheckCircle },
      paused: { variant: 'secondary' as const, label: 'Paused', icon: Pause },
      error: { variant: 'destructive' as const, label: 'Error', icon: AlertCircle },
      disabled: { variant: 'outline' as const, label: 'Disabled', icon: Pause }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    const Icon = config.icon

    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getFrequencyLabel = (schedule: ScheduledImportConfig['schedule']) => {
    const { frequency, time, dayOfWeek, dayOfMonth } = schedule
    
    switch (frequency) {
      case 'daily':
        return `Daily at ${time}`
      case 'weekly':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        return `Weekly on ${days[dayOfWeek || 0]} at ${time}`
      case 'monthly':
        return `Monthly on day ${dayOfMonth || 1} at ${time}`
      default:
        return `${frequency} at ${time}`
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Clock className="h-5 w-5" />
                {t.users.scheduledImports}
              </CardTitle>
              <CardDescription className="text-gray-700">
                {t.users.automateCSVImports || 'Automate CSV imports from external systems (HRIS, APIs, URLs)'}
              </CardDescription>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              disabled={isLoading || scheduledImports.length === 0}
              className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              {t.users.createSchedule || 'Create Schedule'}
            </button>
          </div>
        </CardHeader>
      </Card>

      {/* Create/Edit Form */}
      {(showCreateForm || editingImport) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">
              {editingImport ? (t.users.editScheduledImport || 'Edit Scheduled Import') : (t.users.createNewScheduledImport || 'Create New Scheduled Import')}
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
                  value={formConfig.name}
                  onChange={(e) => setFormConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Daily HRIS Sync"
                  className="w-full px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-900 mb-1">{t.users.description || 'Description'}</label>
                <input
                  type="text"
                  value={formConfig.description}
                  onChange={(e) => setFormConfig(prev => ({ ...prev, description: e.target.value }))}
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
                    value={formConfig.schedule?.frequency}
                    onChange={(e) => setFormConfig(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule!, frequency: e.target.value as any }
                    }))}
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
                    value={formConfig.schedule?.time}
                    onChange={(e) => setFormConfig(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule!, time: e.target.value }
                    }))}
                    className="w-full px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-900 mb-1">{t.users.timezone || 'Timezone'} *</label>
                  <select
                    value={formConfig.schedule?.timezone}
                    onChange={(e) => setFormConfig(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule!, timezone: e.target.value }
                    }))}
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
                  {/* Placeholder for conditional fields */}
                  {formConfig.schedule?.frequency === 'weekly' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-1">Day</label>
                      <select
                        value={formConfig.schedule?.dayOfWeek || 0}
                        onChange={(e) => setFormConfig(prev => ({
                          ...prev,
                          schedule: { ...prev.schedule!, dayOfWeek: parseInt(e.target.value) }
                        }))}
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
                  {formConfig.schedule?.frequency === 'monthly' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-1">Day</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formConfig.schedule?.dayOfMonth || 1}
                        onChange={(e) => setFormConfig(prev => ({
                          ...prev,
                          schedule: { ...prev.schedule!, dayOfMonth: parseInt(e.target.value) }
                        }))}
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
                    value={formConfig.source?.type}
                    onChange={(e) => setFormConfig(prev => ({
                      ...prev,
                      source: { ...prev.source!, type: e.target.value as any }
                    }))}
                    className="w-full px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="url">URL</option>
                    <option value="api">API</option>
                    <option value="sftp">SFTP</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-900 mb-1">
                    {formConfig.source?.type === 'api' ? 'API Endpoint' : 'URL'} *
                  </label>
                  <input
                    type="url"
                    value={formConfig.source?.url}
                    onChange={(e) => setFormConfig(prev => ({
                      ...prev,
                      source: { ...prev.source!, url: e.target.value }
                    }))}
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
                      value={formConfig.source?.credentials?.username || ''}
                      onChange={(e) => setFormConfig(prev => ({
                        ...prev,
                        source: {
                          ...prev.source!,
                          credentials: { ...prev.source?.credentials, username: e.target.value }
                        }
                      }))}
                      className="w-full px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-900 mb-1">Password/API Key</label>
                    <input
                      type="password"
                      value={formConfig.source?.credentials?.password || formConfig.source?.credentials?.apiKey || ''}
                      onChange={(e) => setFormConfig(prev => ({
                        ...prev,
                        source: {
                          ...prev.source!,
                          credentials: { 
                            ...prev.source?.credentials, 
                            [formConfig.source?.type === 'api' ? 'apiKey' : 'password']: e.target.value 
                          }
                        }
                      }))}
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
                  value={(formConfig.importOptions?.notificationEmails || []).join('\n')}
                  onChange={(e) => setFormConfig(prev => ({
                    ...prev,
                    importOptions: {
                      ...prev.importOptions!,
                      notificationEmails: e.target.value.split('\n').filter(email => email.trim())
                    }
                  }))}
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
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingImport(null)
                  resetForm()
                }}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700"
              >
                {t.common.cancel || 'Cancel'}
              </button>
              <button 
                onClick={handleCreate} 
                disabled={isLoading}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {editingImport ? (t.users.update || 'Update') : (t.users.create || 'Create')}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Imports List */}
      <div className="space-y-4">
        {scheduledImports.map((scheduledImport) => (
          <Card key={scheduledImport.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{scheduledImport.name}</h3>
                    {getStatusBadge(scheduledImport.status)}
                    {scheduledImport.enabled ? (
                      <Badge variant="outline">Enabled</Badge>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                  </div>
                  
                  {scheduledImport.description && (
                    <p className="text-sm text-gray-700 mb-2">{scheduledImport.description}</p>
                  )}
                  
                  <div className="text-sm text-gray-800 space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span>{getFrequencyLabel(scheduledImport.schedule)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-600" />
                      <span>{scheduledImport.source.type.toUpperCase()}: {scheduledImport.source.url}</span>
                    </div>
                    {scheduledImport.lastRun && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <span>{t.users.lastRun || 'Last run'}: {new Date(scheduledImport.lastRun).toLocaleString()}</span>
                      </div>
                    )}
                    {scheduledImport.nextRun && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <span>{t.users.nextRun || 'Next run'}: {new Date(scheduledImport.nextRun).toLocaleString()}</span>
                      </div>
                    )}
                    {scheduledImport.errorMessage && (
                      <div className="text-red-700 text-sm font-medium">
                        {t.common.error || 'Error'}: {scheduledImport.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExecute(scheduledImport.id!, scheduledImport.name!)}
                    disabled={isLoading || !scheduledImport.enabled}
                    className="p-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 active:scale-95 transition-all duration-150 touch-manipulation disabled:bg-gray-300 disabled:cursor-not-allowed"
                    title={t.users.executeNow || 'Execute Now'}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleEnabled(scheduledImport)}
                    disabled={isLoading}
                    className="p-2 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 active:scale-95 transition-all duration-150 touch-manipulation disabled:bg-gray-300 disabled:cursor-not-allowed"
                    title={scheduledImport.enabled ? (t.users.pause || 'Pause') : (t.users.enable || 'Enable')}
                  >
                    {scheduledImport.enabled ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingImport(scheduledImport as ScheduledImportConfig)
                      setFormConfig(scheduledImport as ScheduledImportConfig)
                    }}
                    disabled={isLoading}
                    className="p-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 active:scale-95 transition-all duration-150 touch-manipulation disabled:bg-gray-300 disabled:cursor-not-allowed"
                    title={t.users.editScheduledImport || 'Edit'}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(scheduledImport.id!, scheduledImport.name!)}
                    disabled={isLoading}
                    className="p-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 active:scale-95 transition-all duration-150 touch-manipulation disabled:bg-gray-300 disabled:cursor-not-allowed"
                    title={t.common.delete || 'Delete'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {scheduledImports.length === 0 && !isLoading && !showCreateForm && (
          <Card>
            <CardContent className="p-12 text-center">
              <Clock className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t.users.noScheduledImports || 'No Scheduled Imports'}</h3>
              <p className="text-gray-700 mb-6">
                {t.users.createFirstScheduleDescription || 'Create your first scheduled import to automate CSV imports from external systems.'}
              </p>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                {t.users.createFirstSchedule || 'Create First Schedule'}
              </button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}