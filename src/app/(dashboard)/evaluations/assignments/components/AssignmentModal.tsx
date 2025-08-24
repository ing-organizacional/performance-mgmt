import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Target, Star, Users, X, Check, ChevronLeft } from 'lucide-react'

type Employee = {
  id: string
  name: string
  email?: string
  department?: string
}

interface AssignmentModalProps {
  isOpen: boolean
  itemTitle: string
  itemType: 'okr' | 'competency'
  employees: Employee[]
  isPending: boolean
  onCreateOnly: () => void
  onAssignToEmployees: (employeeIds: string[]) => void
  onClose: () => void
}

export function AssignmentModal({
  isOpen,
  itemTitle,
  itemType,
  employees,
  isPending,
  onCreateOnly,
  onAssignToEmployees,
  onClose
}: AssignmentModalProps) {
  const { t } = useLanguage()
  const [step, setStep] = useState<'choice' | 'assignment'>('choice')
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])

  if (!isOpen) return null

  const handleEmployeeToggle = (employeeId: string) => {
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

  const handleAssignClick = () => {
    if (selectedEmployees.length > 0) {
      onAssignToEmployees(selectedEmployees)
    }
  }

  const handleBack = () => {
    setStep('choice')
    setSelectedEmployees([])
  }

  const resetAndClose = () => {
    setStep('choice')
    setSelectedEmployees([])
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200" onClick={resetAndClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 animate-in zoom-in-95 fade-in duration-200 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {step === 'assignment' && (
                <button
                  onClick={handleBack}
                  disabled={isPending}
                  className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 mr-2 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                itemType === 'okr' ? 'bg-primary/10' : 'bg-amber-50'
              }`}>
                {itemType === 'okr' ? 
                  <Target className="w-5 h-5 text-primary" /> : 
                  <Star className="w-5 h-5 text-amber-500" />
                }
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {step === 'choice' 
                    ? `${itemType === 'okr' ? t.assignments.newOKR : t.assignments.newCompetency} ${t.common.created}`
                    : `${t.assignments.assignToTeam}`
                  }
                </h3>
                <p className="text-sm text-gray-600">{itemTitle}</p>
              </div>
            </div>
            <button
              onClick={resetAndClose}
              disabled={isPending}
              className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1">
            {step === 'choice' ? (
              <div className="p-4 md:p-6">
                <h4 className="text-base font-semibold text-gray-900 mb-2">
                  {t.assignments.whatWouldYouLikeToDo}
                </h4>
                <p className="text-sm text-gray-600 mb-6">
                  {t.assignments.chooseNextStepAfterCreation}
                </p>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Create Only Button */}
                  <button
                    onClick={onCreateOnly}
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 hover:text-gray-900 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t.assignments.createOnly}</span>
                  </button>

                  {/* Assign Button */}
                  <button
                    onClick={() => setStep('assignment')}
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation shadow-sm"
                  >
                    <Users className="w-4 h-4" />
                    <span>{t.assignments.assignToTeam}</span>
                  </button>
                </div>

                {/* Footer */}
                <div className="mt-6">
                  <p className="text-xs text-gray-500 text-center">
                    {t.assignments.canAssignLaterIfNeeded}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 md:p-6">
                {/* Selection Controls */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600">
                    {selectedEmployees.length} {t.common.of} {employees.length} {t.common.selected}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAll}
                      disabled={selectedEmployees.length === employees.length}
                      className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                    >
                      {t.common.selectAll}
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      disabled={selectedEmployees.length === 0}
                      className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                    >
                      {t.common.deselectAll}
                    </button>
                  </div>
                </div>

                {/* Employee List */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {employees.map((employee) => (
                    <label
                      key={employee.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors touch-manipulation"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(employee.id)}
                        onChange={() => handleEmployeeToggle(employee.id)}
                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {employee.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {employee.email || employee.id}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Assignment Button */}
                <div className="mt-6">
                  <button
                    onClick={handleAssignClick}
                    disabled={selectedEmployees.length === 0 || isPending}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation shadow-sm"
                  >
                    <Users className="w-4 h-4" />
                    <span>
                      {isPending 
                        ? t.common.saving 
                        : `${t.assignments.assignToSelected} (${selectedEmployees.length})`
                      }
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}