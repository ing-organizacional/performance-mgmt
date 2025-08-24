import { useLanguage } from '@/contexts/LanguageContext'
import { Target, Star } from 'lucide-react'

interface BulkActionsProps {
  isPending: boolean
  onCreateNew: (type: 'okr' | 'competency') => void
}

export function BulkActions({
  isPending,
  onCreateNew
}: BulkActionsProps) {
  const { t } = useLanguage()

  return (
    <div className="relative">
      {/* Prominent Creation Header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{t.assignments.createNewDepartmentItems}</h3>
        <p className="text-sm text-gray-600">{t.assignments.createAndManageItems}</p>
      </div>

      {/* FAB-style Creation Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
        <button
          onClick={() => onCreateNew('okr')}
          disabled={isPending}
          className="group relative flex items-center justify-center gap-3 px-6 sm:px-8 py-4 sm:py-5 min-h-[56px] bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-xl hover:from-primary/90 hover:to-primary hover:scale-[1.02] active:scale-95 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation shadow-lg hover:shadow-xl disabled:shadow-sm"
        >
          <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors duration-200">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <div className="text-base font-bold">{t.assignments.newOKR}</div>
            <div className="text-xs text-white/80">{t.assignments.create}</div>
          </div>
          {/* Subtle shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300"></div>
        </button>
        
        <button
          onClick={() => onCreateNew('competency')}
          disabled={isPending}
          className="group relative flex items-center justify-center gap-3 px-6 sm:px-8 py-4 sm:py-5 min-h-[56px] bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl hover:from-amber-400 hover:to-amber-500 hover:scale-[1.02] active:scale-95 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation shadow-lg hover:shadow-xl disabled:shadow-sm"
        >
          <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors duration-200">
            <Star className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <div className="text-base font-bold">{t.assignments.newCompetency}</div>
            <div className="text-xs text-white/80">{t.assignments.create}</div>
          </div>
          {/* Subtle shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300"></div>
        </button>
      </div>
    </div>
  )
}