import { useLanguage } from '@/contexts/LanguageContext'
import type { EvaluationItem, Employee, EditingItem, ActiveTab } from '../types'
import { ItemEditor } from './ItemEditor'
import { Target, Star, User, Edit } from 'lucide-react'

interface AssignmentGridProps {
  items: EvaluationItem[]
  employees: Employee[]
  activeTab: ActiveTab
  editingItem: EditingItem | null
  isPending: boolean
  selectedEmployees: string[]
  confirmingUnassign: string | null
  canEditDeadline: (item: EvaluationItem) => boolean
  getEmployeesWithItem: (itemId: string) => Employee[]
  aiEnabled?: boolean
  onEditItem: (item: EvaluationItem) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onUpdateEditingItem: (updates: Partial<EditingItem>) => void
  onBulkAssignment: (itemId: string) => void
  onUnassignFromEmployee: (itemId: string, employeeId: string) => void
  onIndividualAssignment: (itemId: string, employeeId: string) => void
  employeeHasItem: (employeeId: string, itemId: string) => boolean
}

export function AssignmentGrid({
  items,
  employees,
  activeTab,
  editingItem,
  isPending,
  selectedEmployees,
  confirmingUnassign,
  canEditDeadline,
  getEmployeesWithItem,
  aiEnabled = false,
  onEditItem,
  onSaveEdit,
  onCancelEdit,
  onUpdateEditingItem,
  onBulkAssignment,
  onUnassignFromEmployee,
  onIndividualAssignment,
  employeeHasItem
}: AssignmentGridProps) {
  const { t } = useLanguage()

  const getBadgeStyles = (level: string) => {
    switch (level) {
      case 'company':
        return 'bg-primary/10 text-primary'
      case 'department':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-primary/10 text-primary'
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
        return t.common.department // Fallback to department for any remaining items
    }
  }

  if (activeTab === 'company') {
    return (
      <div className="space-y-3 md:space-y-6">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl md:rounded-2xl border border-gray-200/60 p-3 md:p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            {/* Header Section with Icon and Type */}
            <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
              <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center ${
                item.type === 'okr' ? 'bg-primary/10' : 'bg-amber-50'
              }`}>
                {item.type === 'okr' ? <Target className="h-4 w-4 md:h-6 md:w-6 text-primary" /> : <Star className="h-4 w-4 md:h-6 md:w-6 text-amber-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                  <span className="text-xs md:text-sm font-bold text-blue-700 uppercase tracking-wide">
                    {item.type === 'okr' ? t.evaluations.okr : t.evaluations.competency}
                  </span>
                  <span className={`flex items-center gap-1 md:gap-1.5 text-xs px-2 md:px-3 py-0.5 md:py-1 rounded-full font-medium ${getBadgeStyles(item.level)}`}>
                    {getBadgeIcon(item.level)}
                    <span>{getBadgeLabel(item.level)}</span>
                  </span>
                </div>
                <h3 className="text-sm md:text-lg font-bold text-gray-900 leading-tight">{item.title}</h3>
              </div>
            </div>

            {/* Description */}
            <div className="mb-3 md:mb-4">
              <p className="text-xs md:text-base text-gray-700 leading-relaxed">{item.description}</p>
            </div>

            {/* Footer Info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3 pt-3 md:pt-4 border-t border-gray-100">
              <div className="text-xs md:text-sm text-gray-500">
                <span className="font-medium">{t.common.createdBy}:</span> {item.createdBy}
              </div>
              <div className="inline-flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs">{t.assignments.appliedToAllEmployees}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activeTab === 'department') {
    return (
      <div className="space-y-3 md:space-y-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            {editingItem && editingItem.id === item.id ? (
              <ItemEditor
                editingItem={editingItem}
                newItemType={item.type}
                isCreatingNew={false}
                level="department"
                canSetDeadline={canEditDeadline(item)}
                isPending={isPending}
                aiEnabled={aiEnabled}
                onUpdateItem={onUpdateEditingItem}
                onSave={onSaveEdit}
                onCancel={onCancelEdit}
              />
            ) : (
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 ${
                      item.type === 'okr' ? 'bg-primary/10' : 'bg-amber-50'
                    }`}>
                      {item.type === 'okr' ? <Target className="h-4 w-4 md:h-5 md:w-5 text-primary" /> : <Star className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="mb-1">
                        <span className="text-xs md:text-sm font-bold text-blue-700 uppercase tracking-wide">
                          {item.type === 'okr' ? t.evaluations.okr : t.evaluations.competency}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm md:text-lg text-gray-900 leading-tight mb-1">{item.title}</h3>
                      <div>
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 md:py-1 rounded-full font-medium ${getBadgeStyles(item.level)}`}>
                          {getBadgeIcon(item.level)}
                          <span>{getBadgeLabel(item.level)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onEditItem(item)}
                    disabled={isPending}
                    className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-3 min-h-[44px] bg-gray-100 text-gray-700 text-xs md:text-sm font-medium rounded-lg hover:bg-gray-200 hover:text-gray-900 active:scale-95 active:bg-gray-300 disabled:bg-gray-200 disabled:cursor-not-allowed transition-all duration-150 flex-shrink-0 touch-manipulation"
                  >
                    <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span>{t.common.edit}</span>
                  </button>
                </div>
                
                <p className="text-xs md:text-sm text-gray-600 ml-11 md:ml-14 leading-relaxed">{item.description}</p>
                
                {/* Show current assignments for this item - Compact mobile version */}
                {getEmployeesWithItem(item.id).length > 0 && (
                  <div className="ml-11 md:ml-14 mt-2 md:mt-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                      {t.assignments.currentlyAssignedTo} ({getEmployeesWithItem(item.id).length}):
                    </h4>
                    <div className="flex flex-wrap gap-1 md:gap-2">
                      {getEmployeesWithItem(item.id).map((employee) => (
                        <div key={employee.id} className="inline-flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-2 rounded text-xs bg-green-100 text-green-700 border border-green-200">
                          <User className="h-2.5 w-2.5 md:h-3 md:w-3" />
                          <span className="text-xs">{employee.name}</span>
                          <button
                            onClick={() => onUnassignFromEmployee(item.id, employee.id)}
                            disabled={isPending}
                            className={`flex items-center justify-center w-4 h-4 md:w-5 md:h-5 min-w-[16px] md:min-w-[20px] min-h-[16px] md:min-h-[20px] text-white text-xs rounded-full active:scale-95 transition-all duration-150 touch-manipulation ${
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
                    onClick={() => onBulkAssignment(item.id)}
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
    )
  }

  if (activeTab === 'individual') {
    return (
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
                    <User className="h-5 w-5" />
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
                      const item = items.find(evalItem => evalItem.id === itemId)
                      return item ? (
                        <div key={itemId} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-primary/10 text-primary border border-primary/20">
                          <span>{item.type === 'okr' ? <Target className="h-6 w-6 text-primary" /> : <Star className="h-6 w-6 text-amber-500" />} {item.title.slice(0, 12)}...</span>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              onUnassignFromEmployee(itemId, employee.id)
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
                {items.filter(item => item.level === 'manager').length === 0 ? (
                  <p className="text-sm text-gray-500 italic">{t.companyItems.noItemsDescription}</p>
                ) : (
                  items.filter(item => item.level === 'manager').map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg">{item.type === 'okr' ? <Target className="h-6 w-6 text-primary" /> : <Star className="h-6 w-6 text-amber-500" />}</span>
                          <span className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                            {item.type === 'okr' ? t.evaluations.okr : t.evaluations.competency}
                          </span>
                        </div>
                        <h5 className="font-medium text-gray-900">{item.title}</h5>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                      <button
                        onClick={() => onIndividualAssignment(item.id, employee.id)}
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
    )
  }

  return null
}