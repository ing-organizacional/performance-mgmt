import { useState, useTransition } from 'react'
import { createEvaluationItem, updateEvaluationItem } from '@/lib/actions/evaluations'
import type { EditingItem, EvaluationItem } from '../types'

export function useItemEditor() {
  const [isPending, startTransition] = useTransition()
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null)
  const [creatingNew, setCreatingNew] = useState(false)
  const [newItemType, setNewItemType] = useState<'okr' | 'competency'>('okr')
  const [error, setError] = useState<string | null>(null)

  const handleEditItem = (item: EvaluationItem) => {
    setEditingItem({
      id: item.id,
      title: item.title,
      description: item.description,
      evaluationDeadline: item.evaluationDeadline ? item.evaluationDeadline.slice(0, 10) : ''
    })
  }

  const handleSaveEdit = async (onSuccess?: () => void) => {
    if (!editingItem) return

    setError(null)
    startTransition(async () => {
      const result = await updateEvaluationItem(editingItem.id, {
        title: editingItem.title,
        description: editingItem.description,
        evaluationDeadline: editingItem.evaluationDeadline || undefined
      })

      if (!result.success) {
        setError(result.error || 'Failed to save item')
      } else {
        setEditingItem(null)
        onSuccess?.()
      }
    })
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
  }

  const handleCreateNew = (type: 'okr' | 'competency') => {
    setNewItemType(type)
    setCreatingNew(true)
    setEditingItem({
      id: 'new',
      title: '',
      description: '',
      evaluationDeadline: ''
    })
  }

  const handleSaveNew = async (level: 'department' = 'department', onSuccess?: () => void) => {
    if (!editingItem || !editingItem.title.trim() || !editingItem.description.trim()) return

    setError(null)
    startTransition(async () => {
      const result = await createEvaluationItem({
        title: editingItem.title,
        description: editingItem.description,
        type: newItemType,
        level,
        evaluationDeadline: editingItem.evaluationDeadline || undefined
      })

      if (!result.success) {
        setError(result.error || 'Failed to create item')
      } else {
        setEditingItem(null)
        setCreatingNew(false)
        onSuccess?.()
      }
    })
  }

  const handleCancelNew = () => {
    setEditingItem(null)
    setCreatingNew(false)
  }

  const updateEditingItem = (updates: Partial<EditingItem>) => {
    if (editingItem) {
      setEditingItem({ ...editingItem, ...updates })
    }
  }

  return {
    isPending,
    error,
    setError,
    editingItem,
    creatingNew,
    newItemType,
    handleEditItem,
    handleSaveEdit,
    handleCancelEdit,
    handleCreateNew,
    handleSaveNew,
    handleCancelNew,
    updateEditingItem
  }
}