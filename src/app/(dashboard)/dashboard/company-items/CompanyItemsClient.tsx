'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { ToastContainer } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { createEvaluationItem, updateEvaluationItem, toggleEvaluationItemActive } from '@/lib/actions/evaluations'
import { ItemEditor } from '@/app/(dashboard)/evaluations/assignments/components/ItemEditor'
import type { EditingItem } from '@/app/(dashboard)/evaluations/assignments/types'
import { Building2, Target, Star, ChevronLeft, Edit, Lock, Unlock, AlertTriangle } from 'lucide-react'

interface CompanyEvaluationItem {
  id: string
  title: string
  description: string
  type: 'okr' | 'competency'
  level: 'company'
  createdBy: string
  creatorRole: string
  evaluationDeadline?: string | null
  deadlineSetBy?: string | null
  active: boolean
  createdAt: string
}

interface CompanyItemsClientProps {
  initialItems: CompanyEvaluationItem[]
  aiEnabled: boolean
  userDepartment?: string
}

export default function CompanyItemsClient({ initialItems, aiEnabled, userDepartment }: CompanyItemsClientProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const { toasts, error: showError, success: showSuccess, removeToast } = useToast()
  const [isPending, startTransition] = useTransition()
  
  // Debug: Log AI status
  console.log('🔍 [CompanyItems] AI enabled:', aiEnabled)
  
  const [companyItems, setCompanyItems] = useState<CompanyEvaluationItem[]>(initialItems)
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null)
  const [creatingNew, setCreatingNew] = useState(false)
  const [newItemType, setNewItemType] = useState<'okr' | 'competency'>('okr')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [itemToToggle, setItemToToggle] = useState<CompanyEvaluationItem | null>(null)

  const refreshItems = async () => {
    // Refresh the page to get updated data from server
    router.refresh()
  }

  const onUpdateItem = (updates: Partial<EditingItem>) => {
    if (!editingItem) return
    setEditingItem(prev => prev ? { ...prev, ...updates } : null)
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

  const handleEditItem = (item: CompanyEvaluationItem) => {
    setEditingItem({
      id: item.id,
      title: item.title,
      description: item.description,
      evaluationDeadline: item.evaluationDeadline ? item.evaluationDeadline.slice(0, 10) : ''
    })
  }

  const handleSaveNew = async () => {
    if (!editingItem || !editingItem.title.trim() || !editingItem.description.trim()) return

    // Validate deadline if provided
    if (editingItem.evaluationDeadline) {
      const deadlineDate = new Date(editingItem.evaluationDeadline)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset to start of today
      
      if (deadlineDate <= today) {
        showError(t.companyItems?.errors?.deadlineTomorrowOrLater || 'Deadline must be tomorrow or later.')
        return
      }
    }

    startTransition(async () => {
      try {
        const result = await createEvaluationItem({
          title: editingItem.title,
          description: editingItem.description,
          type: newItemType,
          level: 'company', // Always company level for this page
          evaluationDeadline: editingItem.evaluationDeadline || undefined
        })

        if (result.success) {
          await refreshItems() // Refresh data from server
          setEditingItem(null)
          setCreatingNew(false)
        } else {
          showError(result.error || t.companyItems?.errors?.failedToCreate || 'Failed to create item')
          console.error('Failed to create item:', result.error)
        }
      } catch (error) {
        console.error('Error creating item:', error)
        showError(t.companyItems?.errors?.errorCreating || 'Error creating item')
      }
    })
  }

  const handleSaveEdit = async () => {
    if (!editingItem) return

    // Validate deadline if provided (client-side validation for immediate feedback)
    if (editingItem.evaluationDeadline) {
      const deadlineDate = new Date(editingItem.evaluationDeadline)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset to start of today
      
      if (deadlineDate <= today) {
        showError(t.companyItems?.errors?.deadlineTomorrowOrLater || 'Deadline must be tomorrow or later.')
        return
      }
    }

    startTransition(async () => {
      try {
        const result = await updateEvaluationItem(editingItem.id, {
          title: editingItem.title,
          description: editingItem.description,
          evaluationDeadline: editingItem.evaluationDeadline || null
        })

        if (result.success) {
          await refreshItems() // Refresh data from server
          setEditingItem(null) // Close editing mode
        } else {
          showError(result.error || t.companyItems?.errors?.failedToSave || 'Failed to save item')
          console.error('Failed to save item:', result.error)
        }
      } catch (error) {
        console.error('Error saving item:', error)
        showError(t.companyItems?.errors?.errorSaving || 'Error saving item')
      }
    })
  }

  const handleCancel = () => {
    setEditingItem(null)
    setCreatingNew(false)
  }

  const handleToggleActive = (item: CompanyEvaluationItem) => {
    setItemToToggle(item)
    setShowConfirmModal(true)
  }

  const confirmToggleActive = async () => {
    if (!itemToToggle) return

    try {
      console.log('Toggling item:', itemToToggle.id, 'from', itemToToggle.active, 'to', !itemToToggle.active)
      
      const result = await toggleEvaluationItemActive(itemToToggle.id)
      
      if (result.success) {
        console.log('Toggle successful:', 'message' in result ? result.message : 'Success')
        
        // Optimistically update local state
        setCompanyItems(prev => prev.map(item => 
          item.id === itemToToggle.id 
            ? { ...item, active: !itemToToggle.active }
            : item
        ))
        
        // Refresh from server to ensure consistency
        await refreshItems()
        
        // Show success message if item was deactivated
        if ('message' in result && result.message && result.message.includes('deactivated')) {
          showSuccess(result.message)
        }
      } else {
        showError(result.error || t.companyItems?.errors?.failedToToggleStatus || 'Failed to toggle item status')
        console.error('Failed to toggle item status:', result.error)
      }
    } catch (error) {
      console.error('Error toggling item status:', error)
      showError(t.companyItems?.errors?.errorToggling || 'Error toggling item status')
    } finally {
      setShowConfirmModal(false)
      setItemToToggle(null)
    }
  }

  const cancelToggleActive = () => {
    setShowConfirmModal(false)
    setItemToToggle(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50/20 to-indigo-50/30">
      {/* Desktop-First Professional Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-8xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex items-center justify-between">
            {/* Left Section - Navigation & Title */}
            <div className="flex items-center gap-3 md:gap-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation shadow-sm"
                title={t.common?.back || 'Go back'}
                aria-label={t.common?.back || 'Go back'}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-900">
                  {t.companyItems.title || 'Company Assignments'}
                </h1>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1 hidden sm:block">
                  {companyItems.length} {t.companyItems.subtitle || 'company-wide items'}
                </p>
              </div>
            </div>

            {/* Right Section - Language Switcher */}
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-8xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8 min-h-[400px]">
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
          {/* Info Banner */}
          <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200/60 shadow-sm p-4 md:p-8">
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-primary/10 rounded-lg md:rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900">{t.companyItems.infoTitle || 'Company-Wide Items'}</h3>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">
                  {t.companyItems.infoDescription || 'Manage company-wide OKRs and competencies'}
                </p>
              </div>
            </div>
          </div>

          {/* Create New Section */}
          <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200/60 shadow-sm p-4 md:p-8">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              {t.companyItems.createNewTitle || 'Create New Items'}
            </h4>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => handleCreateNew('okr')}
                className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 min-h-[44px] bg-primary text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 touch-manipulation shadow-sm"
              >
                <Target className="h-4 w-4" />
                <span>{t.companyItems.newCompanyOKR || 'New Company OKR'}</span>
              </button>
              <button
                onClick={() => handleCreateNew('competency')}
                className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 min-h-[44px] bg-amber-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-amber-600 active:scale-95 transition-all duration-150 touch-manipulation shadow-sm"
              >
                <Star className="h-4 w-4" />
                <span>{t.companyItems.newCompanyCompetency || 'New Company Competency'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Create New Form */}
        {creatingNew && editingItem && editingItem.id === 'new' && (
          <div className="mb-4 md:mb-8">
            <ItemEditor
              editingItem={editingItem}
              newItemType={newItemType}
              isCreatingNew={true}
              level="company"
              canSetDeadline={true}
              isPending={isPending}
              aiEnabled={aiEnabled}
              userDepartment={userDepartment}
              onUpdateItem={onUpdateItem}
              onSave={handleSaveNew}
              onCancel={handleCancel}
            />
          </div>
        )}

        {/* Existing Company Items */}
        <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200/60 shadow-sm mt-6 md:mt-8">
          <div className="p-4 md:p-8 border-b border-gray-200">
            <h3 className="text-lg md:text-xl font-bold text-gray-900">
              {t.companyItems.existingItemsTitle || 'Existing Items'} ({companyItems.length})
            </h3>
          </div>
          
          <div className="space-y-0">
            {companyItems.map((item, index) => (
              <div key={item.id} className={`p-4 md:p-6 ${
                index !== companyItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}>
              {editingItem && editingItem.id === item.id ? (
                // Edit Mode
                <ItemEditor
                  editingItem={editingItem}
                  newItemType={item.type}
                  isCreatingNew={false}
                  level="company"
                  canSetDeadline={true}
                  isPending={isPending}
                  aiEnabled={aiEnabled}
                  userDepartment={userDepartment}
                  onUpdateItem={onUpdateItem}
                  onSave={handleSaveEdit}
                  onCancel={handleCancel}
                />
              ) : (
                // View Mode
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 md:gap-4 flex-1">
                      <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 ${
                        item.type === 'okr' ? 'bg-primary/10' : 'bg-amber-100'
                      }`}>
                        {item.type === 'okr' ? 
                          <Target className="w-5 h-5 md:w-6 md:h-6 text-primary" /> : 
                          <Star className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-primary/10 text-primary flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {t.companyItems.companyWide || 'Company-wide'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            item.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {item.active ? t.companyItems?.active || 'Active' : t.companyItems?.inactive || 'Inactive'}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg md:text-xl leading-tight mb-2">{item.title}</h3>
                        <p className="text-gray-600 text-sm md:text-base leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`flex items-center space-x-2 min-w-[44px] min-h-[44px] px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 active:scale-95 touch-manipulation ${
                          item.active 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {item.active ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        <span className="hidden sm:inline">{item.active ? t.companyItems?.deactivate || 'Deactivate' : t.companyItems?.activate || 'Activate'}</span>
                      </button>
                      <button
                        onClick={() => handleEditItem(item)}
                        className="flex items-center space-x-2 min-w-[44px] min-h-[44px] px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 active:scale-95 transition-all duration-150 touch-manipulation"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="hidden sm:inline">{t.common?.edit || 'Edit'}</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-3">
                    {t.companyItems?.createdBy || 'Created by'} {item.createdBy} • {t.companyItems?.appliedToAllEmployees || 'Applied to all employees'}
                  </div>
                </div>
              )}
            </div>
            ))}
            
            {companyItems.length === 0 && (
              <div className="text-center py-12 md:py-16">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Building2 className="h-8 w-8 md:h-10 md:w-10 text-gray-400" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                  {t.companyItems?.noItemsTitle || 'No Company Items Yet'}
                </h3>
                <p className="text-sm md:text-base text-gray-600 max-w-md mx-auto">
                  {t.companyItems?.noItemsDescription || 'Create your first company-wide OKR or competency to get started.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && itemToToggle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl md:rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-200">
            <div className="text-center">
              <div className="mb-6">
                {/* Icon */}
                <div className={`mx-auto flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full mb-4 ${
                  itemToToggle.active 
                    ? 'bg-red-100' 
                    : 'bg-green-100'
                }`}>
                  {itemToToggle.active ? (
                    <Lock className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
                  ) : (
                    <Unlock className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                  )}
                </div>
                
                {/* Title */}
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                  {itemToToggle.active ? t.companyItems?.confirmDeactivate || 'Deactivate' : t.companyItems?.confirmActivate || 'Activate'} {itemToToggle.type === 'okr' ? 'OKR' : t.evaluations?.competency || 'Competency'}?
                </h3>
                
                {/* Item title */}
                <p className="text-sm md:text-base text-gray-600 mb-1">
                  <strong>&quot;{itemToToggle.title}&quot;</strong>
                </p>
              </div>
              
              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  </div>
                  <p className="text-sm text-yellow-800 font-medium">
                    {itemToToggle.active 
                      ? t.companyItems?.deactivateWarning || 'This will remove the item from all employee evaluations.'
                      : t.companyItems?.activateWarning || 'This will add the item to all employee evaluations.'
                    }
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={cancelToggleActive}
                  className="flex-1 px-4 py-3 min-h-[44px] bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 active:scale-95 transition-all duration-150 touch-manipulation"
                >
                  {t.common?.cancel || 'Cancel'}
                </button>
                <button
                  onClick={confirmToggleActive}
                  className={`flex-1 px-4 py-3 min-h-[44px] text-white text-sm font-medium rounded-lg active:scale-95 transition-all duration-150 touch-manipulation ${
                    itemToToggle.active 
                      ? 'bg-red-600 hover:bg-red-700 active:bg-red-800' 
                      : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                  }`}
                >
                  {itemToToggle.active ? t.companyItems?.deactivate || 'Deactivate' : t.companyItems?.activate || 'Activate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}