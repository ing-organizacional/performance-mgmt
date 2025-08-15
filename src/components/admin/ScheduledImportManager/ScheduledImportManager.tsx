/**
 * Scheduled Import Manager
 * 
 * Main component for managing scheduled CSV imports from external systems.
 * Orchestrates form handling, list display, and import operations using
 * modular sub-components and custom hooks.
 */

'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { useToast } from '@/hooks/useToast'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ToastContainer } from '@/components/ui'
import { Clock, Plus } from 'lucide-react'
import { useScheduledImports } from './hooks/useScheduledImports'
import { ScheduledImportForm, ScheduledImportList } from './components'
import type { ScheduledImportManagerProps } from './types'

export function ScheduledImportManager({ onImportComplete }: ScheduledImportManagerProps) {
  const { t } = useLanguage()
  const { toasts, removeToast } = useToast()
  
  const {
    scheduledImports,
    isLoading,
    showCreateForm,
    editingImport,
    formConfig,
    setShowCreateForm,
    setFormConfig,
    handleEdit,
    handleDelete,
    handleExecute,
    handleToggleEnabled,
    handleSubmit,
    resetForm
  } = useScheduledImports(onImportComplete)

  const handleFormCancel = () => {
    setShowCreateForm(false)
    resetForm()
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
              disabled={isLoading}
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
        <ScheduledImportForm
          isEditing={!!editingImport}
          config={formConfig}
          onConfigChange={setFormConfig}
          onSubmit={handleSubmit}
          onCancel={handleFormCancel}
          isLoading={isLoading}
        />
      )}

      {/* Scheduled Imports List */}
      <ScheduledImportList
        imports={scheduledImports}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onExecute={handleExecute}
        onToggleEnabled={handleToggleEnabled}
      />
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}