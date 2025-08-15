'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { exportAuditLogsToExcel } from '@/lib/services/audit-export'
import { FileText, User, RotateCcw, Edit3, CheckCircle, BarChart3, File, ChevronLeft, Download, X, BarChart } from 'lucide-react'

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
  const { t, language } = useLanguage()
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

  const getActionText = (action: string) => {
    const actions: Record<string, string> = {
      create: t.dashboard.actionCreate,
      update: t.dashboard.actionUpdate,
      delete: t.dashboard.actionDelete,
      submit: t.dashboard.actionSubmit,
      approve: t.dashboard.actionApprove,
      unlock: t.dashboard.actionUnlock,
      login: t.dashboard.actionLogin,
      export: t.dashboard.actionExport,
      import: t.dashboard.actionImport
    }
    return actions[action] || action
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Fixed Header - Compact audit design */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-8xl mx-auto px-4 md:px-6 lg:px-8 py-2 md:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-1.5 md:p-2 -ml-1.5 min-h-[44px] min-w-[44px] rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 touch-manipulation"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-base md:text-lg font-semibold text-gray-900">{t.dashboard.auditDashboard}</h1>
                <p className="text-xs md:text-sm text-gray-500 hidden md:block">{t.dashboard.auditDescription}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* Filters - Compact and flush with header */}
      <div className="fixed top-[60px] md:top-[72px] left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-8xl mx-auto px-4 md:px-6 lg:px-8 py-2 md:py-3">
          <div className="flex flex-wrap items-end justify-between gap-2 md:gap-3">
            <div className="flex flex-wrap items-end gap-2 md:gap-3 flex-1">
              <select
                value={filters.action || ''}
                onChange={(e) => updateFilters({ action: e.target.value })}
                className="px-2 md:px-3 py-1.5 md:py-2 min-h-[36px] md:min-h-[44px] border border-gray-300 rounded text-xs md:text-sm min-w-[100px] md:min-w-[120px] bg-white shadow-sm hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
              >
                <option value="">{t.dashboard.allActions}</option>
                <option value="create">{getActionText('create')}</option>
                <option value="update">{getActionText('update')}</option>
                <option value="delete">{getActionText('delete')}</option>
                <option value="submit">{getActionText('submit')}</option>
                <option value="approve">{getActionText('approve')}</option>
                <option value="unlock">{getActionText('unlock')}</option>
                <option value="login">{getActionText('login')}</option>
                <option value="export">{getActionText('export')}</option>
              </select>

              <select
                value={filters.entityType || ''}
                onChange={(e) => updateFilters({ entityType: e.target.value })}
                className="px-2 md:px-3 py-1.5 md:py-2 min-h-[36px] md:min-h-[44px] border border-gray-300 rounded text-xs md:text-sm min-w-[100px] md:min-w-[120px] bg-white shadow-sm hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
              >
                <option value="">{t.dashboard.allTypes}</option>
                <option value="evaluation">{t.dashboard.evaluations}</option>
                <option value="user">{t.dashboard.users}</option>
                <option value="cycle">{t.dashboard.cycles}</option>
                <option value="item">{t.dashboard.items}</option>
                <option value="report">{t.dashboard.reports}</option>
              </select>

              <div className="flex flex-col gap-0.5 min-w-[130px] md:min-w-[150px]">
                <label className="text-xs text-gray-600 font-medium px-1">{t.dashboard.startDate}</label>
                <input
                  type="date"
                  value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => updateFilters({ startDate: e.target.value })}
                  className="px-2 md:px-3 py-1.5 md:py-2 min-h-[36px] md:min-h-[44px] border border-gray-300 rounded text-xs md:text-sm bg-white shadow-sm hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                  lang={language}
                />
              </div>
              
              <div className="flex flex-col gap-0.5 min-w-[130px] md:min-w-[150px]">
                <label className="text-xs text-gray-600 font-medium px-1">{t.dashboard.endDate}</label>
                <input
                  type="date"
                  value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => updateFilters({ endDate: e.target.value })}
                  className="px-2 md:px-3 py-1.5 md:py-2 min-h-[36px] md:min-h-[44px] border border-gray-300 rounded text-xs md:text-sm bg-white shadow-sm hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                  lang={language}
                />
              </div>
            </div>
            
            <div className="flex items-end gap-2 md:gap-3 shrink-0">
              <button
                onClick={() => router.push('/dashboard/audit')}
                className="px-3 md:px-4 py-1.5 md:py-2 min-h-[36px] md:min-h-[44px] bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs md:text-sm font-medium whitespace-nowrap transition-all duration-200 shadow-sm active:scale-95"
              >
                {t.dashboard.clearFilters}
              </button>
              <button
                onClick={handleExport}
                disabled={exporting || logs.length === 0}
                className="px-3 md:px-4 py-1.5 md:py-2 min-h-[36px] md:min-h-[44px] bg-primary text-white rounded hover:bg-primary-hover text-xs md:text-sm font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 md:gap-2 transition-all duration-200 shadow-sm active:scale-95"
              >
                <Download className="w-3 h-3 md:w-4 md:h-4" />
                <span>{exporting ? '...' : t.dashboard.exportExcel}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats & Pagination Bar - Compact audit design */}
      <div className="mt-[140px] md:mt-[160px] bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200/50">
        <div className="max-w-8xl mx-auto px-4 md:px-6 lg:px-8 py-2 md:py-3">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-3">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-xs md:text-sm text-gray-700 font-medium">
                {t.dashboard.showingOf} {logs.length} / {total}
              </span>
              <div className="h-3 w-px bg-gray-300 hidden md:block"></div>
              <span className="text-xs text-gray-500 hidden md:inline">
                {t.dashboard.totalPages.replace('{count}', totalPages.toString())}
              </span>
            </div>
            
            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString())
                  params.set('page', String(currentPage - 1))
                  router.push(`/dashboard/audit?${params.toString()}`)
                }}
                disabled={currentPage <= 1}
                className="px-2 md:px-3 py-1.5 md:py-2 min-h-[36px] md:min-h-[44px] bg-white border border-gray-300 rounded text-xs md:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200 shadow-sm"
              >
                ←
              </button>
              <span className="px-2 md:px-3 py-1.5 md:py-2 bg-primary text-white rounded text-xs md:text-sm font-medium shadow-sm">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString())
                  params.set('page', String(currentPage + 1))
                  router.push(`/dashboard/audit?${params.toString()}`)
                }}
                disabled={currentPage >= totalPages}
                className="px-2 md:px-3 py-1.5 md:py-2 min-h-[36px] md:min-h-[44px] bg-white border border-gray-300 rounded text-xs md:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200 shadow-sm"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Table - Compact audit design */}
      <div className="max-w-8xl mx-auto px-4 md:px-6 lg:px-8 py-2 md:py-3">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg md:rounded-xl shadow-lg border border-gray-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                <tr>
                  <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t.dashboard.timestamp}
                  </th>
                  <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t.dashboard.user}
                  </th>
                  <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t.dashboard.action}
                  </th>
                  <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t.dashboard.entity}
                  </th>
                  <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t.dashboard.details}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/90 divide-y divide-gray-200/50">
                {logs.map((log, index) => (
                  <tr key={log.id} className={`hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-200 ${index % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'}`}>
                    <td className="px-2 md:px-3 py-1.5 md:py-2 whitespace-nowrap text-xs text-gray-900">
                      <div className="font-medium">{formatDate(log.timestamp)}</div>
                    </td>
                    <td className="px-2 md:px-3 py-1.5 md:py-2 whitespace-nowrap">
                      <div className="text-xs">
                        <div className="font-semibold text-gray-900">{log.user.name}</div>
                        <div className="text-gray-500 text-xs leading-tight">{log.user.role}</div>
                      </div>
                    </td>
                    <td className="px-2 md:px-3 py-1.5 md:py-2 whitespace-nowrap">
                      <span className={`px-2 py-0.5 md:px-2.5 md:py-1 inline-flex text-xs leading-4 font-medium rounded-full shadow-sm ${getActionColor(log.action)}`}>
                        {getActionText(log.action)}
                      </span>
                    </td>
                    <td className="px-2 md:px-3 py-1.5 md:py-2 whitespace-nowrap text-xs text-gray-900">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">{getEntityTypeIcon(log.entityType)}</span>
                        <span className="font-medium">{log.entityType}</span>
                      </div>
                      {log.entityId && (
                        <div className="text-xs text-gray-500 leading-tight">#{log.entityId.slice(-6)}</div>
                      )}
                    </td>
                    <td className="px-2 md:px-3 py-1.5 md:py-2 text-xs">
                      <button
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        className="px-2 py-1 md:px-2.5 md:py-1.5 min-h-[28px] md:min-h-[44px] bg-primary text-white rounded hover:bg-primary-hover text-xs font-medium transition-all duration-200 shadow-sm active:scale-95"
                      >
                        {expandedLog === log.id ? t.dashboard.hide : t.dashboard.show}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {logs.length === 0 && (
              <div className="text-center py-12 md:py-16">
                <BarChart className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">{t.dashboard.noAuditLogs}</h3>
                <p className="text-sm md:text-base text-gray-500">{t.dashboard.auditLogsWillAppear}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Details Modal - Compact audit design */}
      {expandedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-lg md:rounded-xl max-w-xl md:max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-white/20">
            <div className="p-3 md:p-4">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h2 className="text-sm md:text-base font-bold text-gray-900">{t.dashboard.auditDetails}</h2>
                <button
                  onClick={() => setExpandedLog(null)}
                  className="p-1.5 min-h-[44px] min-w-[44px] text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded transition-all duration-200"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
              
              {logs.find(l => l.id === expandedLog) && (
                <div className="space-y-3 md:space-y-4">
                  {(() => {
                    const log = logs.find(l => l.id === expandedLog)!
                    return (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-2 md:p-3 rounded">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</label>
                            <p className="text-xs md:text-sm text-gray-900 font-mono mt-0.5">{log.id}</p>
                          </div>
                          
                          <div className="bg-gradient-to-br from-green-50 to-blue-50 p-2 md:p-3 rounded">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{t.dashboard.timestamp}</label>
                            <p className="text-xs md:text-sm text-gray-900 font-medium mt-0.5">{formatDate(log.timestamp)}</p>
                          </div>
                          
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-2 md:p-3 rounded">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{t.dashboard.user}</label>
                            <p className="text-xs md:text-sm text-gray-900 font-medium mt-0.5">
                              {log.user.name} ({log.user.role})
                            </p>
                          </div>
                          
                          {log.ipAddress && (
                            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-2 md:p-3 rounded">
                              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{t.dashboard.ipAddress}</label>
                              <p className="text-xs md:text-sm text-gray-900 font-mono mt-0.5">{log.ipAddress}</p>
                            </div>
                          )}
                        </div>
                        
                        {log.reason && (
                          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-2 md:p-3 rounded border border-amber-200/50">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{t.dashboard.reason}</label>
                            <p className="text-xs md:text-sm text-gray-900 mt-1">{log.reason}</p>
                          </div>
                        )}
                        
                        {log.oldData && (
                          <div className="bg-gradient-to-br from-red-50 to-pink-50 p-2 md:p-3 rounded border border-red-200/50">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">{t.dashboard.oldData}</label>
                            <pre className="text-xs bg-white/80 backdrop-blur-sm p-2 md:p-3 rounded overflow-x-auto border border-gray-200/50 font-mono">
                              {JSON.stringify(log.oldData, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {log.newData && (
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-2 md:p-3 rounded border border-green-200/50">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">{t.dashboard.newData}</label>
                            <pre className="text-xs bg-white/80 backdrop-blur-sm p-2 md:p-3 rounded overflow-x-auto border border-gray-200/50 font-mono">
                              {JSON.stringify(log.newData, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {log.metadata && (
                          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-2 md:p-3 rounded border border-indigo-200/50">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">{t.dashboard.metadata}</label>
                            <pre className="text-xs bg-white/80 backdrop-blur-sm p-2 md:p-3 rounded overflow-x-auto border border-gray-200/50 font-mono">
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