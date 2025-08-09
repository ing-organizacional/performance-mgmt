/**
 * Audit Log Excel Export Service
 */

import { utils, writeFile } from 'xlsx'
import type { AuditAction, EntityType } from './audit-service'

interface AuditLogExport {
  id: string
  timestamp: string
  userId: string
  userName: string
  userRole: string
  action: string
  entityType: string
  entityId?: string
  targetUserId?: string
  ipAddress?: string
  oldData?: any
  newData?: any
  metadata?: any
  reason?: string
}

/**
 * Export audit logs to Excel with current filters
 */
export async function exportAuditLogsToExcel(
  logs: any[],
  filters: {
    action?: string
    entityType?: string
    userId?: string
    startDate?: Date
    endDate?: Date
  }
) {
  try {
    // Prepare data for export
    const exportData: AuditLogExport[] = logs.map(log => ({
      id: log.id,
      timestamp: new Date(log.timestamp).toLocaleString(),
      userId: log.user.id,
      userName: log.user.name,
      userRole: log.user.role,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId || '',
      targetUserId: log.targetUserId || '',
      ipAddress: log.ipAddress || '',
      oldData: log.oldData ? JSON.stringify(log.oldData) : '',
      newData: log.newData ? JSON.stringify(log.newData) : '',
      metadata: log.metadata ? JSON.stringify(log.metadata) : '',
      reason: log.reason || ''
    }))

    // Create workbook
    const ws = utils.json_to_sheet(exportData)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Audit Logs')

    // Add filter information as a second sheet
    const filterInfo = [
      ['Filter Applied', 'Value'],
      ['Action', filters.action || 'All'],
      ['Entity Type', filters.entityType || 'All'],
      ['User ID', filters.userId || 'All'],
      ['Start Date', filters.startDate ? filters.startDate.toLocaleDateString() : 'Not set'],
      ['End Date', filters.endDate ? filters.endDate.toLocaleDateString() : 'Not set'],
      ['Export Date', new Date().toLocaleString()],
      ['Total Records', exportData.length.toString()]
    ]
    
    const wsFilters = utils.aoa_to_sheet(filterInfo)
    utils.book_append_sheet(wb, wsFilters, 'Export Info')

    // Auto-size columns
    const maxWidth = 50
    const colWidths: { wch: number }[] = []
    
    // Calculate column widths based on content
    const headers = Object.keys(exportData[0] || {})
    headers.forEach((header, i) => {
      let maxLen = header.length
      exportData.forEach(row => {
        const value = String(row[header as keyof AuditLogExport] || '')
        maxLen = Math.min(Math.max(maxLen, value.length), maxWidth)
      })
      colWidths.push({ wch: maxLen + 2 })
    })
    
    ws['!cols'] = colWidths

    // Generate filename with timestamp
    const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.xlsx`
    
    // Write file
    writeFile(wb, filename)
    
    return { success: true, filename }
  } catch (error) {
    console.error('Export failed:', error)
    return { success: false, error: 'Failed to export audit logs' }
  }
}