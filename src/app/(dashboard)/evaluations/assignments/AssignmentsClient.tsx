'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'

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
  userId,
  userDepartment
}: AssignmentsClientProps) {
  const router = useRouter()
  const { t } = useLanguage()
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('company')
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])

  // Custom hooks
  const assignmentHook = useAssignments(employees)
  const itemEditorHook = useItemEditor()

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
      
      // Check if item is assigned to this manager or their department
      if (item.level === 'department' && item.assignedTo === userDepartment) return true
      if (item.level === 'manager' && item.assignedTo === userId) return true
    }
    
    return false
  }

  const canSetDeadlineForLevel = (level: 'company' | 'department' | 'manager'): boolean => {
    // HR can set deadlines for all levels
    if (userRole === 'hr') return true
    
    // Managers can set deadlines for department and manager level items
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
      itemEditorHook.handleCreateNew(type, 'department')
    }
  }

  const handleSaveNew = () => {
    itemEditorHook.handleSaveNew('department')
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
      <AssignmentTabs activeTab={activeTab} setActiveTab={setActiveTab} />

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
                onClick={() => {
                  assignmentHook.setError(null)
                  itemEditorHook.setError(null)
                }}
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
      <div className={`px-4 py-6 pt-36 min-h-[400px] touch-pan-y ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
        
        {/* Company Tab - Read Only */}
        {activeTab === 'company' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                {getBadgeIcon('company')}
                <h3 className="font-semibold text-blue-900">{t.assignments.companyWideItems}</h3>
              </div>
              <p className="text-sm text-blue-700">
                {t.assignments.companyWideDescription}
              </p>
            </div>
            <AssignmentGrid
              items={filteredItems}
              employees={employees}
              activeTab={activeTab}
              editingItem={itemEditorHook.editingItem}
              newItemType={itemEditorHook.newItemType}
              isPending={isPending}
              selectedEmployees={selectedEmployees}
              confirmingUnassign={assignmentHook.confirmingUnassign}
              canEditDeadline={canEditDeadline}
              getEmployeesWithItem={assignmentHook.getEmployeesWithItem}
              onEditItem={itemEditorHook.handleEditItem}
              onSaveEdit={itemEditorHook.handleSaveEdit}
              onCancelEdit={itemEditorHook.handleCancelEdit}
              onUpdateEditingItem={itemEditorHook.updateEditingItem}
              onBulkAssignment={handleBulkAssignment}
              onUnassignFromEmployee={assignmentHook.handleUnassignFromEmployee}
              onIndividualAssignment={assignmentHook.handleIndividualAssignment}
              employeeHasItem={assignmentHook.employeeHasItem}
            />
          </div>
        )}

        {/* Department Tab - Batch Assignment */}
        {activeTab === 'department' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                {getBadgeIcon('department')}
                <h3 className="font-semibold text-green-900">{t.assignments.departmentLevelAssignments}</h3>
              </div>
              <p className="text-sm text-green-700">
                {t.assignments.departmentDescription}
              </p>
            </div>

            {/* Create New Section */}
            <BulkActions
              selectedEmployeesCount={selectedEmployees.length}
              isPending={isPending}
              onCreateNew={handleCreateNew}
            />
            
            {/* Create New Form */}
            {itemEditorHook.creatingNew && itemEditorHook.editingItem && itemEditorHook.editingItem.id === 'new' && (
              <ItemEditor
                editingItem={itemEditorHook.editingItem}
                newItemType={itemEditorHook.newItemType}
                isCreatingNew={true}
                level="department"
                canSetDeadline={canSetDeadlineForLevel('department')}
                isPending={isPending}
                onUpdateItem={itemEditorHook.updateEditingItem}
                onSave={handleSaveNew}
                onCancel={itemEditorHook.handleCancelNew}
              />
            )}
            
            {/* Employee Selection */}
            <EmployeeSelector
              employees={employees}
              evaluationItems={evaluationItems}
              selectedEmployees={selectedEmployees}
              confirmingUnassign={assignmentHook.confirmingUnassign}
              isPending={isPending}
              onEmployeeSelection={handleEmployeeSelection}
              onUnassignFromEmployee={assignmentHook.handleUnassignFromEmployee}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
            />

            {/* Department Items */}
            <AssignmentGrid
              items={filteredItems}
              employees={employees}
              activeTab={activeTab}
              editingItem={itemEditorHook.editingItem}
              newItemType={itemEditorHook.newItemType}
              isPending={isPending}
              selectedEmployees={selectedEmployees}
              confirmingUnassign={assignmentHook.confirmingUnassign}
              canEditDeadline={canEditDeadline}
              getEmployeesWithItem={assignmentHook.getEmployeesWithItem}
              onEditItem={itemEditorHook.handleEditItem}
              onSaveEdit={itemEditorHook.handleSaveEdit}
              onCancelEdit={itemEditorHook.handleCancelEdit}
              onUpdateEditingItem={itemEditorHook.updateEditingItem}
              onBulkAssignment={handleBulkAssignment}
              onUnassignFromEmployee={assignmentHook.handleUnassignFromEmployee}
              onIndividualAssignment={assignmentHook.handleIndividualAssignment}
              employeeHasItem={assignmentHook.employeeHasItem}
            />
          </div>
        )}

      </div>
    </div>
  )
}