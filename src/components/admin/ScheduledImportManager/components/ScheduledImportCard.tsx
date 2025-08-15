/**
 * Scheduled Import Card Component
 * 
 * Individual card component displaying scheduled import details
 * with action buttons for execution, editing, and management.
 */

import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Globe, Play, Pause, Settings, Trash2 } from 'lucide-react'
import { getStatusBadge, getFrequencyLabel } from '../utils'
import type { ScheduledImportCardProps } from '../types'
import type { ScheduledImportConfig } from '@/lib/actions/scheduled-import'

export function ScheduledImportCard({
  scheduledImport,
  onEdit,
  onDelete,
  onExecute,
  onToggleEnabled
}: ScheduledImportCardProps) {
  const { t } = useLanguage()

  return (
    <Card>
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
              onClick={() => onExecute(scheduledImport.id!, scheduledImport.name!)}
              disabled={!scheduledImport.enabled}
              className="p-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 active:scale-95 transition-all duration-150 touch-manipulation disabled:bg-gray-300 disabled:cursor-not-allowed"
              title={t.users.executeNow || 'Execute Now'}
            >
              <Play className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onToggleEnabled(scheduledImport)}
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
              onClick={() => onEdit(scheduledImport as ScheduledImportConfig)}
              className="p-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 active:scale-95 transition-all duration-150 touch-manipulation disabled:bg-gray-300 disabled:cursor-not-allowed"
              title={t.users.editScheduledImport || 'Edit'}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(scheduledImport.id!, scheduledImport.name!)}
              className="p-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 active:scale-95 transition-all duration-150 touch-manipulation disabled:bg-gray-300 disabled:cursor-not-allowed"
              title={t.common.delete || 'Delete'}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}