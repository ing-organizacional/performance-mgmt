'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  History, 
  RotateCcw, 
  ArrowLeft, 
  Clock,
  User,
  FileText,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import type { ImportHistoryEntry } from '@/lib/actions/csv-import'

interface CSVImportHistoryProps {
  importHistory: ImportHistoryEntry[]
  onBack: () => void
  onRollback: (auditLogId: string) => void
  onLoadHistory: () => void
}

export function CSVImportHistory({ 
  importHistory, 
  onBack, 
  onRollback, 
  onLoadHistory 
}: CSVImportHistoryProps) {

  // Load history on component mount
  React.useEffect(() => {
    if (importHistory.length === 0) {
      onLoadHistory()
    }
  }, [importHistory.length, onLoadHistory]) // onLoadHistory is now stable via useCallback

  const getOperationBadge = (operation: string) => {
    switch (operation) {
      case 'csv_import_execute':
        return <Badge variant="default">Executed</Badge>
      case 'csv_import_batch_execute':
        return <Badge variant="default">Batch Executed</Badge>
      case 'csv_import_preview':
        return <Badge variant="outline">Previewed</Badge>
      case 'csv_import_rollback':
        return <Badge variant="destructive">Rolled Back</Badge>
      default:
        return <Badge variant="secondary">{operation}</Badge>
    }
  }

  const getSuccessIndicator = (entry: ImportHistoryEntry) => {
    if (entry.failed && entry.failed > 0) {
      if ((entry.created || 0) + (entry.updated || 0) > 0) {
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      }
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      relative: getRelativeTime(date)
    }
  }

  const getRelativeTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = diff / (1000 * 60 * 60)
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60))
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
    } else if (hours < 24) {
      return `${Math.floor(hours)} hour${Math.floor(hours) !== 1 ? 's' : ''} ago`
    } else {
      const days = Math.floor(hours / 24)
      return `${days} day${days !== 1 ? 's' : ''} ago`
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <History className="h-5 w-5" />
              Import History
            </CardTitle>
            <CardDescription className="text-gray-700">
              Recent CSV import operations and rollback options
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Import
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {importHistory.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Import History</h3>
            <p className="text-gray-600">
              Import history will appear here after you perform CSV imports.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {importHistory.map((entry) => {
              const timestamp = formatTimestamp(entry.timestamp)
              const details = entry.details as {
                fileName?: string
                totalRows?: number
                totalProcessed?: number
                created?: number
                updated?: number
                failed?: number
                executionTimeMs?: number
              } | undefined

              return (
                <Card key={entry.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getSuccessIndicator(entry)}
                          <div>
                            <div className="font-medium">
                              {entry.operation.includes('rollback') ? 'Import Rolled Back' : 'CSV Import'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {getOperationBadge(entry.operation)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-gray-600" />
                            <div>
                              <div className="font-medium">{entry.userName}</div>
                              <div className="text-gray-600">{entry.userEmail}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-gray-600" />
                            <div>
                              <div className="font-medium">{timestamp.date} {timestamp.time}</div>
                              <div className="text-gray-600">{timestamp.relative}</div>
                            </div>
                          </div>
                          
                          {details?.fileName && (
                            <div className="flex items-center gap-2 text-sm">
                              <FileText className="h-4 w-4 text-gray-600" />
                              <div>
                                <div className="font-medium truncate" title={details.fileName}>
                                  {details.fileName}
                                </div>
                                <div className="text-gray-600">
                                  {details.totalProcessed || details.totalRows} rows
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Import Statistics */}
                        {(details?.created || details?.updated || details?.failed) && (
                          <div className="flex items-center gap-4 text-sm mb-3">
                            {details.created && (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="font-medium">{details.created}</span>
                                <span className="text-gray-600">created</span>
                              </div>
                            )}
                            {details.updated && (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="font-medium">{details.updated}</span>
                                <span className="text-gray-600">updated</span>
                              </div>
                            )}
                            {details.failed && details.failed > 0 && (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="font-medium">{details.failed}</span>
                                <span className="text-gray-600">failed</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Performance Info */}
                        {details?.executionTimeMs && (
                          <div className="text-xs text-gray-600">
                            Execution time: {Math.round(details.executionTimeMs / 1000)}s
                          </div>
                        )}
                      </div>
                      
                      {/* Rollback Button */}
                      {entry.canRollback && entry.operation.includes('execute') && !entry.operation.includes('rollback') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRollback(entry.id)}
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground ml-4"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Rollback
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            
            {/* Load More Button (if needed in the future) */}
            {importHistory.length >= 50 && (
              <div className="text-center py-4">
                <Button variant="outline" onClick={onLoadHistory}>
                  Load More History
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  )
}

