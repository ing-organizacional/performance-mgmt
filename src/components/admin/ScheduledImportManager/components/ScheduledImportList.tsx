/**
 * Scheduled Import List Component
 * 
 * List component that renders all scheduled imports with empty state
 * and loading handling.
 */

import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import { ScheduledImportCard } from './ScheduledImportCard'
import type { ScheduledImportListProps } from '../types'

export function ScheduledImportList({
  imports,
  isLoading,
  onEdit,
  onDelete,
  onExecute,
  onToggleEnabled
}: ScheduledImportListProps) {
  const { t } = useLanguage()

  if (imports.length === 0 && !isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Clock className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t.users.noScheduledImports || 'No Scheduled Imports'}
          </h3>
          <p className="text-gray-700 mb-6">
            {t.users.createFirstScheduleDescription || 'Create your first scheduled import to automate CSV imports from external systems.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {imports.map((scheduledImport) => (
        <ScheduledImportCard
          key={scheduledImport.id}
          scheduledImport={scheduledImport}
          onEdit={onEdit}
          onDelete={onDelete}
          onExecute={onExecute}
          onToggleEnabled={onToggleEnabled}
        />
      ))}
    </div>
  )
}