import { useLanguage } from '@/contexts/LanguageContext'
import type { Employee, EvaluationItem } from '../types'

interface EmployeeSelectorProps {
  employees: Employee[]
  evaluationItems: EvaluationItem[]
  selectedEmployees: string[]
  confirmingUnassign: string | null
  isPending: boolean
  onEmployeeSelection: (employeeId: string) => void
  onUnassignFromEmployee: (itemId: string, employeeId: string) => void
}

export function EmployeeSelector({
  employees,
  evaluationItems,
  selectedEmployees,
  confirmingUnassign,
  isPending,
  onEmployeeSelection,
  onUnassignFromEmployee
}: EmployeeSelectorProps) {
  const { t } = useLanguage()

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-3">{t.assignments.selectEmployeesForBatch}</h3>
      <div className="space-y-2">
        {employees.map((employee) => (
          <label key={employee.id} className="flex items-center space-x-4 p-4 min-h-[60px] rounded-lg hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-all duration-150 touch-manipulation">
            <div className="relative">
              <input
                type="checkbox"
                checked={selectedEmployees.includes(employee.id)}
                onChange={() => onEmployeeSelection(employee.id)}
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
  )
}