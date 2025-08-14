import { useLanguage } from '@/contexts/LanguageContext'
import type { EditingItem } from '../types'
import { Building2, User, Target, Star, Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { improveTextWithAI } from '../actions'
import { useState, useTransition } from 'react'
import { useToast } from '@/hooks/useToast'

interface ItemEditorProps {
  editingItem: EditingItem | null
  newItemType: 'okr' | 'competency'
  isCreatingNew: boolean
  level: 'department' | 'manager'
  canSetDeadline: boolean
  isPending: boolean
  aiEnabled?: boolean // Feature flag for AI functionality
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
  aiEnabled = false,
  onUpdateItem,
  onSave,
  onCancel
}: ItemEditorProps) {
  const { t } = useLanguage()
  const { success, error } = useToast()
  const [aiPending, startAITransition] = useTransition()
  const [improvingField, setImprovingField] = useState<'title' | 'description' | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)


  if (!editingItem) return null

  // Handle AI text improvement
  const handleImproveText = (field: 'title' | 'description') => {
    if (!aiEnabled || !editingItem) return

    const text = field === 'title' ? editingItem.title : editingItem.description
    if (!text.trim()) return

    setImprovingField(field)
    setAiError(null) // Clear previous errors
    
    startAITransition(async () => {
      try {
        const result = await improveTextWithAI({
          text: text.trim(),
          type: field === 'title' 
            ? (newItemType === 'okr' ? 'objective' : 'competency')
            : 'key-result',
          context: field === 'description' ? editingItem.title.trim() : undefined
        })

        if (result.success && result.improvedText) {
          onUpdateItem({ [field]: result.improvedText })
          setAiError(null) // Clear error on success
          success(t.common.aiImprovementSuccess)
        } else {
          const errorMessage = result.error || 'Failed to improve text'
          setAiError(errorMessage)
          error(errorMessage)
        }
      } catch (err) {
        console.error('AI improvement error:', err)
        const errorMessage = 'Unexpected error occurred. Please try again.'
        setAiError(errorMessage)
        error(errorMessage)
      } finally {
        setImprovingField(null)
      }
    })
  }

  const getBadgeStyles = (itemLevel: string) => {
    switch (itemLevel) {
      case 'department':
        return 'bg-green-100 text-green-700'
      case 'manager':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-primary/10 text-primary'
    }
  }

  const getBadgeIcon = (itemLevel: string) => {
    switch (itemLevel) {
      case 'department':
        return <Building2 className="h-4 w-4" />
      case 'manager':
        return <User className="h-4 w-4" />
      default:
        return <Building2 className="h-4 w-4" />
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
            {newItemType === 'okr' ? <Target className="h-6 w-6 text-primary" /> : <Star className="h-6 w-6 text-amber-500" />}
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-primary uppercase tracking-wide">
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
          <div className="flex gap-2">
            <input
              type="text"
              value={editingItem.title}
              onChange={(e) => onUpdateItem({ title: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder={isCreatingNew ? `${t.common.edit} ${newItemType === 'okr' ? t.evaluations.okr : t.evaluations.competency}...` : "Title"}
              disabled={isPending || aiPending}
            />
            {aiEnabled && editingItem.title.trim() && (
              <button
                onClick={() => handleImproveText('title')}
                disabled={isPending || aiPending || improvingField === 'title'}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] px-2.5 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 hover:text-blue-700 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed active:scale-95 transition-all duration-150 touch-manipulation border border-blue-200 hover:border-blue-300"
                title={improvingField === 'title' ? t.common.improving : t.common.improveWithAITooltip}
                aria-label={improvingField === 'title' ? t.common.improving : t.common.improveWithAITooltip}
              >
                {improvingField === 'title' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span className="hidden sm:block ml-1.5">
                  {improvingField === 'title' ? t.common.improving : 'AI'}
                </span>
              </button>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {newItemType === 'okr' ? t.okrs.keyResults : t.companyItems.description}
          </label>
          <div className="space-y-2">
            <textarea
              value={editingItem.description}
              onChange={(e) => onUpdateItem({ description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              rows={3}
              placeholder={isCreatingNew ? `${t.common.edit} ${t.companyItems.description.toLowerCase()}...` : "Description"}
              disabled={isPending || aiPending}
            />
            {aiEnabled && editingItem.description.trim() && (
              <div className="flex justify-end">
                <button
                  onClick={() => handleImproveText('description')}
                  disabled={isPending || aiPending || improvingField === 'description'}
                  className="flex items-center justify-center min-w-[44px] min-h-[44px] px-2.5 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 hover:text-blue-700 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed active:scale-95 transition-all duration-150 touch-manipulation border border-blue-200 hover:border-blue-300"
                  title={improvingField === 'description' ? t.common.improving : t.common.improveWithAITooltip}
                  aria-label={improvingField === 'description' ? t.common.improving : t.common.improveWithAITooltip}
                >
                  {improvingField === 'description' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span className="hidden sm:block ml-1.5">
                    {improvingField === 'description' 
                      ? t.common.improving 
                      : t.common.improveWithAI
                    }
                  </span>
                  <span className="sm:hidden ml-1.5">AI</span>
                </button>
              </div>
            )}
          </div>
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
        
        {/* AI Error Display */}
        {aiError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{t.common.aiImprovementFailed}</p>
                <p className="text-sm text-red-700 mt-1">{aiError}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setAiError(null)}
                  className="flex items-center justify-center min-w-[32px] min-h-[32px] text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 touch-manipulation"
                  title={t.common.dismissError}
                  aria-label={t.common.dismissError}
                >
                  <span className="text-lg leading-none">×</span>
                </button>
              </div>
            </div>
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