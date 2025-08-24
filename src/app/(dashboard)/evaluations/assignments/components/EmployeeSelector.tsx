import { useLanguage } from '@/contexts/LanguageContext'
import type { Employee, EvaluationItem } from '../types'
import { Target, Star, AlertTriangle, Lock } from 'lucide-react'
import { HROverrideModal } from './HROverrideModal'

interface EmployeeSelectorProps {
  employees: Employee[]
  evaluationItems: EvaluationItem[]
  selectedEmployees: string[]
  confirmingUnassign: string | null
  hrConfirmation: {
    itemId: string
    employeeId: string
    evaluatedEmployees: Array<{
      id: string
      name: string
      rating: number | null
      comment: string
    }>
  } | null
  isPending: boolean
  userRole: string
  evaluatedItems?: Record<string, boolean>
  onEmployeeSelection: (employeeId: string) => void
  onUnassignFromEmployee: (itemId: string, employeeId: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onHROverride: (reason: string) => void
  onCancelHRConfirmation: () => void
}

export function EmployeeSelector({
  employees,
  evaluationItems,
  selectedEmployees,
  confirmingUnassign,
  hrConfirmation,
  isPending,
  userRole,
  evaluatedItems = {},
  onEmployeeSelection,
  onUnassignFromEmployee,
  onSelectAll,
  onDeselectAll,
  onHROverride,
  onCancelHRConfirmation
}: EmployeeSelectorProps) {
  const { t } = useLanguage()

  const allSelected = employees.length > 0 && selectedEmployees.length === employees.length
  const someSelected = selectedEmployees.length > 0 && selectedEmployees.length < employees.length

  // Helper function to check if an item is evaluated for a specific employee
  const isItemEvaluated = (itemId: string, employeeId: string): boolean => {
    const key = `${itemId}-${employeeId}`
    return evaluatedItems[key] || false
  }

  return (
    <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200/60 p-3 md:p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <h3 className="font-semibold text-sm md:text-base text-gray-900">{t.assignments.selectEmployeesForBatch}</h3>
        <div className="flex items-center">
          <span className="text-xs md:text-sm text-gray-600">{selectedEmployees.length} {t.common.selected}</span>
        </div>
      </div>
      
      {/* Select All Checkbox */}
      {employees.length > 1 && (
        <label className="flex items-center space-x-3 md:space-x-4 p-2.5 md:p-3 mb-1.5 md:mb-2 min-h-[56px] md:min-h-[60px] rounded-lg bg-gray-50 border border-gray-200 cursor-pointer transition-all duration-150 touch-manipulation">
          <div className="relative">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={allSelected ? onDeselectAll : onSelectAll}
              className="w-4 h-4 md:w-5 md:h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-all duration-150"
              disabled={isPending}
            />
            {(allSelected || someSelected) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-white text-xs font-bold">{allSelected ? '✓' : '−'}</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm md:text-base text-gray-700">
              {allSelected ? t.common.deselectAll : t.common.selectAll}
            </div>
            <div className="text-xs md:text-sm text-gray-500">
              {employees.length} {t.common.employees}
            </div>
          </div>
        </label>
      )}

      <div className="space-y-1 md:space-y-1.5">
        {employees.map((employee) => (
          <label key={employee.id} className="flex items-center space-x-2.5 md:space-x-3 p-2.5 md:p-3 min-h-[56px] md:min-h-[60px] rounded-lg hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-all duration-150 touch-manipulation">
            <div className="relative flex-shrink-0">
              <input
                type="checkbox"
                checked={selectedEmployees.includes(employee.id)}
                onChange={() => onEmployeeSelection(employee.id)}
                className="w-4 h-4 md:w-5 md:h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-all duration-150"
                disabled={isPending}
              />
              {selectedEmployees.includes(employee.id) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-xs md:text-sm text-gray-900">{employee.name}</div>
              <div className="text-xs text-gray-500 mb-1.5">
                {employee.email || employee.username} • {employee.department}
              </div>
              {/* Show assigned items for this employee */}
              {employee.assignedItems.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {employee.assignedItems.slice(0, 2).map((itemId) => {
                    const item = evaluationItems.find(evalItem => evalItem.id === itemId)
                    const isEvaluated = isItemEvaluated(itemId, employee.id)
                    const isBlocked = isEvaluated && userRole === 'manager'
                    
                    return item ? (
                      <div key={itemId} className={`inline-flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs max-w-full ${
                        isEvaluated 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-primary/10 text-primary border border-primary/20'
                      }`}>
                        <span className="flex items-center gap-1 min-w-0">
                          {isEvaluated && <Lock className="h-3 w-3 flex-shrink-0" />}
                          {item.type === 'okr' ? 
                            <Target className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary flex-shrink-0" /> : 
                            <Star className="h-3 w-3 md:h-3.5 md:w-3.5 text-amber-500 flex-shrink-0" />
                          }
                          <span className="truncate">{item.title.slice(0, 12)}...</span>
                        </span>
                        
                        {!isBlocked && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              onUnassignFromEmployee(itemId, employee.id)
                            }}
                            disabled={isPending}
                            className={`flex items-center justify-center w-3.5 h-3.5 md:w-4 md:h-4 min-w-[14px] md:min-w-[16px] text-white text-xs rounded-full active:scale-95 transition-all duration-150 touch-manipulation ${
                              confirmingUnassign === `${itemId}-${employee.id}`
                                ? 'bg-orange-500 hover:bg-orange-600 animate-pulse'
                                : isEvaluated && userRole === 'hr'
                                ? 'bg-orange-500 hover:bg-orange-600'
                                : 'bg-red-500 hover:bg-red-600'
                            } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={
                              confirmingUnassign === `${itemId}-${employee.id}`
                                ? t.assignments.clickOrangeButtonConfirm
                                : isEvaluated && userRole === 'hr'
                                ? `${t.assignments.hrForceRemove}: "${item.title}"`
                                : `Remove "${item.title}" from ${employee.name}`
                            }
                          >
                            {confirmingUnassign === `${itemId}-${employee.id}` ? '?' : 
                             isEvaluated && userRole === 'hr' ? '⚠️' : '✕'}
                          </button>
                        )}
                        
                        {isBlocked && (
                          <div className="flex items-center justify-center w-3.5 h-3.5 md:w-4 md:h-4 min-w-[14px] md:min-w-[16px] text-gray-400 text-xs">
                            <Lock className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    ) : null
                  })}
                  {employee.assignedItems.length > 2 && (
                    <span className="inline-flex items-center px-1.5 md:px-2 py-0.5 md:py-1 rounded text-xs bg-gray-100 text-gray-600">
                      +{employee.assignedItems.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
            {/* Show assignment count only on desktop when there are no visible badges, or always on desktop */}
            <div className="hidden md:flex text-xs text-gray-500 text-right flex-shrink-0 flex-col">
              <span className="font-medium text-sm md:text-base">{employee.assignedItems.length}</span>
              <div className="text-xs leading-tight">{t.assignments.itemsAssigned}</div>
            </div>
          </label>
        ))}
      </div>
      {selectedEmployees.length > 0 && (
        <div className="mt-3 md:mt-4 p-2.5 md:p-3 bg-blue-50 rounded-lg">
          <p className="text-xs md:text-sm text-blue-700 font-medium">
            {selectedEmployees.length} {t.assignments.employeesSelected}
          </p>
        </div>
      )}
      {confirmingUnassign && (
        <div className="mt-3 md:mt-4 p-2.5 md:p-3 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-xs md:text-sm text-orange-700 font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {t.assignments.clickOrangeButtonConfirm}
          </p>
        </div>
      )}

      {/* Manager Help Text for Evaluated Items */}
      {userRole === 'manager' && employees.some(emp => 
        emp.assignedItems.some(itemId => isItemEvaluated(itemId, emp.id))
      ) && (
        <div className="mt-3 md:mt-4 p-2.5 md:p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs md:text-sm text-blue-700 font-medium flex items-center gap-2">
            <Lock className="h-4 w-4 flex-shrink-0" />
            {t.assignments.evaluatedItemsProtected}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {t.assignments.contactHRForAssistance}
          </p>
        </div>
      )}

      {/* HR Override Modal */}
      {hrConfirmation && (
        <HROverrideModal
          isOpen={true}
          itemTitle={evaluationItems.find(item => item.id === hrConfirmation.itemId)?.title || 'Unknown Item'}
          evaluatedEmployees={hrConfirmation.evaluatedEmployees}
          onConfirm={onHROverride}
          onCancel={onCancelHRConfirmation}
          isPending={isPending}
        />
      )}
    </div>
  )
}