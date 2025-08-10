'use client'

import { ToastContainer } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { CyclesHeader } from './components/CyclesHeader'
import { CyclesList } from './components/CyclesList'
import { CreateCycleModal } from './components/CreateCycleModal'
import { DeleteCycleModal } from './components/DeleteCycleModal'
import { useCycles } from './hooks/useCycles'

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

interface CyclesClientProps {
  cycles: PerformanceCycle[]
}

export default function CyclesClient({ cycles: initialCycles }: CyclesClientProps) {
  const { toasts, removeToast } = useToast()
  const {
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
  } = useCycles()


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <CyclesHeader onCreateClick={openCreateModal} isPending={isPending} />
      
      <CyclesList 
        cycles={initialCycles}
        onStatusUpdate={handleStatusUpdate}
        onDeleteClick={handleDeleteClick}
        isPending={isPending}
      />

      {/* Modals */}
      {showCreateForm && (
        <CreateCycleModal
          onClose={closeCreateModal}
          onSubmit={handleCreateSubmit}
          isPending={isPending}
        />
      )}

      {showDeleteConfirm && (
        <DeleteCycleModal
          cycle={showDeleteConfirm.cycle}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteCycle}
          isPending={isPending}
        />
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}