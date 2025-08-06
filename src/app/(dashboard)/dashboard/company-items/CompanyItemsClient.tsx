'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'

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

interface EditingItem {
  id: string
  title: string
  description: string
  evaluationDeadline?: string
}

interface CompanyItemsClientProps {
  initialItems: CompanyEvaluationItem[]
}

export default function CompanyItemsClient({ initialItems }: CompanyItemsClientProps) {
  const router = useRouter()
  const { t } = useLanguage()
  
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
      evaluationDeadline: item.evaluationDeadline ? item.evaluationDeadline.slice(0, 16) : ''
    })
  }

  const handleSaveNew = async () => {
    if (!editingItem || !editingItem.title.trim() || !editingItem.description.trim()) return

    // Validate deadline if provided
    if (editingItem.evaluationDeadline) {
      const deadlineDate = new Date(editingItem.evaluationDeadline)
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000)
      
      if (deadlineDate <= oneHourFromNow) {
        alert('Deadline must be at least 1 hour in the future.')
        return
      }
    }

    try {
      const response = await fetch('/api/evaluation-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingItem.title,
          description: editingItem.description,
          type: newItemType,
          level: 'company', // Always company level for this page
          evaluationDeadline: editingItem.evaluationDeadline || null
        })
      })

      if (response.ok) {
        await refreshItems() // Refresh data from server
        setEditingItem(null)
        setCreatingNew(false)
      } else {
        console.error('Failed to create item')
      }
    } catch (error) {
      console.error('Error creating item:', error)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingItem) return

    // Validate deadline if provided
    if (editingItem.evaluationDeadline) {
      const deadlineDate = new Date(editingItem.evaluationDeadline)
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000)
      
      if (deadlineDate <= oneHourFromNow) {
        alert('Deadline must be at least 1 hour in the future.')
        return
      }
    }

    try {
      const response = await fetch(`/api/evaluation-items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingItem.title,
          description: editingItem.description,
          evaluationDeadline: editingItem.evaluationDeadline || null
        })
      })

      if (response.ok) {
        await refreshItems() // Refresh data from server
        setEditingItem(null) // Close editing mode
      } else {
        console.error('Failed to save item')
      }
    } catch (error) {
      console.error('Error saving item:', error)
    }
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
      
      const response = await fetch(`/api/evaluation-items/${itemToToggle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active: !itemToToggle.active
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('API response:', result)
        
        // Update the local state with the actual response data
        if (result.success && result.data) {
          setCompanyItems(prev => prev.map(item => 
            item.id === itemToToggle.id 
              ? { ...item, active: result.data.active }
              : item
          ))
        }
        
        // Also refresh from server to ensure consistency
        await refreshItems()
      } else {
        const errorData = await response.json()
        console.error('Failed to toggle item status:', errorData)
      }
    } catch (error) {
      console.error('Error toggling item status:', error)
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-20">
        <div className="px-4 py-3">
          {/* Title Section */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-gray-900 truncate">{t.companyItems.title}</h1>
                <p className="text-xs text-gray-500">
                  {companyItems.length} {t.companyItems.subtitle}
                </p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 pt-20">
        {/* Info Banner */}
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 shadow-sm mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xl">🏢</span>
            <h3 className="font-semibold text-purple-900">{t.companyItems.infoTitle}</h3>
          </div>
          <p className="text-sm text-purple-700">
            {t.companyItems.infoDescription}
          </p>
        </div>

        {/* Create New Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-4">
          <h3 className="font-semibold text-gray-900 mb-3">{t.companyItems.createNewTitle}</h3>
          <div className="flex space-x-3">
            <button
              onClick={() => handleCreateNew('okr')}
              className="flex items-center space-x-2 px-6 py-3 min-h-[44px] bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:scale-95 active:bg-blue-800 transition-all duration-150 touch-manipulation"
            >
              <span>🎯</span>
              <span>{t.companyItems.newCompanyOKR}</span>
            </button>
            <button
              onClick={() => handleCreateNew('competency')}
              className="flex items-center space-x-2 px-6 py-3 min-h-[44px] bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 active:scale-95 active:bg-purple-800 transition-all duration-150 touch-manipulation"
            >
              <span>⭐</span>
              <span>{t.companyItems.newCompanyCompetency}</span>
            </button>
          </div>
        </div>

        {/* Create New Form */}
        {creatingNew && editingItem && editingItem.id === 'new' && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-2xl">
                  {newItemType === 'okr' ? '🎯' : '⭐'}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                    {newItemType === 'okr' ? t.companyItems.companyOKR : t.companyItems.companyCompetency}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-purple-100 text-purple-700">
                    🏢 {t.companyItems.companyWide}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {newItemType === 'okr' ? t.companyItems.objective : t.companyItems.competencyName}
                </label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({
                    ...editingItem,
                    title: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter title..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {newItemType === 'okr' ? t.companyItems.keyResults : t.companyItems.description}
                </label>
                <textarea
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({
                    ...editingItem,
                    description: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  rows={3}
                  placeholder="Enter description..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.assignments.evaluationDeadline}
                </label>
                <input
                  type="datetime-local"
                  value={editingItem.evaluationDeadline}
                  onChange={(e) => setEditingItem({
                    ...editingItem,
                    evaluationDeadline: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveNew}
                  disabled={!editingItem.title.trim() || !editingItem.description.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <span>✓</span>
                  <span>{t.assignments.create}</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <span>✕</span>
                  <span>{t.common.cancelButton}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Company Items */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">
              {t.companyItems.existingItemsTitle} ({companyItems.length})
            </h3>
          </div>
          
          <div className="space-y-1">
            {companyItems.map((item, index) => (
              <div key={item.id} className={`p-4 ${
                index !== companyItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}>
              {editingItem && editingItem.id === item.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">
                      {item.type === 'okr' ? '🎯' : '⭐'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                        {item.type === 'okr' ? t.companyItems.companyOKR : t.companyItems.companyCompetency}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-purple-100 text-purple-700">
                        🏢 {t.companyItems.companyWide}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {item.type === 'okr' ? t.companyItems.objective : t.companyItems.competencyName}
                    </label>
                    <input
                      type="text"
                      value={editingItem.title}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        title: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {item.type === 'okr' ? t.companyItems.keyResults : t.companyItems.description}
                    </label>
                    <textarea
                      value={editingItem.description}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        description: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.assignments.evaluationDeadline}
                    </label>
                    <input
                      type="datetime-local"
                      value={editingItem.evaluationDeadline}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        evaluationDeadline: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <span>✓</span>
                      <span>{t.common.saveButton}</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <span>✕</span>
                      <span>{t.common.cancelButton}</span>
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <span className="text-2xl">
                        {item.type === 'okr' ? '🎯' : '⭐'}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                            {item.type === 'okr' ? t.companyItems.companyOKR : t.companyItems.companyCompetency}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-purple-100 text-purple-700">
                            🏢 {t.companyItems.companyWide}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            item.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {item.active ? t.companyItems.active : t.companyItems.inactive}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg leading-tight">{item.title}</h3>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                          item.active 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        <span>{item.active ? '🔒' : '🔓'}</span>
                        <span>{item.active ? t.companyItems.deactivate : t.companyItems.activate}</span>
                      </button>
                      <button
                        onClick={() => handleEditItem(item)}
                        className="flex items-center space-x-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 active:scale-95 transition-all duration-150"
                      >
                        <span>✏️</span>
                        <span>{t.common.editButton}</span>
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm ml-11 leading-relaxed">{item.description}</p>
                  
                  <div className="ml-11 text-xs text-gray-500">
                    {t.companyItems.createdBy} {item.createdBy} • {t.companyItems.appliedToAllEmployees}
                  </div>
                </div>
              )}
            </div>
            ))}
            
            {companyItems.length === 0 && (
              <div className="text-center py-12">
                <span className="text-4xl mb-4 block">🏢</span>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t.companyItems.noItemsTitle}
                </h3>
                <p className="text-sm text-gray-600">
                  {t.companyItems.noItemsDescription}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && itemToToggle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-200">
            <div className="text-center">
              <div className="mb-6">
                {/* Icon */}
                <div className={`mx-auto flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
                  itemToToggle.active 
                    ? 'bg-red-100' 
                    : 'bg-green-100'
                }`}>
                  {itemToToggle.active ? (
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                
                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {itemToToggle.active ? t.companyItems.confirmDeactivate : t.companyItems.confirmActivate} {itemToToggle.type === 'okr' ? 'OKR' : t.evaluations.competency}?
                </h3>
                
                {/* Item title */}
                <p className="text-sm text-gray-600 mb-1">
                  <strong>&quot;{itemToToggle.title}&quot;</strong>
                </p>
              </div>
              
              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="text-sm text-yellow-800 font-medium">
                    {itemToToggle.active 
                      ? t.companyItems.deactivateWarning
                      : t.companyItems.activateWarning
                    }
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={cancelToggleActive}
                  className="flex-1 px-4 py-3 min-h-[44px] bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 active:scale-95 transition-all duration-150 touch-manipulation"
                >
                  {t.common.cancelButton}
                </button>
                <button
                  onClick={confirmToggleActive}
                  className={`flex-1 px-4 py-3 min-h-[44px] text-white text-sm font-medium rounded-lg active:scale-95 transition-all duration-150 touch-manipulation ${
                    itemToToggle.active 
                      ? 'bg-red-600 hover:bg-red-700 active:bg-red-800' 
                      : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                  }`}
                >
                  {itemToToggle.active ? t.companyItems.deactivate : t.companyItems.activate}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}