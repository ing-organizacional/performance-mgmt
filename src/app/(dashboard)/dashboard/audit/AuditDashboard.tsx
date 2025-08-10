'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { exportAuditLogsToExcel } from '@/lib/services/audit-export'
import { FileText, User, RotateCcw, Edit3, CheckCircle, BarChart3, File } from 'lucide-react'

interface AuditLog {
  id: string
  timestamp: string
  action: string
  entityType: string
  entityId?: string
  targetUserId?: string
  ipAddress?: string
  userAgent?: string
  oldData?: Record<string, unknown>
  newData?: Record<string, unknown>
  metadata?: Record<string, unknown>
  reason?: string
  user: {
    id: string
    name: string
    email?: string
    role: string
  }
}

interface AuditDashboardProps {
  logs: AuditLog[]
  total: number
  currentPage: number
  totalPages: number
  filters: {
    action?: string
    entityType?: string
    userId?: string
    startDate?: Date
    endDate?: Date
  }
}

export default function AuditDashboard({
  logs,
  total,
  currentPage,
  totalPages,
  filters
}: AuditDashboardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const updateFilters = (newFilters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    router.push(`/dashboard/audit?${params.toString()}`)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportAuditLogsToExcel(logs, filters)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(false)
    }
  }

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
      submit: 'bg-primary/10 text-primary',
      approve: 'bg-green-100 text-green-800',
      unlock: 'bg-yellow-100 text-yellow-800',
      login: 'bg-gray-100 text-gray-800',
      export: 'bg-orange-100 text-orange-800',
      import: 'bg-indigo-100 text-indigo-800'
    }
    return colors[action] || 'bg-gray-100 text-gray-800'
  }

  const getEntityTypeIcon = (type: string) => {
    const iconComponents: Record<string, React.ReactElement> = {
      evaluation: <FileText className="h-4 w-4" />,
      user: <User className="h-4 w-4" />,
      cycle: <RotateCcw className="h-4 w-4" />,
      item: <Edit3 className="h-4 w-4" />,
      assignment: <CheckCircle className="h-4 w-4" />,
      report: <BarChart3 className="h-4 w-4" />
    }
    return iconComponents[type] || <File className="h-4 w-4" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header - Matching app design pattern */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-1.5 -ml-1.5 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-semibold text-gray-900 truncate">{t.dashboard.auditDashboard}</h1>
                <p className="text-xs text-gray-500">{t.dashboard.auditDescription}</p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Filters - Fixed flush with header bottom */}
      <div className="fixed top-[52px] left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 overflow-x-auto">
            <select
              value={filters.action || ''}
              onChange={(e) => updateFilters({ action: e.target.value })}
              className="px-2 py-1 border border-gray-300 rounded-lg text-sm min-w-[120px]"
            >
              <option value="">{t.dashboard.allActions}</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="submit">Submit</option>
              <option value="approve">Approve</option>
              <option value="unlock">Unlock</option>
              <option value="login">Login</option>
              <option value="export">Export</option>
            </select>

            <select
              value={filters.entityType || ''}
              onChange={(e) => updateFilters({ entityType: e.target.value })}
              className="px-2 py-1 border border-gray-300 rounded-lg text-sm min-w-[120px]"
            >
              <option value="">{t.dashboard.allTypes}</option>
              <option value="evaluation">Evaluations</option>
              <option value="user">Users</option>
              <option value="cycle">Cycles</option>
              <option value="item">Items</option>
              <option value="report">Reports</option>
            </select>

            <input
              type="date"
              value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => updateFilters({ startDate: e.target.value })}
              className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
            />
            
            <input
              type="date"
              value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => updateFilters({ endDate: e.target.value })}
              className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard/audit')}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm whitespace-nowrap"
            >
              {t.dashboard.clearFilters}
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || logs.length === 0}
              className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {exporting ? '...' : t.dashboard.exportExcel}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar - More compact */}
      <div className="mt-[92px] px-4 py-2 bg-gray-100 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {t.dashboard.showingOf} {logs.length} / {total}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                params.set('page', String(currentPage - 1))
                router.push(`/dashboard/audit?${params.toString()}`)
              }}
              disabled={currentPage <= 1}
              className="px-2 py-1 bg-white border border-gray-300 rounded text-xs disabled:opacity-50"
            >
              ←
            </button>
            <span className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">
              {currentPage}/{totalPages}
            </span>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                params.set('page', String(currentPage + 1))
                router.push(`/dashboard/audit?${params.toString()}`)
              }}
              disabled={currentPage >= totalPages}
              className="px-2 py-1 bg-white border border-gray-300 rounded text-xs disabled:opacity-50"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs Table - More compact */}
      <div className="px-4 py-3">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.dashboard.timestamp}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.dashboard.user}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.dashboard.action}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.dashboard.entity}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.dashboard.details}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs">
                      <div className="font-medium text-gray-900">{log.user.name}</div>
                      <div className="text-gray-500">{log.user.role}</div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    <span className="mr-1">{getEntityTypeIcon(log.entityType)}</span>
                    {log.entityType}
                    {log.entityId && (
                      <div className="text-xs text-gray-500">#{log.entityId.slice(-6)}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-900">
                    <button
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {expandedLog === log.id ? t.dashboard.hideDetails : t.dashboard.showDetails}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {logs.length === 0 && (
            <div className="text-center py-6 text-gray-500 text-sm">
              {t.dashboard.noAuditLogs}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details Modal */}
      {expandedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{t.dashboard.auditDetails}</h2>
                <button
                  onClick={() => setExpandedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {logs.find(l => l.id === expandedLog) && (
                <div className="space-y-3">
                  {(() => {
                    const log = logs.find(l => l.id === expandedLog)!
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-gray-500">ID</label>
                            <p className="text-sm text-gray-900">{log.id}</p>
                          </div>
                          
                          <div>
                            <label className="text-xs font-medium text-gray-500">{t.dashboard.timestamp}</label>
                            <p className="text-sm text-gray-900">{formatDate(log.timestamp)}</p>
                          </div>
                          
                          <div>
                            <label className="text-xs font-medium text-gray-500">{t.dashboard.user}</label>
                            <p className="text-sm text-gray-900">
                              {log.user.name} ({log.user.role})
                            </p>
                          </div>
                          
                          {log.ipAddress && (
                            <div>
                              <label className="text-xs font-medium text-gray-500">{t.dashboard.ipAddress}</label>
                              <p className="text-sm text-gray-900">{log.ipAddress}</p>
                            </div>
                          )}
                        </div>
                        
                        {log.reason && (
                          <div>
                            <label className="text-xs font-medium text-gray-500">{t.dashboard.reason}</label>
                            <p className="text-sm text-gray-900">{log.reason}</p>
                          </div>
                        )}
                        
                        {log.oldData && (
                          <div>
                            <label className="text-xs font-medium text-gray-500">{t.dashboard.oldData}</label>
                            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.oldData, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {log.newData && (
                          <div>
                            <label className="text-xs font-medium text-gray-500">{t.dashboard.newData}</label>
                            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.newData, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {log.metadata && (
                          <div>
                            <label className="text-xs font-medium text-gray-500">{t.dashboard.metadata}</label>
                            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}