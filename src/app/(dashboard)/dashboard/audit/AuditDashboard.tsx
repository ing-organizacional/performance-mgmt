'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

interface AuditLog {
  id: string
  timestamp: string
  action: string
  entityType: string
  entityId?: string
  targetUserId?: string
  ipAddress?: string
  userAgent?: string
  oldData?: any
  newData?: any
  metadata?: any
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

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
      submit: 'bg-purple-100 text-purple-800',
      approve: 'bg-green-100 text-green-800',
      unlock: 'bg-yellow-100 text-yellow-800',
      login: 'bg-gray-100 text-gray-800',
      export: 'bg-orange-100 text-orange-800',
      import: 'bg-indigo-100 text-indigo-800'
    }
    return colors[action] || 'bg-gray-100 text-gray-800'
  }

  const getEntityTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      evaluation: '📋',
      user: '👤',
      cycle: '🔄',
      item: '📝',
      assignment: '✅',
      report: '📊'
    }
    return icons[type] || '📄'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header - Matching app design */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold text-gray-900 truncate">Audit Log Dashboard</h1>
              <p className="text-xs text-gray-500">System security and compliance tracking</p>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center justify-center w-9 h-9 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all duration-150 touch-manipulation ml-3"
              title="Back to Dashboard"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters - Account for fixed header */}
      <div className="mt-20 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex flex-wrap gap-3">
          {/* Action Filter */}
          <select
            value={filters.action || ''}
            onChange={(e) => updateFilters({ action: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="submit">Submit</option>
            <option value="approve">Approve</option>
            <option value="unlock">Unlock</option>
            <option value="login">Login</option>
            <option value="export">Export</option>
            <option value="import">Import</option>
          </select>

          {/* Entity Type Filter */}
          <select
            value={filters.entityType || ''}
            onChange={(e) => updateFilters({ entityType: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Types</option>
            <option value="evaluation">Evaluations</option>
            <option value="user">Users</option>
            <option value="cycle">Cycles</option>
            <option value="item">Items</option>
            <option value="report">Reports</option>
          </select>

          {/* Date Range */}
          <input
            type="date"
            value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
            onChange={(e) => updateFilters({ startDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
            onChange={(e) => updateFilters({ endDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="End Date"
          />

          {/* Clear Filters */}
          <button
            onClick={() => router.push('/dashboard/audit')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Showing {logs.length} of {total} audit logs
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                params.set('page', String(currentPage - 1))
                router.push(`/dashboard/audit?${params.toString()}`)
              }}
              disabled={currentPage <= 1}
              className="px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 bg-white border border-gray-300 rounded text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                params.set('page', String(currentPage + 1))
                router.push(`/dashboard/audit?${params.toString()}`)
              }}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="px-4 py-4">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{log.user.name}</div>
                      <div className="text-gray-500">{log.user.role}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    <span className="mr-1">{getEntityTypeIcon(log.entityType)}</span>
                    {log.entityType}
                    {log.entityId && (
                      <div className="text-xs text-gray-500">ID: {log.entityId.slice(-8)}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <button
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {expandedLog === log.id ? 'Hide' : 'Show'} Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {logs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No audit logs found matching your filters
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details Modal */}
      {expandedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Audit Log Details</h2>
                <button
                  onClick={() => setExpandedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {logs.find(l => l.id === expandedLog) && (
                <div className="space-y-4">
                  {(() => {
                    const log = logs.find(l => l.id === expandedLog)!
                    return (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-500">ID</label>
                          <p className="text-sm text-gray-900">{log.id}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-500">Timestamp</label>
                          <p className="text-sm text-gray-900">{formatDate(log.timestamp)}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-500">User</label>
                          <p className="text-sm text-gray-900">
                            {log.user.name} ({log.user.email}) - {log.user.role}
                          </p>
                        </div>
                        
                        {log.ipAddress && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">IP Address</label>
                            <p className="text-sm text-gray-900">{log.ipAddress}</p>
                          </div>
                        )}
                        
                        {log.reason && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Reason</label>
                            <p className="text-sm text-gray-900">{log.reason}</p>
                          </div>
                        )}
                        
                        {log.oldData && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Old Data</label>
                            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.oldData, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {log.newData && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">New Data</label>
                            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.newData, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {log.metadata && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Metadata</label>
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