'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { ToastContainer } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { checkItemsEvaluationStatus } from '@/lib/actions/evaluations'

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
  AssignmentGrid 
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
  const { toasts, removeToast } = useToast()
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('company')
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [evaluatedItems, setEvaluatedItems] = useState<Record<string, boolean>>({})

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

  const handleSaveNew = () => {
    itemEditorHook.handleSaveNew('department', () => router.refresh())
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


  const getBadgeIcon = (level: string) => {
    switch (level) {
      case 'company':
        return (
          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9zm-6 4h2v2H7v-2zm4 0h2v2h-2v-2z" clipRule="evenodd" />
          </svg>
        )
      case 'department':
        return (
          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
        )
      default:
        return (
          <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  // Combine error states from hooks
  const error = assignmentHook.error || itemEditorHook.error
  const isPending = assignmentHook.isPending || itemEditorHook.isPending

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Desktop-First Professional Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-8xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex items-center justify-between">
            {/* Left Section - Navigation & Title */}
            <div className="flex items-center gap-3 md:gap-6">
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation shadow-sm"
                title={t.common?.back || 'Go back'}
                aria-label={t.common?.back || 'Go back'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-900">
                  {t.assignments.assignmentManager || 'Assignment Manager'}
                </h1>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1 hidden sm:block">
                  {t.assignments.manageOKRsCompetencies || 'Manage OKRs and competencies for your team'}
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

      {/* Tab Navigation */}
      <AssignmentTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Error Display */}
      {error && (
        <div className="max-w-8xl mx-auto px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-red-800">{error}</p>
              </div>
              <div className="ml-auto">
                <button
                  onClick={() => {
                    assignmentHook.setError(null)
                    itemEditorHook.setError(null)
                  }}
                  className="flex items-center justify-center min-w-[32px] min-h-[32px] text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 touch-manipulation"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`max-w-8xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8 min-h-[400px] ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
        
        {/* Company Tab - Read Only */}
        {activeTab === 'company' && (
          <div className="space-y-4 md:space-y-8 animate-in fade-in duration-300">
            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200/60 shadow-sm p-4 md:p-8">
              <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-primary/10 rounded-lg md:rounded-xl flex items-center justify-center">
                  {getBadgeIcon('company')}
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">{t.assignments.companyWideItems || 'Company-Wide Items'}</h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">
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

        {/* Department Tab - Batch Assignment */}
        {activeTab === 'department' && (
          <div className="space-y-4 md:space-y-8 animate-in fade-in duration-300">
            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200/60 shadow-sm p-4 md:p-8">
              <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-green-50 rounded-lg md:rounded-xl flex items-center justify-center">
                  {getBadgeIcon('department')}
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">{t.assignments.departmentLevelAssignments || 'Department-Level Assignments'}</h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">
                    {t.assignments.departmentDescription || 'Create and assign department-specific items'}
                  </p>
                </div>
              </div>

              {/* Create New Section */}
              <div className="mb-4 md:mb-8">
                <BulkActions
                  isPending={isPending}
                  onCreateNew={handleCreateNew}
                />
              </div>
            </div>

            {/* Create New Form */}
            {itemEditorHook.creatingNew && itemEditorHook.editingItem && itemEditorHook.editingItem.id === 'new' && (
              <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200/60 shadow-sm p-4 md:p-8">
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
            
            {/* Employee Selection */}
            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200/60 shadow-sm p-4 md:p-8">
              <EmployeeSelector
                employees={employees}
                evaluationItems={evaluationItems}
                selectedEmployees={selectedEmployees}
                confirmingUnassign={assignmentHook.confirmingUnassign}
                hrConfirmation={assignmentHook.hrConfirmation}
                isPending={isPending}
                userRole={userRole}
                evaluatedItems={evaluatedItems}
                onEmployeeSelection={handleEmployeeSelection}
                onUnassignFromEmployee={assignmentHook.handleUnassignFromEmployee}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onHROverride={assignmentHook.handleHROverride}
                onCancelHRConfirmation={assignmentHook.cancelHRConfirmation}
              />
            </div>

            {/* Department Items */}
            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200/60 shadow-sm p-4 md:p-8">
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

      </main>
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}