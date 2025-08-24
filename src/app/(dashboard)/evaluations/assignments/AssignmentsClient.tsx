'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { ToastContainer } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { checkItemsEvaluationStatus } from '@/lib/actions/evaluations'
import { ClipboardList, Users, Building2, UserCheck, ArrowLeft, AlertCircle, X, Lightbulb } from 'lucide-react'

// Import types
import type { AssignmentsClientProps, ActiveTab } from './types'

// Import custom hooks
import { useAssignments, useItemEditor } from './hooks'

// Import components
import { 
  AssignmentTabs, 
  EmployeeSelector, 
  ItemEditor, 
  BulkActions, 
  AssignmentGrid,
  AssignmentModal
} from './components'

export default function AssignmentsClient({
  evaluationItems,
  employees,
  userRole,
  userName,
  userDepartment,
  aiEnabled = false
}: AssignmentsClientProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const { toasts, success, error: showError, removeToast } = useToast()
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('company')
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [evaluatedItems, setEvaluatedItems] = useState<Record<string, boolean>>({})
  
  // Enhanced UX state
  const [departmentView, setDepartmentView] = useState<'items' | 'employees'>('items') // Default to items view as requested
  
  // Assignment modal state
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [createdItem, setCreatedItem] = useState<{
    id: string
    title: string
    type: 'okr' | 'competency'
  } | null>(null)

  // Custom hooks
  const assignmentHook = useAssignments(employees)
  const itemEditorHook = useItemEditor()

  // Fetch evaluation status for all items and employees
  useEffect(() => {
    const fetchEvaluationStatus = async () => {
      try {
        const employeeIds = employees.map(emp => emp.id)
        const result = await checkItemsEvaluationStatus(employeeIds)
        if (result.success && result.evaluatedItems) {
          setEvaluatedItems(result.evaluatedItems)
        }
      } catch (error) {
        console.error('Failed to fetch evaluation status:', error)
      }
    }

    if (employees.length > 0) {
      fetchEvaluationStatus()
    }
  }, [employees])

  // Helper functions for permissions
  const canEditDeadline = (item: typeof evaluationItems[0]): boolean => {
    // HR can edit deadlines for all items
    if (userRole === 'hr') return true
    
    // Managers can edit deadlines for items they created or manage
    if (userRole === 'manager') {
      // Company-level items can only be edited by HR
      if (item.level === 'company') return false
      
      // Check if manager created this item
      if (item.createdBy === userName) return true
      
      // Check if item is assigned to this manager's department
      if (item.level === 'department' && item.assignedTo === userDepartment) return true
    }
    
    return false
  }

  const canSetDeadlineForLevel = (level: 'company' | 'department'): boolean => {
    // HR can set deadlines for all levels
    if (userRole === 'hr') return true
    
    // Managers can set deadlines for department level items
    if (userRole === 'manager') {
      return level !== 'company'
    }
    
    return false
  }

  // Helper function to translate error messages from hooks
  const translateError = (error: string): string => {
    const errorTranslations: Record<string, string> = {
      'All selected employees already have this item assigned.': t.assignments.allEmployeesAlreadyAssigned,
      'Failed to assign items': t.assignments.failedToAssignItems,
      'Failed to unassign item': t.assignments.failedToUnassignItem,
      'Failed to override unassignment': t.assignments.failedToOverrideUnassignment,
      'Failed to create item': t.assignments.assignmentFailed
    }
    
    return errorTranslations[error] || error
  }

  // Event handlers
  const handleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const handleSelectAll = () => {
    setSelectedEmployees(employees.map(emp => emp.id))
  }

  const handleDeselectAll = () => {
    setSelectedEmployees([])
  }

  const handleBulkAssignment = (itemId: string) => {
    assignmentHook.handleBulkAssignment(itemId, selectedEmployees, () => {
      setSelectedEmployees([]) // Clear selection on success
    })
  }

  const handleCreateNew = (type: 'okr' | 'competency') => {
    if (activeTab === 'department') {
      itemEditorHook.handleCreateNew(type)
    }
  }

  // Enhanced save flow - create item and show assignment modal
  const handleSaveNew = () => {
    const editingItem = itemEditorHook.editingItem
    if (editingItem) {
      // Save the item and show assignment modal
      itemEditorHook.handleSaveNew('department', () => {
        // Store item details for modal (we'll get ID from the created item list after refresh)
        setCreatedItem({
          id: 'temp', // We'll use the title to find the actual item after creation
          title: editingItem.title,
          type: itemEditorHook.newItemType || 'okr'
        })
        
        router.refresh()
        setShowAssignmentModal(true)
      })
    }
  }

  // Modal handlers
  const handleCreateOnly = () => {
    setShowAssignmentModal(false)
    setCreatedItem(null)
    // Stay in current view
  }

  const handleAssignToEmployees = async (employeeIds: string[]) => {
    if (!createdItem) return
    
    try {
      // Find the actual item ID by title and type from the current items list
      const actualItem = evaluationItems.find(item => 
        item.title === createdItem.title && 
        item.type === createdItem.type &&
        item.level === 'department'
      )
      
      if (!actualItem) {
        showError(t.assignments.itemNotFound)
        return
      }
      
      // Perform bulk assignment for the created item
      await assignmentHook.handleBulkAssignment(actualItem.id, employeeIds)
      
      // Show success message
      success(
        `${createdItem.title} ${t.assignments.assignmentSuccess} ${employeeIds.length} ${t.common.employees}`
      )
      
      // Close modal and reset
      setShowAssignmentModal(false)
      setCreatedItem(null)
      
      // Refresh data
      router.refresh()
    } catch (err) {
      console.error('Assignment error:', err)
      showError(
        t.assignments.assignmentFailed
      )
    }
  }

  const handleCloseModal = () => {
    setShowAssignmentModal(false)
    setCreatedItem(null)
  }

  const filteredItems = evaluationItems.filter(item => {
    if (activeTab === 'company') {
      return item.level === 'company'
    }
    
    if (activeTab === 'department') {
      // For all managers (including HR) in Department tab, show:
      // 1. Items they created (level: 'department')
      // 2. Department-level items for their department (level: 'department' and assignedTo matches their department)
      if (userRole === 'manager' || userRole === 'hr') {
        return (item.level === 'department' && item.createdBy === userName) ||
               (item.level === 'department' && item.assignedTo === userDepartment)
      }
    }
    
    return false
  })

  // Calculate counts for toggle labels
  const myItemsCount = filteredItems.length
  const myTeamCount = employees.length


  const getBadgeIcon = (level: string) => {
    switch (level) {
      case 'company':
        return <Building2 className="w-6 h-6 text-blue-600" />
      case 'department':
        return <ClipboardList className="w-6 h-6 text-green-600" />
      default:
        return <UserCheck className="w-6 h-6 text-yellow-600" />
    }
  }

  // Combine error states from hooks
  const hookError = assignmentHook.error || itemEditorHook.error
  const isPending = assignmentHook.isPending || itemEditorHook.isPending

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Compact Professional Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-8xl mx-auto px-3 md:px-4 lg:px-6 py-2 md:py-3">
          <div className="flex items-center justify-between">
            {/* Left Section - Navigation & Title */}
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center min-w-[36px] min-h-[36px] md:min-w-[40px] md:min-h-[40px] bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation shadow-sm"
                title={t.common?.back || 'Go back'}
                aria-label={t.common?.back || 'Go back'}
              >
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              
              <div className="min-w-0">
                <h1 className="text-base md:text-lg lg:text-xl font-bold text-gray-900">
                  {t.assignments.assignmentManager || 'Assignment Manager'}
                </h1>
                <p className="text-xs text-gray-600 hidden sm:block">
                  {t.assignments.manageOKRsCompetencies || 'Manage OKRs and competencies for your team'}
                </p>
              </div>
            </div>

            {/* Right Section - Language Switcher */}
            <div className="flex items-center">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <AssignmentTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Enhanced Toggle for Department View */}
      {activeTab === 'department' && (
        <div className="sticky top-[140px] z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
          <div className="max-w-8xl mx-auto px-3 md:px-4 lg:px-6 py-2 md:py-3">
            <div className="flex justify-center">
              <div className="inline-flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setDepartmentView('items')}
                  className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    departmentView === 'items'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>{t.assignments.myItems} ({myItemsCount})</span>
                </button>
                <button
                  onClick={() => setDepartmentView('employees')}
                  className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    departmentView === 'employees'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>{t.assignments.myTeam} ({myTeamCount})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {hookError && (
        <div className="max-w-8xl mx-auto px-3 md:px-4 lg:px-6 mt-2">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{translateError(hookError)}</p>
              </div>
              <div className="ml-auto">
                <button
                  onClick={() => {
                    assignmentHook.setError(null)
                    itemEditorHook.setError(null)
                  }}
                  className="flex items-center justify-center min-w-[28px] min-h-[28px] text-red-400 hover:text-red-600 hover:bg-red-100 rounded-md transition-all duration-200 touch-manipulation"
                >
                  <span className="sr-only">Dismiss</span>
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`max-w-8xl mx-auto px-3 md:px-4 lg:px-6 py-3 md:py-4 min-h-[300px] ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
        
        {/* Company Tab - Read Only */}
        {activeTab === 'company' && (
          <div className="space-y-3 md:space-y-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-lg md:rounded-xl border border-gray-200/60 shadow-sm p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-primary/10 rounded-md md:rounded-lg flex items-center justify-center">
                  {getBadgeIcon('company')}
                </div>
                <div>
                  <h3 className="text-sm md:text-base lg:text-lg font-bold text-gray-900">{t.assignments.companyWideItems || 'Company-Wide Items'}</h3>
                  <p className="text-xs text-gray-600 hidden sm:block">
                    {t.assignments.companyWideDescription || 'Manage company-wide OKRs and competencies'}
                  </p>
                </div>
              </div>
              <AssignmentGrid
                items={filteredItems}
                employees={employees}
                activeTab={activeTab}
                editingItem={itemEditorHook.editingItem}
                isPending={isPending}
                selectedEmployees={selectedEmployees}
                confirmingUnassign={assignmentHook.confirmingUnassign}
                canEditDeadline={canEditDeadline}
                getEmployeesWithItem={assignmentHook.getEmployeesWithItem}
                aiEnabled={aiEnabled}
                userDepartment={userDepartment}
                onEditItem={itemEditorHook.handleEditItem}
                onSaveEdit={() => itemEditorHook.handleSaveEdit(() => router.refresh())}
                onCancelEdit={itemEditorHook.handleCancelEdit}
                onUpdateEditingItem={itemEditorHook.updateEditingItem}
                onBulkAssignment={handleBulkAssignment}
                onUnassignFromEmployee={assignmentHook.handleUnassignFromEmployee}
                onIndividualAssignment={assignmentHook.handleIndividualAssignment}
                employeeHasItem={assignmentHook.employeeHasItem}
              />
            </div>
          </div>
        )}

        {/* Department Tab - Toggle View */}
        {activeTab === 'department' && (
          <div className="space-y-3 md:space-y-4 animate-in fade-in duration-300">
            
            {/* My Items View - Show creation and item management */}
            {departmentView === 'items' && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                {/* Prominent Creation Section */}
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/30 rounded-lg md:rounded-xl border border-blue-200/50 shadow-sm p-4 md:p-6">
                  <div className="flex items-center justify-center gap-2 md:gap-3 mb-4 md:mb-6">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      {getBadgeIcon('department')}
                    </div>
                    <div className="text-center">
                      <h3 className="text-base md:text-lg lg:text-xl font-bold text-gray-900">{t.assignments.myItems}</h3>
                      <p className="text-xs md:text-sm text-gray-600">
                        {t.assignments.createAndManageItems || 'Create and manage your department items'}
                      </p>
                    </div>
                  </div>

                  <BulkActions
                    isPending={isPending}
                    onCreateNew={handleCreateNew}
                  />
                </div>

                {/* Create New Form */}
                {itemEditorHook.creatingNew && itemEditorHook.editingItem && itemEditorHook.editingItem.id === 'new' && (
                  <div className="bg-white rounded-lg md:rounded-xl border border-gray-200/60 shadow-sm p-3 md:p-4">
                    <ItemEditor
                      editingItem={itemEditorHook.editingItem}
                      newItemType={itemEditorHook.newItemType}
                      isCreatingNew={true}
                      level="department"
                      canSetDeadline={canSetDeadlineForLevel('department')}
                      isPending={isPending}
                      aiEnabled={aiEnabled}
                      userDepartment={userDepartment}
                      onUpdateItem={itemEditorHook.updateEditingItem}
                      onSave={handleSaveNew}
                      onCancel={itemEditorHook.handleCancelNew}
                    />
                  </div>
                )}

                {/* Department Items Grid */}
                <div className="bg-white rounded-lg md:rounded-xl border border-gray-200/60 shadow-sm p-3 md:p-4">
                  {/* Helpful hint when no employees selected */}
                  {selectedEmployees.length === 0 && filteredItems.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700 text-center flex items-center justify-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        {t.assignments.myTeam} • {t.assignments.manageTeamAssignments}
                      </p>
                    </div>
                  )}
                  
                  <AssignmentGrid
                    items={filteredItems}
                    employees={employees}
                    activeTab={activeTab}
                    editingItem={itemEditorHook.editingItem}
                    isPending={isPending}
                    selectedEmployees={selectedEmployees}
                    confirmingUnassign={assignmentHook.confirmingUnassign}
                    canEditDeadline={canEditDeadline}
                    getEmployeesWithItem={assignmentHook.getEmployeesWithItem}
                    aiEnabled={aiEnabled}
                    userDepartment={userDepartment}
                    departmentView={departmentView}
                    onEditItem={itemEditorHook.handleEditItem}
                    onSaveEdit={() => itemEditorHook.handleSaveEdit(() => router.refresh())}
                    onCancelEdit={itemEditorHook.handleCancelEdit}
                    onUpdateEditingItem={itemEditorHook.updateEditingItem}
                    onBulkAssignment={handleBulkAssignment}
                    onUnassignFromEmployee={assignmentHook.handleUnassignFromEmployee}
                    onIndividualAssignment={assignmentHook.handleIndividualAssignment}
                    employeeHasItem={assignmentHook.employeeHasItem}
                  />
                </div>
              </div>
            )}

            {/* My Team View - Show employee assignment management */}
            {departmentView === 'employees' && (
              <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="bg-white rounded-lg md:rounded-xl border border-gray-200/60 shadow-sm p-3 md:p-4">
                  <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-50 rounded-md md:rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm md:text-base lg:text-lg font-bold text-gray-900">{t.assignments.myTeam}</h3>
                      <p className="text-xs text-gray-600 hidden sm:block">
                        {t.assignments.manageTeamAssignments || 'Manage assignments for your team members'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Employee Selection and Assignment */}
                <div className="bg-white rounded-lg md:rounded-xl border border-gray-200/60 shadow-sm p-3 md:p-4">
                  <EmployeeSelector
                    employees={employees}
                    evaluationItems={evaluationItems}
                    selectedEmployees={selectedEmployees}
                    confirmingUnassign={assignmentHook.confirmingUnassign}
                    hrConfirmation={assignmentHook.hrConfirmation}
                    isPending={isPending}
                    userRole={userRole}
                    evaluatedItems={evaluatedItems}
                    activeTab={activeTab}
                    onEmployeeSelection={handleEmployeeSelection}
                    onUnassignFromEmployee={assignmentHook.handleUnassignFromEmployee}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                    onHROverride={assignmentHook.handleHROverride}
                    onCancelHRConfirmation={assignmentHook.cancelHRConfirmation}
                  />
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Assignment Confirmation Modal */}
      <AssignmentModal
        isOpen={showAssignmentModal}
        itemTitle={createdItem?.title || ''}
        itemType={createdItem?.type || 'okr'}
        employees={employees}
        isPending={isPending}
        onCreateOnly={handleCreateOnly}
        onAssignToEmployees={handleAssignToEmployees}
        onClose={handleCloseModal}
      />
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}