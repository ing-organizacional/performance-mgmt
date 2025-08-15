/**
 * Scheduled Imports Hook
 * 
 * Custom hook for managing scheduled import state, API operations,
 * and form handling with comprehensive error handling and loading states.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/useToast'
import {
  getScheduledImports,
  createScheduledImport,
  updateScheduledImport,
  deleteScheduledImport,
  executeScheduledImport,
  type ScheduledImportConfig
} from '@/lib/actions/scheduled-import'
import type { ScheduledImportDisplay } from '../types'

export function useScheduledImports(onImportComplete?: () => void) {
  const { success, error } = useToast()
  const [scheduledImports, setScheduledImports] = useState<ScheduledImportDisplay[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingImport, setEditingImport] = useState<ScheduledImportConfig | null>(null)
  const loadingRef = useRef(false)

  const [formConfig, setFormConfig] = useState<Partial<ScheduledImportConfig>>({
    name: '',
    description: '',
    schedule: {
      frequency: 'daily',
      time: '09:00',
      timezone: 'UTC',
      dayOfWeek: 1,
      dayOfMonth: 1
    },
    source: {
      type: 'url',
      url: '',
      credentials: {
        username: '',
        password: ''
      }
    },
    importOptions: {
      updateExisting: true,
      createNew: true,
      requireConfirmation: false,
      notificationEmails: []
    },
    enabled: true
  })

  const loadScheduledImports = useCallback(async () => {
    if (loadingRef.current) return
    
    loadingRef.current = true
    setIsLoading(true)
    try {
      const result = await getScheduledImports()
      if (result.success) {
        setScheduledImports(result.imports || [])
      } else {
        error(result.message || 'Failed to load scheduled imports')
      }
    } catch (err) {
      console.error('Error loading scheduled imports:', err)
      error('Failed to load scheduled imports')
    } finally {
      setIsLoading(false)
      loadingRef.current = false
    }
  }, [error])

  const handleCreate = async () => {
    setIsLoading(true)
    try {
      const result = await createScheduledImport(formConfig as Omit<ScheduledImportConfig, 'id' | 'lastRun' | 'nextRun'>)
      if (result.success) {
        success('Scheduled import created successfully')
        resetForm()
        setShowCreateForm(false)
        await loadScheduledImports()
      } else {
        error(result.message || 'Failed to create scheduled import')
      }
    } catch (err) {
      console.error('Error creating scheduled import:', err)
      error('Failed to create scheduled import')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async (id: string, updates: Partial<ScheduledImportConfig>) => {
    try {
      const result = await updateScheduledImport(id, updates)
      if (result.success) {
        success('Scheduled import updated successfully')
        setEditingImport(null)
        resetForm()
        await loadScheduledImports()
      } else {
        error(result.message || 'Failed to update scheduled import')
      }
    } catch (err) {
      console.error('Error updating scheduled import:', err)
      error('Failed to update scheduled import')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return
    }
    try {
      const result = await deleteScheduledImport(id)
      if (result.success) {
        success('Scheduled import deleted successfully')
        await loadScheduledImports()
      } else {
        error(result.message || 'Failed to delete scheduled import')
      }
    } catch (err) {
      console.error('Error deleting scheduled import:', err)
      error('Failed to delete scheduled import')
    }
  }

  const handleExecute = async (id: string, name: string) => {
    if (!confirm(`Execute "${name}" now? This will import data immediately.`)) {
      return
    }
    
    setIsLoading(true)
    try {
      const result = await executeScheduledImport(id)
      if (result.success) {
        success(`Import "${name}" executed successfully`)
        await loadScheduledImports()
        if (onImportComplete) {
          onImportComplete()
        }
      } else {
        error(result.message || `Failed to execute import "${name}"`)
      }
    } catch (err) {
      console.error('Error executing scheduled import:', err)
      error(`Failed to execute import "${name}"`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleEnabled = async (scheduledImport: ScheduledImportDisplay) => {
    await handleUpdate(scheduledImport.id!, { enabled: !scheduledImport.enabled })
  }

  const handleEdit = (importConfig: ScheduledImportConfig) => {
    setEditingImport(importConfig)
    setFormConfig(importConfig)
    setShowCreateForm(false)
  }

  const resetForm = () => {
    setFormConfig({
      name: '',
      description: '',
      schedule: {
        frequency: 'daily',
        time: '09:00',
        timezone: 'UTC',
        dayOfWeek: 1,
        dayOfMonth: 1
      },
      source: {
        type: 'url',
        url: '',
        credentials: {
          username: '',
          password: ''
        }
      },
      importOptions: {
        updateExisting: true,
        createNew: true,
        requireConfirmation: false,
        notificationEmails: []
      },
      enabled: true
    })
    setEditingImport(null)
    setShowCreateForm(false)
  }

  const handleSubmit = async () => {
    if (editingImport) {
      await handleUpdate(editingImport.id!, formConfig)
    } else {
      await handleCreate()
    }
  }

  useEffect(() => {
    loadScheduledImports()
  }, [loadScheduledImports])

  return {
    // State
    scheduledImports,
    isLoading,
    showCreateForm,
    editingImport,
    formConfig,

    // Actions
    setShowCreateForm,
    setFormConfig,
    handleEdit,
    handleDelete,
    handleExecute,
    handleToggleEnabled,
    handleSubmit,
    resetForm,
    loadScheduledImports
  }
}