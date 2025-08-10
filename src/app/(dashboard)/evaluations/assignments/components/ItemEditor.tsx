import { useLanguage } from '@/contexts/LanguageContext'
import type { EditingItem } from '../types'

interface ItemEditorProps {
  editingItem: EditingItem | null
  newItemType: 'okr' | 'competency'
  isCreatingNew: boolean
  level: 'department' | 'manager'
  canSetDeadline: boolean
  isPending: boolean
  onUpdateItem: (updates: Partial<EditingItem>) => void
  onSave: () => void
  onCancel: () => void
}

export function ItemEditor({
  editingItem,
  newItemType,
  isCreatingNew,
  level,
  canSetDeadline,
  isPending,
  onUpdateItem,
  onSave,
  onCancel
}: ItemEditorProps) {
  const { t } = useLanguage()

  if (!editingItem) return null

  const getBadgeStyles = (itemLevel: string) => {
    switch (itemLevel) {
      case 'department':
        return 'bg-green-100 text-green-700'
      case 'manager':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-blue-100 text-blue-700'
    }
  }

  const getBadgeIcon = (itemLevel: string) => {
    switch (itemLevel) {
      case 'department':
        return '🏬'
      case 'manager':
        return '👤'
      default:
        return '🏢'
    }
  }

  const getBadgeLabel = (itemLevel: string) => {
    switch (itemLevel) {
      case 'department':
        return t.common.department
      case 'manager':
        return t.assignments.individualAssignments
      default:
        return t.common.company
    }
  }

  return (
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
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getBadgeStyles(level)}`}>
              {getBadgeIcon(level)} {getBadgeLabel(level)}
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
            onChange={(e) => onUpdateItem({ title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            placeholder={isCreatingNew ? `${t.common.edit} ${newItemType === 'okr' ? t.evaluations.okr : t.evaluations.competency}...` : "Title"}
            disabled={isPending}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {newItemType === 'okr' ? t.okrs.keyResults : t.companyItems.description}
          </label>
          <textarea
            value={editingItem.description}
            onChange={(e) => onUpdateItem({ description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            rows={3}
            placeholder={isCreatingNew ? `${t.common.edit} ${t.companyItems.description.toLowerCase()}...` : "Description"}
            disabled={isPending}
          />
        </div>
        
        {canSetDeadline && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.assignments.evaluationDeadline}
            </label>
            <input
              type="date"
              value={editingItem.evaluationDeadline || ''}
              onChange={(e) => onUpdateItem({ evaluationDeadline: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              min={new Date().toISOString().slice(0, 10)}
              disabled={isPending}
            />
          </div>
        )}
        
        <div className="flex space-x-3">
          <button
            onClick={onSave}
            disabled={!editingItem.title.trim() || !editingItem.description.trim() || isPending}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <span>✓</span>
            <span>{isPending ? t.common.saving : (isCreatingNew ? t.assignments.create : t.common.save)}</span>
          </button>
          <button
            onClick={onCancel}
            disabled={isPending}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            <span>✕</span>
            <span>{t.common.cancel}</span>
          </button>
        </div>
      </div>
    </div>
  )
}