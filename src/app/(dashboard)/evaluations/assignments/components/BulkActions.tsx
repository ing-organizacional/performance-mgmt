import { useLanguage } from '@/contexts/LanguageContext'
import { Target, Star } from 'lucide-react'

interface BulkActionsProps {
  selectedEmployeesCount: number
  isPending: boolean
  onCreateNew: (type: 'okr' | 'competency') => void
}

export function BulkActions({
  selectedEmployeesCount,
  isPending,
  onCreateNew
}: BulkActionsProps) {
  const { t } = useLanguage()

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-3">{t.assignments.createNewDepartmentItems}</h3>
      <div className="flex space-x-3">
        <button
          onClick={() => onCreateNew('okr')}
          disabled={isPending}
          className="flex items-center space-x-2 px-6 py-3 min-h-[44px] bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-150 touch-manipulation"
        >
          <Target className="h-4 w-4 text-white" />
          <span>{t.assignments.newOKR}</span>
        </button>
        <button
          onClick={() => onCreateNew('competency')}
          disabled={isPending}
          className="flex items-center space-x-2 px-6 py-3 min-h-[44px] bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-150 touch-manipulation"
        >
          <Star className="h-4 w-4 text-white" />
          <span>{t.assignments.newCompetency}</span>
        </button>
      </div>
    </div>
  )
}