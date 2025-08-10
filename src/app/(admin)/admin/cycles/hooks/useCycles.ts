'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/useToast'
import { useLanguage } from '@/contexts/LanguageContext'
import { createCycle, updateCycleStatus, deleteCycle } from '@/lib/actions/cycles'

interface PerformanceCycle {
  id: string
  name: string
  status: string
  startDate: string
  endDate: string
  closedBy?: string | null
  closedAt?: string | null
  createdAt: string
  updatedAt: string
  _count: {
    evaluations: number
    evaluationItems: number
    partialAssessments: number
  }
  closedByUser?: {
    name: string
    email: string | null
  } | null
}

export function useCycles() {
  const router = useRouter()
  const { t } = useLanguage()
  const { success, error } = useToast()
  const [isPending, startTransition] = useTransition()
  
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ cycle: PerformanceCycle } | null>(null)

  const handleCreateSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await createCycle(formData)

      if (result.success) {
        success(result.message)
        setShowCreateForm(false)
        router.refresh()
      } else {
        error(result.message)
      }
    })
  }

  const handleStatusUpdate = async (cycleId: string, status: string) => {
    const confirmMessage = status === 'closed' 
      ? t.dashboard.confirmClose
      : status === 'active'
      ? t.dashboard.confirmReopen
      : 'Are you sure you want to update this cycle status?'

    if (!confirm(confirmMessage)) return

    startTransition(async () => {
      const formData = new FormData()
      formData.append('status', status)
      
      const result = await updateCycleStatus(cycleId, formData)
      
      if (result.success) {
        success(result.message)
        router.refresh()
      } else {
        error(result.message)
      }
    })
  }

  const handleDeleteCycle = async (cycleId: string) => {
    if (!showDeleteConfirm) return

    startTransition(async () => {
      const result = await deleteCycle(cycleId)
      
      if (result.success) {
        success(result.message)
        setShowDeleteConfirm(null)
        router.refresh()
      } else {
        error(result.message)
      }
    })
  }

  const handleDeleteClick = (cycle: PerformanceCycle) => {
    setShowDeleteConfirm({ cycle })
  }

  const closeDeleteModal = () => {
    setShowDeleteConfirm(null)
  }

  const openCreateModal = () => {
    setShowCreateForm(true)
  }

  const closeCreateModal = () => {
    setShowCreateForm(false)
  }

  return {
    isPending,
    showCreateForm,
    showDeleteConfirm,
    handleCreateSubmit,
    handleStatusUpdate,
    handleDeleteCycle,
    handleDeleteClick,
    closeDeleteModal,
    openCreateModal,
    closeCreateModal
  }
}