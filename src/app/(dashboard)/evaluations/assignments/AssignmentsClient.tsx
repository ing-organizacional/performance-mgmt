'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { useSwipe } from '@/hooks/useSwipe'
import { 
  assignItemsToEmployees, 
  unassignItemsFromEmployees, 
  createEvaluationItem, 
  updateEvaluationItem 
} from '@/lib/actions/evaluations'

interface EvaluationItem {
  id: string
  title: string
  description: string
  type: 'okr' | 'competency'
  level: 'company' | 'department' | 'manager'
  createdBy: string
  creatorRole: string
  assignedTo?: string | null
  evaluationDeadline?: string | null
  deadlineSetBy?: string | null
  deadlineSetByRole?: string | null
}

interface Employee {
  id: string
  name: string
  email?: string
  username?: string
  department?: string
  assignedItems: string[]
}

interface EditingItem {
  id: string
  title: string
  description: string
  evaluationDeadline?: string
}

type ActiveTab = 'company' | 'department' | 'individual'

interface AssignmentsClientProps {
  evaluationItems: EvaluationItem[]
  employees: Employee[]
  userRole: string
  userName: string
  userId: string
  userDepartment?: string
}

export default function AssignmentsClient({
  evaluationItems,
  employees,
  userRole,
  userName,
  userId,
  userDepartment
}: AssignmentsClientProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [isPending, startTransition] = useTransition()
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('company')
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null)
  const [creatingNew, setCreatingNew] = useState(false)
  const [newItemType, setNewItemType] = useState<'okr' | 'competency'>('okr')
  const [confirmingUnassign, setConfirmingUnassign] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Helper function to check if current user can edit deadlines for an item
  const canEditDeadline = (item: EvaluationItem): boolean => {
    // HR can edit deadlines for all items
    if (userRole === 'hr') return true
    
    // Managers can edit deadlines for items they created or manage
    if (userRole === 'manager') {
      // Company-level items can only be edited by HR
      if (item.level === 'company') return false
      
      // Check if manager created this item
      if (item.createdBy === userName) return true
      
      // Check if item is assigned to this manager or their department
      if (item.level === 'department' && item.assignedTo === userDepartment) return true
      if (item.level === 'manager' && item.assignedTo === userId) return true
    }
    
    return false
  }

  // Helper function to check if current user can set deadlines for new items at a given level
  const canSetDeadlineForLevel = (level: 'company' | 'department' | 'manager'): boolean => {
    // HR can set deadlines for all levels
    if (userRole === 'hr') return true
    
    // Managers can set deadlines for department and manager level items
    if (userRole === 'manager') {
      return level !== 'company'
    }
    
    return false
  }

  // Tab navigation with swipe support
  const tabs: ActiveTab[] = ['company', 'department', 'individual']
  
  const handleSwipeLeft = () => {
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1])
      // Haptic feedback for mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    }
  }

  const handleSwipeRight = () => {
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1])
      // Haptic feedback for mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    }
  }

  const { elementRef } = useSwipe({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight
  }, {
    threshold: 50,
    preventDefaultTouchmoveEvent: true
  })

  const handleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  // Helper function to check if an employee already has a specific item assigned
  const employeeHasItem = (employeeId: string, itemId: string): boolean => {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee ? employee.assignedItems.includes(itemId) : false
  }

  // Helper function to get employees who already have this item
  const getEmployeesWithItem = (itemId: string): Employee[] => {
    return employees.filter(employee => employee.assignedItems.includes(itemId))
  }

  // Helper function to get employees who can be assigned (don't already have the item)
  const getEligibleEmployees = (itemId: string): string[] => {
    return selectedEmployees.filter(employeeId => !employeeHasItem(employeeId, itemId))
  }

  const handleBulkAssignment = async (itemId: string) => {
    const eligibleEmployees = getEligibleEmployees(itemId)
    
    if (eligibleEmployees.length === 0) {
      setError('All selected employees already have this item assigned.')
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await assignItemsToEmployees(itemId, eligibleEmployees)
      if (!result.success) {
        setError(result.error || 'Failed to assign items')
      } else {
        setSelectedEmployees([]) // Clear selection on success
      }
    })
  }

  const handleUnassignFromEmployee = async (itemId: string, employeeId: string) => {
    const confirmKey = `${itemId}-${employeeId}`
    
    if (confirmingUnassign === confirmKey) {
      // Actually perform the unassignment
      setError(null)
      startTransition(async () => {
        const result = await unassignItemsFromEmployees(itemId, [employeeId])
        if (!result.success) {
          setError(result.error || 'Failed to unassign item')
        }
        setConfirmingUnassign(null)
      })
    } else {
      // Set confirmation state
      setConfirmingUnassign(confirmKey)
      // Auto-reset after 3 seconds
      setTimeout(() => {
        if (confirmingUnassign === confirmKey) {
          setConfirmingUnassign(null)
        }
      }, 3000)
    }
  }

  const handleSaveIndividualItem = async () => {
    if (!editingItem || !editingItem.title.trim() || !editingItem.description.trim()) return

    setError(null)
    startTransition(async () => {
      const result = await createEvaluationItem({
        title: editingItem.title,
        description: editingItem.description,
        type: newItemType,
        level: 'manager',
        evaluationDeadline: editingItem.evaluationDeadline || undefined
      })

      if (!result.success) {
        setError(result.error || 'Failed to create item')
      } else {
        setEditingItem(null)
        setCreatingNew(false)
      }
    })
  }

  const handleIndividualAssignment = async (itemId: string, employeeId: string) => {
    if (employeeHasItem(employeeId, itemId)) {
      return // Already assigned
    }

    setError(null)
    startTransition(async () => {
      const result = await assignItemsToEmployees(itemId, [employeeId])
      if (!result.success) {
        setError(result.error || 'Failed to assign item')
      }
    })
  }

  const handleEditItem = (item: EvaluationItem) => {
    setEditingItem({
      id: item.id,
      title: item.title,
      description: item.description,
      evaluationDeadline: item.evaluationDeadline ? item.evaluationDeadline.slice(0, 10) : ''
    })
  }

  const handleSaveEdit = async () => {
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

  const handleSaveNew = async () => {
    if (!editingItem || !editingItem.title.trim() || !editingItem.description.trim()) return

    setError(null)
    startTransition(async () => {
      const result = await createEvaluationItem({
        title: editingItem.title,
        description: editingItem.description,
        type: newItemType,
        level: 'department',
        evaluationDeadline: editingItem.evaluationDeadline || undefined
      })

      if (!result.success) {
        setError(result.error || 'Failed to create item')
      } else {
        setEditingItem(null)
        setCreatingNew(false)
      }
    })
  }

  const handleCancelNew = () => {
    setEditingItem(null)
    setCreatingNew(false)
  }

  const filteredItems = evaluationItems.filter(item => item.level === activeTab)

  const getBadgeStyles = (level: string) => {
    switch (level) {
      case 'company':
        return 'bg-purple-100 text-purple-700'
      case 'department':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-blue-100 text-blue-700'
    }
  }

  const getBadgeIcon = (level: string) => {
    switch (level) {
      case 'company':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9zm-6 4h2v2H7v-2zm4 0h2v2h-2v-2z" clipRule="evenodd" />
          </svg>
        )
      case 'department':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  const getBadgeLabel = (level: string) => {
    switch (level) {
      case 'company':
        return t.common.company
      case 'department':
        return t.common.department
      default:
        return t.common.manager
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-20">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-900">
                {t.assignments.assignmentManager}
              </h1>
              <p className="text-sm text-gray-600">
                {t.assignments.manageOKRsCompetencies}
              </p>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 fixed top-20 left-0 right-0 z-10">
        <div className="px-4">
          <div className="flex space-x-1 relative">
            {/* Swipe indicator */}
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 opacity-50 animate-pulse">
              ← Swipe to navigate →
            </div>
            
            {/* Tab position indicator */}
            <div 
              className="absolute bottom-0 h-0.5 bg-blue-600 transition-all duration-300 ease-out"
              style={{
                width: '33.333%',
                left: `${tabs.indexOf(activeTab) * 33.333}%`
              }}
            />
            
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-2 min-h-[44px] text-xs font-medium rounded-t-lg transition-all duration-300 active:scale-95 touch-manipulation ${
                  activeTab === tab
                    ? 'bg-blue-50 text-blue-700 shadow-sm transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <div className="flex flex-col items-center justify-center space-y-0.5">
                  {getBadgeIcon(tab)}
                  <span className="capitalize text-center leading-tight">{getBadgeLabel(tab)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed top-32 left-4 right-4 z-30 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div ref={elementRef as React.RefObject<HTMLDivElement>} className={`px-4 py-6 pt-36 min-h-[400px] touch-pan-y ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Company Tab - Read Only */}
        {activeTab === 'company' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9zm-6 4h2v2H7v-2zm4 0h2v2h-2v-2z" clipRule="evenodd" />
                </svg>
                <h3 className="font-semibold text-blue-900">{t.assignments.companyWideItems}</h3>
              </div>
              <p className="text-sm text-blue-700">
                {t.assignments.companyWideDescription}
              </p>
            </div>

            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {item.type === 'okr' ? '🎯' : '⭐'}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                          {item.type === 'okr' ? t.evaluations.okr : t.evaluations.competency}
                        </span>
                        <span className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full font-medium ${getBadgeStyles(item.level)}`}>
                          {getBadgeIcon(item.level)}
                          <span>{getBadgeLabel(item.level)}</span>
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    <div>{t.common.createdBy} {item.createdBy}</div>
                    <div className="text-green-600 font-medium mt-1">{t.assignments.appliedToAllEmployees}</div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm ml-11">{item.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Department Tab - Batch Assignment */}
        {activeTab === 'department' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                <h3 className="font-semibold text-green-900">{t.assignments.departmentLevelAssignments}</h3>
              </div>
              <p className="text-sm text-green-700">
                {t.assignments.departmentDescription}
              </p>
            </div>

            {/* Create New Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">{t.assignments.createNewDepartmentItems}</h3>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleCreateNew('okr')}
                  disabled={isPending}
                  className="flex items-center space-x-2 px-6 py-3 min-h-[44px] bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:scale-95 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-150 touch-manipulation"
                >
                  <span>🎯</span>
                  <span>{t.assignments.newOKR}</span>
                </button>
                <button
                  onClick={() => handleCreateNew('competency')}
                  disabled={isPending}
                  className="flex items-center space-x-2 px-6 py-3 min-h-[44px] bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 active:scale-95 active:bg-purple-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-150 touch-manipulation"
                >
                  <span>⭐</span>
                  <span>{t.assignments.newCompetency}</span>
                </button>
              </div>
            </div>
            
            {/* Create New Form */}
            {creatingNew && editingItem && editingItem.id === 'new' && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">
                      {newItemType === 'okr' ? '🎯' : '⭐'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                        {newItemType === 'okr' ? t.evaluations.okr : t.evaluations.competency}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700">
                        🏬 {t.common.department}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {newItemType === 'okr' ? t.okrs.objective : t.evaluations.competency}
                    </label>
                    <input
                      type="text"
                      value={editingItem.title}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        title: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder={`${t.common.edit} ${newItemType === 'okr' ? t.evaluations.okr : t.evaluations.competency}...`}
                      disabled={isPending}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {newItemType === 'okr' ? t.okrs.keyResults : t.companyItems.description}
                    </label>
                    <textarea
                      value={editingItem.description}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        description: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      rows={3}
                      placeholder={`${t.common.edit} ${t.companyItems.description.toLowerCase()}...`}
                      disabled={isPending}
                    />
                  </div>
                  
                  {canSetDeadlineForLevel('department') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.assignments.evaluationDeadline}
                      </label>
                      <input
                        type="date"
                        value={editingItem.evaluationDeadline}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          evaluationDeadline: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        min={new Date().toISOString().slice(0, 10)}
                        disabled={isPending}
                      />
                    </div>
                  )}
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveNew}
                      disabled={!editingItem.title.trim() || !editingItem.description.trim() || isPending}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <span>✓</span>
                      <span>{isPending ? t.common.saving : t.assignments.create}</span>
                    </button>
                    <button
                      onClick={handleCancelNew}
                      disabled={isPending}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <span>✕</span>
                      <span>{t.common.cancel}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Employee Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">{t.assignments.selectEmployeesForBatch}</h3>
              <div className="space-y-2">
                {employees.map((employee) => (
                  <label key={employee.id} className="flex items-center space-x-4 p-4 min-h-[60px] rounded-lg hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-all duration-150 touch-manipulation">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(employee.id)}
                        onChange={() => handleEmployeeSelection(employee.id)}
                        className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-all duration-150"
                        disabled={isPending}
                      />
                      {selectedEmployees.includes(employee.id) && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{employee.name}</div>
                      <div className="text-sm text-gray-500">
                        {employee.email || employee.username} • {employee.department}
                      </div>
                      {/* Show assigned items for this employee */}
                      {employee.assignedItems.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {employee.assignedItems.slice(0, 3).map((itemId) => {
                            const item = evaluationItems.find(evalItem => evalItem.id === itemId)
                            return item ? (
                              <div key={itemId} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-blue-100 text-blue-700 border border-blue-200">
                                <span>{item.type === 'okr' ? '🎯' : '⭐'} {item.title.slice(0, 12)}...</span>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleUnassignFromEmployee(itemId, employee.id)
                                  }}
                                  disabled={isPending}
                                  className={`flex items-center justify-center w-4 h-4 min-w-[16px] text-white text-xs rounded-full active:scale-95 transition-all duration-150 touch-manipulation ${
                                    confirmingUnassign === `${itemId}-${employee.id}`
                                      ? 'bg-orange-500 hover:bg-orange-600 animate-pulse'
                                      : 'bg-red-500 hover:bg-red-600'
                                  } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  title={
                                    confirmingUnassign === `${itemId}-${employee.id}`
                                      ? 'Click again to confirm removal'
                                      : `Remove "${item.title}" from ${employee.name}`
                                  }
                                >
                                  {confirmingUnassign === `${itemId}-${employee.id}` ? '?' : '✕'}
                                </button>
                              </div>
                            ) : null
                          })}
                          {employee.assignedItems.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                              +{employee.assignedItems.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {employee.assignedItems.length} {t.assignments.itemsAssigned}
                    </div>
                  </label>
                ))}
              </div>
              {selectedEmployees.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">
                    {selectedEmployees.length} {t.assignments.employeesSelected}
                  </p>
                </div>
              )}
              {confirmingUnassign && (
                <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-700 font-medium">
                    🤔 Click the orange button again to confirm removal
                  </p>
                </div>
              )}
            </div>

            {/* Department Items */}
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  {editingItem && editingItem.id === item.id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <span className="text-2xl">
                          {item.type === 'okr' ? '🎯' : '⭐'}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                            {item.type === 'okr' ? t.evaluations.okr : t.evaluations.competency}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getBadgeStyles(item.level)}`}>
                            <span className="flex items-center space-x-1">
                              {getBadgeIcon(item.level)}
                              <span>{getBadgeLabel(item.level)}</span>
                            </span>
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {item.type === 'okr' ? t.okrs.objective : t.evaluations.competency}
                        </label>
                        <input
                          type="text"
                          value={editingItem.title}
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            title: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                          placeholder="Title"
                          disabled={isPending}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {item.type === 'okr' ? t.okrs.keyResults : t.companyItems.description}
                        </label>
                        <textarea
                          value={editingItem.description}
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            description: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                          rows={3}
                          placeholder="Description"
                          disabled={isPending}
                        />
                      </div>
                      
                      {canEditDeadline(item) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t.assignments.evaluationDeadline}
                          </label>
                          <input
                            type="date"
                            value={editingItem.evaluationDeadline}
                            onChange={(e) => setEditingItem({
                              ...editingItem,
                              evaluationDeadline: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            min={new Date().toISOString().slice(0, 10)}
                            disabled={isPending}
                          />
                        </div>
                      )}
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={handleSaveEdit}
                          disabled={isPending}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          <span>✓</span>
                          <span>{isPending ? t.common.saving : t.common.save}</span>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isPending}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          <span>✕</span>
                          <span>{t.common.cancel}</span>
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
                                {item.type === 'okr' ? t.evaluations.okr : t.evaluations.competency}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getBadgeStyles(item.level)}`}>
                                <span className="flex items-center space-x-1">
                                  {getBadgeIcon(item.level)}
                                  <span>{getBadgeLabel(item.level)}</span>
                                </span>
                              </span>
                            </div>
                            <h3 className="font-semibold text-gray-900 text-lg leading-tight">{item.title}</h3>
                          </div>
                        </div>
                        <button
                          onClick={() => handleEditItem(item)}
                          disabled={isPending}
                          className="flex items-center space-x-1 px-4 py-3 min-h-[44px] bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 active:scale-95 active:bg-gray-300 disabled:bg-gray-200 disabled:cursor-not-allowed transition-all duration-150 flex-shrink-0 touch-manipulation"
                        >
                          <span>✏️</span>
                          <span>{t.common.edit}</span>
                        </button>
                      </div>
                      
                      <p className="text-gray-600 text-sm ml-11 leading-relaxed">{item.description}</p>
                      
                      {/* Show current assignments for this item */}
                      {getEmployeesWithItem(item.id).length > 0 && (
                        <div className="ml-11 mt-3 p-3 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            {t.assignments.currentlyAssignedTo} ({getEmployeesWithItem(item.id).length}):
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {getEmployeesWithItem(item.id).map((employee) => (
                              <div key={employee.id} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-green-100 text-green-700 border border-green-200">
                                <span>👤 {employee.name}</span>
                                <button
                                  onClick={() => handleUnassignFromEmployee(item.id, employee.id)}
                                  disabled={isPending}
                                  className={`flex items-center justify-center w-5 h-5 min-w-[20px] min-h-[20px] text-white text-xs rounded-full active:scale-95 transition-all duration-150 touch-manipulation ${
                                    confirmingUnassign === `${item.id}-${employee.id}`
                                      ? 'bg-orange-500 hover:bg-orange-600 animate-pulse'
                                      : 'bg-red-500 hover:bg-red-600'
                                  } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  title={
                                    confirmingUnassign === `${item.id}-${employee.id}`
                                      ? 'Click again to confirm removal'
                                      : `Remove from ${employee.name}`
                                  }
                                >
                                  {confirmingUnassign === `${item.id}-${employee.id}` ? '?' : '✕'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="ml-11 mt-3">
                        <button
                          onClick={() => handleBulkAssignment(item.id)}
                          disabled={selectedEmployees.length === 0 || isPending}
                          className="flex items-center space-x-2 px-6 py-3 min-h-[44px] bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:scale-95 active:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-150 touch-manipulation shadow-sm"
                        >
                          <span>➕</span>
                          <span>{isPending ? t.common.saving : t.assignments.assignToSelected}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Individual Tab - Employee-Specific Assignment */}
        {activeTab === 'individual' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <h3 className="font-semibold text-yellow-900">{t.assignments.individualAssignments}</h3>
              </div>
              <p className="text-sm text-yellow-700">
                {t.assignments.individualDescription}
              </p>
            </div>

            {/* Create New Individual Items Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">{t.assignments.createNewDepartmentItems}</h3>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setNewItemType('okr')
                    setCreatingNew(true)
                    setEditingItem({
                      id: 'new-individual',
                      title: '',
                      description: '',
                      evaluationDeadline: ''
                    })
                  }}
                  disabled={isPending}
                  className="flex items-center space-x-2 px-6 py-3 min-h-[44px] bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:scale-95 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-150 touch-manipulation"
                >
                  <span>🎯</span>
                  <span>{t.assignments.newOKR}</span>
                </button>
                <button
                  onClick={() => {
                    setNewItemType('competency')
                    setCreatingNew(true)
                    setEditingItem({
                      id: 'new-individual',
                      title: '',
                      description: '',
                      evaluationDeadline: ''
                    })
                  }}
                  disabled={isPending}
                  className="flex items-center space-x-2 px-6 py-3 min-h-[44px] bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 active:scale-95 active:bg-purple-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-150 touch-manipulation"
                >
                  <span>⭐</span>
                  <span>{t.assignments.newCompetency}</span>
                </button>
              </div>
            </div>

            {/* Create New Individual Item Form */}
            {creatingNew && editingItem && editingItem.id === 'new-individual' && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">
                      {newItemType === 'okr' ? '🎯' : '⭐'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                        {newItemType === 'okr' ? t.evaluations.okr : t.evaluations.competency}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700">
                        👤 {t.assignments.individualAssignments}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {newItemType === 'okr' ? t.okrs.objective : t.evaluations.competency}
                    </label>
                    <input
                      type="text"
                      value={editingItem.title}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        title: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder={`${t.common.edit} ${newItemType === 'okr' ? t.evaluations.okr : t.evaluations.competency}...`}
                      disabled={isPending}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {newItemType === 'okr' ? t.okrs.keyResults : t.companyItems.description}
                    </label>
                    <textarea
                      value={editingItem.description}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        description: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      rows={3}
                      placeholder={`${t.common.edit} ${t.companyItems.description.toLowerCase()}...`}
                      disabled={isPending}
                    />
                  </div>
                  
                  {canSetDeadlineForLevel('manager') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.assignments.evaluationDeadline}
                      </label>
                      <input
                        type="date"
                        value={editingItem.evaluationDeadline}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          evaluationDeadline: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        min={new Date().toISOString().slice(0, 10)}
                        disabled={isPending}
                      />
                    </div>
                  )}
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleSaveIndividualItem()}
                      disabled={!editingItem.title.trim() || !editingItem.description.trim() || isPending}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <span>✓</span>
                      <span>{isPending ? t.common.saving : t.assignments.create}</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingItem(null)
                        setCreatingNew(false)
                      }}
                      disabled={isPending}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <span>✕</span>
                      <span>{t.common.cancel}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Employee List for Individual Assignment */}
            <div className="space-y-4">
              {employees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>{t.users.noUsersFound}</p>
                </div>
              ) : (
                employees.map((employee) => (
                <div key={employee.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-lg">👤</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                        <p className="text-sm text-gray-500">
                          {employee.email || employee.username} • {employee.department}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {employee.assignedItems.length} {t.assignments.itemsAssigned}
                    </div>
                  </div>

                  {/* Show current assignments for this employee */}
                  {employee.assignedItems.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        {t.assignments.itemsAssigned} ({employee.assignedItems.length}):
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {employee.assignedItems.map((itemId) => {
                          const item = evaluationItems.find(evalItem => evalItem.id === itemId)
                          return item ? (
                            <div key={itemId} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-blue-100 text-blue-700 border border-blue-200">
                              <span>{item.type === 'okr' ? '🎯' : '⭐'} {item.title.slice(0, 12)}...</span>
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleUnassignFromEmployee(itemId, employee.id)
                                }}
                                disabled={isPending}
                                className={`flex items-center justify-center w-4 h-4 min-w-[16px] text-white text-xs rounded-full active:scale-95 transition-all duration-150 touch-manipulation ${
                                  confirmingUnassign === `${itemId}-${employee.id}`
                                    ? 'bg-orange-500 hover:bg-orange-600 animate-pulse'
                                    : 'bg-red-500 hover:bg-red-600'
                                } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={
                                  confirmingUnassign === `${itemId}-${employee.id}`
                                    ? t.common.yes
                                    : `${t.common.delete} "${item.title}"`
                                }
                              >
                                {confirmingUnassign === `${itemId}-${employee.id}` ? '?' : '✕'}
                              </button>
                            </div>
                          ) : null
                        })}
                      </div>
                    </div>
                  )}

                  {/* Individual Items for Assignment */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">{t.assignments.selectEmployees}:</h4>
                    {filteredItems.filter(item => item.level === 'manager').length === 0 ? (
                      <p className="text-sm text-gray-500 italic">{t.companyItems.noItemsDescription}</p>
                    ) : (
                      filteredItems.filter(item => item.level === 'manager').map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-lg">{item.type === 'okr' ? '🎯' : '⭐'}</span>
                              <span className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                                {item.type === 'okr' ? t.evaluations.okr : t.evaluations.competency}
                              </span>
                            </div>
                            <h5 className="font-medium text-gray-900">{item.title}</h5>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                          <button
                            onClick={() => handleIndividualAssignment(item.id, employee.id)}
                            disabled={employeeHasItem(employee.id, item.id) || isPending}
                            className={`flex items-center space-x-2 px-4 py-2 min-h-[44px] text-sm font-medium rounded-lg transition-all duration-150 touch-manipulation ${
                              employeeHasItem(employee.id, item.id)
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
                            } ${isPending ? 'opacity-50' : ''}`}
                          >
                            <span>{employeeHasItem(employee.id, item.id) ? '✓' : '➕'}</span>
                            <span>{employeeHasItem(employee.id, item.id) ? t.status.completed : (isPending ? t.common.saving : t.assignments.assignToSelected.split(' ')[0])}</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}