'use server'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'
import { requireHRRole } from '@/lib/auth-middleware'
import { revalidatePath } from 'next/cache'
import { executeCSVImport, type UpsertOptions } from './csv-import'

// Scheduled Import Configuration
export interface ScheduledImportConfig {
  id?: string
  name: string
  description?: string
  enabled: boolean
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly'
    time: string // HH:MM format
    dayOfWeek?: number // 0-6, Sunday = 0 (for weekly)
    dayOfMonth?: number // 1-31 (for monthly)
    timezone: string
  }
  source: {
    type: 'url' | 'sftp' | 'api'
    url?: string
    credentials?: {
      username?: string
      password?: string
      apiKey?: string
    }
    headers?: Record<string, string>
  }
  importOptions: UpsertOptions & {
    validateOnly?: boolean
    notificationEmails?: string[]
  }
  lastRun?: Date
  nextRun?: Date
  status: 'active' | 'paused' | 'error' | 'disabled'
  errorMessage?: string
}

export interface ScheduledImportResult {
  success: boolean
  message: string
  importId?: string
  errors?: string[]
}

// Create or Update Scheduled Import
export async function createScheduledImport(
  config: Omit<ScheduledImportConfig, 'id' | 'lastRun' | 'nextRun'>
): Promise<ScheduledImportResult> {
  try {
    const authResult = await requireHRRole()
    if (authResult instanceof NextResponse) {
      return { success: false, message: 'Authentication failed' }
    }

    const { user } = authResult

    // Calculate next run time
    const nextRun = calculateNextRun(config.schedule)

    const scheduledImport = await prisma.scheduledImport.create({
      data: {
        name: config.name,
        description: config.description,
        enabled: config.enabled,
        companyId: user.companyId,
        createdBy: user.id,
        schedule: JSON.parse(JSON.stringify(config.schedule)),
        source: JSON.parse(JSON.stringify(config.source)),
        importOptions: JSON.parse(JSON.stringify(config.importOptions)),
        status: config.status,
        nextRun
      }
    })

    // Log the configuration
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        userRole: user.role,
        timestamp: new Date(),
        action: 'scheduled_import_create',
        entityType: 'ScheduledImport',
        entityId: scheduledImport.id,
        metadata: {
          importName: config.name,
          frequency: config.schedule.frequency,
          enabled: config.enabled
        }
      }
    })

    revalidatePath('/users/advanced')

    return {
      success: true,
      message: 'Scheduled import created successfully',
      importId: scheduledImport.id
    }

  } catch (error) {
    console.error('Error creating scheduled import:', error)
    return { success: false, message: 'Failed to create scheduled import' }
  }
}

// Update Scheduled Import
export async function updateScheduledImport(
  id: string,
  config: Partial<ScheduledImportConfig>
): Promise<ScheduledImportResult> {
  try {
    const authResult = await requireHRRole()
    if (authResult instanceof NextResponse) {
      return { success: false, message: 'Authentication failed' }
    }

    const { user } = authResult

    // Verify ownership
    const existingImport = await prisma.scheduledImport.findUnique({
      where: { id }
    })

    if (!existingImport || existingImport.companyId !== user.companyId) {
      return { success: false, message: 'Scheduled import not found' }
    }

    const updateData: Record<string, unknown> = { ...config }

    // Recalculate next run if schedule changed
    if (config.schedule) {
      updateData.nextRun = calculateNextRun(config.schedule)
    }

    await prisma.scheduledImport.update({
      where: { id },
      data: updateData
    })

    // Log the update
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        userRole: user.role,
        timestamp: new Date(),
        action: 'scheduled_import_update',
        entityType: 'ScheduledImport',
        entityId: id,
        metadata: {
          changes: Object.keys(config),
          enabled: config.enabled
        }
      }
    })

    revalidatePath('/users/advanced')

    return { success: true, message: 'Scheduled import updated successfully' }

  } catch (error) {
    console.error('Error updating scheduled import:', error)
    return { success: false, message: 'Failed to update scheduled import' }
  }
}

// Get Scheduled Imports
export async function getScheduledImports() {
  try {
    const authResult = await requireHRRole()
    if (authResult instanceof NextResponse) {
      return { success: false, message: 'Authentication failed', imports: [] }
    }

    const { user } = authResult

    const imports = await prisma.scheduledImport.findMany({
      where: {
        companyId: user.companyId
      },
      include: {
        createdByUser: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return {
      success: true,
      imports: imports.map(imp => ({
        id: imp.id,
        name: imp.name,
        description: imp.description,
        enabled: imp.enabled,
        schedule: imp.schedule as unknown as ScheduledImportConfig['schedule'],
        source: imp.source as unknown as ScheduledImportConfig['source'],
        importOptions: imp.importOptions as unknown as ScheduledImportConfig['importOptions'],
        lastRun: imp.lastRun,
        nextRun: imp.nextRun,
        status: imp.status,
        errorMessage: imp.errorMessage,
        createdAt: imp.createdAt,
        createdBy: imp.createdByUser.name
      }))
    }

  } catch (error) {
    console.error('Error fetching scheduled imports:', error)
    return { success: false, message: 'Failed to fetch scheduled imports', imports: [] }
  }
}

// Delete Scheduled Import
export async function deleteScheduledImport(id: string): Promise<ScheduledImportResult> {
  try {
    const authResult = await requireHRRole()
    if (authResult instanceof NextResponse) {
      return { success: false, message: 'Authentication failed' }
    }

    const { user } = authResult

    // Verify ownership
    const existingImport = await prisma.scheduledImport.findUnique({
      where: { id }
    })

    if (!existingImport || existingImport.companyId !== user.companyId) {
      return { success: false, message: 'Scheduled import not found' }
    }

    await prisma.scheduledImport.delete({
      where: { id }
    })

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        userRole: user.role,
        timestamp: new Date(),
        action: 'scheduled_import_delete',
        entityType: 'ScheduledImport',
        entityId: id,
        metadata: {
          importName: existingImport.name
        }
      }
    })

    revalidatePath('/users/advanced')

    return { success: true, message: 'Scheduled import deleted successfully' }

  } catch (error) {
    console.error('Error deleting scheduled import:', error)
    return { success: false, message: 'Failed to delete scheduled import' }
  }
}

// Execute Scheduled Import (for manual trigger or cron job)
export async function executeScheduledImport(id: string): Promise<ScheduledImportResult> {
  try {
    const scheduledImport = await prisma.scheduledImport.findUnique({
      where: { id }
    })

    if (!scheduledImport) {
      return { success: false, message: 'Scheduled import not found' }
    }

    if (!scheduledImport.enabled) {
      return { success: false, message: 'Scheduled import is disabled' }
    }

    // Update status to running
    await prisma.scheduledImport.update({
      where: { id },
      data: { 
        status: 'active',
        lastRun: new Date()
      }
    })

    let csvData: string | null = null

    // Fetch data based on source type
    if (!scheduledImport.source) {
      throw new Error('No source configuration found')
    }
    
    const source = scheduledImport.source as unknown as ScheduledImportConfig['source']
    switch (source.type) {
      case 'url':
        csvData = await fetchFromUrl(source)
        break
      case 'sftp':
        csvData = await fetchFromSftp(source)
        break
      case 'api':
        csvData = await fetchFromApi(source)
        break
      default:
        throw new Error(`Unsupported source type: ${source.type}`)
    }

    if (!csvData) {
      throw new Error('No data received from source')
    }

    // Create a temporary file for import
    const blob = new Blob([csvData], { type: 'text/csv' })
    const formData = new FormData()
    formData.append('file', blob, `scheduled-import-${id}.csv`)

    // Execute the import
    const importOptions = scheduledImport.importOptions as unknown as ScheduledImportConfig['importOptions']
    const importResult = await executeCSVImport(
      formData,
      importOptions as UpsertOptions
    )

    // Update scheduled import with results
    const nextRun = calculateNextRun(scheduledImport.schedule as ScheduledImportConfig['schedule'])
    
    if (importResult.success) {
      await prisma.scheduledImport.update({
        where: { id },
        data: {
          status: 'active',
          nextRun,
          errorMessage: null
        }
      })

      // Send success notification if configured
      if (importOptions?.notificationEmails?.length) {
        await sendNotification(
          importOptions.notificationEmails,
          'Import Successful',
          `Scheduled import "${scheduledImport.name}" completed successfully. ${importResult.created} created, ${importResult.updated} updated.`
        )
      }

      return {
        success: true,
        message: `Import completed: ${importResult.created} created, ${importResult.updated} updated`
      }
    } else {
      await prisma.scheduledImport.update({
        where: { id },
        data: {
          status: 'error',
          nextRun,
          errorMessage: importResult.message
        }
      })

      // Send error notification  
      if (importOptions?.notificationEmails?.length) {
        await sendNotification(
          importOptions.notificationEmails,
          'Import Failed',
          `Scheduled import "${scheduledImport.name}" failed: ${importResult.message}`
        )
      }

      return {
        success: false,
        message: importResult.message,
        errors: importResult.errors
      }
    }

  } catch (error) {
    console.error('Error executing scheduled import:', error)

    // Update status to error
    await prisma.scheduledImport.update({
      where: { id },
      data: {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return { success: false, message: 'Failed to execute scheduled import' }
  }
}

// Helper Functions

function calculateNextRun(schedule: ScheduledImportConfig['schedule']): Date {
  const now = new Date()
  const [hours, minutes] = schedule.time.split(':').map(Number)
  
  const nextRun = new Date(now)
  nextRun.setHours(hours, minutes, 0, 0)

  switch (schedule.frequency) {
    case 'daily':
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1)
      }
      break

    case 'weekly':
      const targetDay = schedule.dayOfWeek || 0
      const currentDay = nextRun.getDay()
      let daysUntilTarget = targetDay - currentDay
      
      if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextRun <= now)) {
        daysUntilTarget += 7
      }
      
      nextRun.setDate(nextRun.getDate() + daysUntilTarget)
      break

    case 'monthly':
      const targetDate = schedule.dayOfMonth || 1
      nextRun.setDate(targetDate)
      
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1)
      }
      break
  }

  return nextRun
}

async function fetchFromUrl(source: ScheduledImportConfig['source']): Promise<string | null> {
  if (!source.url) return null

  const headers: Record<string, string> = {
    'Accept': 'text/csv',
    ...source.headers
  }

  if (source.credentials?.username && source.credentials?.password) {
    headers['Authorization'] = `Basic ${btoa(`${source.credentials.username}:${source.credentials.password}`)}`
  } else if (source.credentials?.apiKey) {
    headers['Authorization'] = `Bearer ${source.credentials.apiKey}`
  }

  const response = await fetch(source.url, { headers })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return await response.text()
}

async function fetchFromSftp(_source: ScheduledImportConfig['source']): Promise<string | null> { // eslint-disable-line @typescript-eslint/no-unused-vars -- Placeholder for future SFTP implementation
  // Note: SFTP implementation would require additional dependencies like 'ssh2-sftp-client'
  // For now, this is a placeholder that could be implemented based on specific requirements
  throw new Error('SFTP source not yet implemented')
}

async function fetchFromApi(source: ScheduledImportConfig['source']): Promise<string | null> {
  if (!source.url) return null

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...source.headers
  }

  if (source.credentials?.apiKey) {
    headers['Authorization'] = `Bearer ${source.credentials.apiKey}`
  }

  const response = await fetch(source.url, { 
    method: 'GET',
    headers 
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  
  // Convert JSON to CSV (basic implementation)
  // This would need to be customized based on the API response format
  if (Array.isArray(data)) {
    return jsonToCsv(data)
  }

  throw new Error('API response is not in expected format')
}

function jsonToCsv(data: Record<string, unknown>[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] || ''
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      }).join(',')
    )
  ]

  return csvRows.join('\n')
}

async function sendNotification(emails: string[], subject: string, message: string): Promise<void> {
  // Note: Email implementation would require additional setup (SendGrid, AWS SES, etc.)
  // For now, this is a placeholder that logs the notification
  console.log(`Email notification to ${emails.join(', ')}: ${subject} - ${message}`)
  
  // Could implement actual email sending here:
  // - SendGrid API
  // - AWS SES
  // - Nodemailer with SMTP
  // - Or integrate with company's existing email service
}