import { useLanguage } from '@/contexts/LanguageContext'
import type { EditingItem } from '../types'
import { Building2, User, Target, Star, Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
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
  userDepartment?: string // Department context for AI prompts
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
  userDepartment,
  onUpdateItem,
  onSave,
  onCancel
}: ItemEditorProps) {
  const { t } = useLanguage()
  const { success, error } = useToast()
  const [aiPending, startAITransition] = useTransition()
  const [improvingField, setImprovingField] = useState<'title' | 'description' | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  
  // AI iteration history and state
  const [textHistory, setTextHistory] = useState<{
    title: string[]
    description: string[]
  }>({ title: [], description: [] })
  
  const [currentVersion, setCurrentVersion] = useState<{
    title: number
    description: number
  }>({ title: 0, description: 0 })
  
  const [isStreaming, setIsStreaming] = useState<{
    title: boolean
    description: boolean
  }>({ title: false, description: false })


  if (!editingItem) return null

  // Smooth streaming animation for text updates
  const animateTextChange = (field: 'title' | 'description', newText: string) => {
    setIsStreaming(prev => ({ ...prev, [field]: true }))
    
    // Split text into words for streaming effect
    const words = newText.split(' ')
    let currentText = ''
    
    words.forEach((word, index) => {
      setTimeout(() => {
        currentText += (index > 0 ? ' ' : '') + word
        onUpdateItem({ [field]: currentText })
        
        // Finish streaming animation
        if (index === words.length - 1) {
          setTimeout(() => {
            setIsStreaming(prev => ({ ...prev, [field]: false }))
          }, 100)
        }
      }, index * 100) // 100ms delay between words
    })
  }

  // Initialize history when text changes externally
  const initializeHistory = (field: 'title' | 'description', text: string) => {
    const currentHistory = textHistory[field]
    if (currentHistory.length === 0 && text.trim()) {
      setTextHistory(prev => ({
        ...prev,
        [field]: [text.trim()]
      }))
      setCurrentVersion(prev => ({ ...prev, [field]: 0 }))
    }
  }

  // Handle version switching (instant, no animation)
  const switchToVersion = (field: 'title' | 'description', versionIndex: number) => {
    const history = textHistory[field]
    if (history[versionIndex]) {
      setCurrentVersion(prev => ({ ...prev, [field]: versionIndex }))
      // Instant switch - no streaming animation for existing versions
      onUpdateItem({ [field]: history[versionIndex] })
    }
  }

  // Handle AI text improvement (supports iterations)
  const handleImproveText = (field: 'title' | 'description', isIteration = false) => {
    if (!aiEnabled || !editingItem) return

    const currentText = field === 'title' ? editingItem.title : editingItem.description
    if (!currentText.trim()) return

    // Initialize history if this is the first improvement
    if (!isIteration) {
      initializeHistory(field, currentText.trim())
    }

    setImprovingField(field)
    setAiError(null) // Clear previous errors
    
    startAITransition(async () => {
      try {
        const result = await improveTextWithAI({
          text: currentText.trim(),
          type: field === 'title' 
            ? (newItemType === 'okr' ? 'objective' : 'competency')
            : (newItemType === 'okr' ? 'key-result' : 'competency-description'),
          context: field === 'description' ? editingItem.title.trim() : undefined,
          isIteration: isIteration,
          // Only pass department for department-level items, not company-wide
          department: level === 'department' ? userDepartment : undefined
        })

        if (result.success && result.improvedText) {
          // Ensure original text is in history before adding AI improvement
          let newHistory = [...textHistory[field]]
          if (newHistory.length === 0) {
            // First AI improvement - add original text first
            newHistory = [currentText.trim()]
          }
          newHistory.push(result.improvedText)
          
          setTextHistory(prev => ({
            ...prev,
            [field]: newHistory
          }))
          
          const newVersionIndex = newHistory.length - 1
          setCurrentVersion(prev => ({ ...prev, [field]: newVersionIndex }))
          
          // Animate the text change
          animateTextChange(field, result.improvedText)
          
          setAiError(null) // Clear error on success
          success(isIteration ? `AI refined text successfully` : t.common.aiImprovementSuccess)
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
            {/* Title AI Controls */}
            <div className="flex flex-col gap-2">
              {aiEnabled && editingItem.title.trim().length >= 20 && textHistory.title.length < 4 && (
                <button
                onClick={() => handleImproveText('title', textHistory.title.length > 0)}
                disabled={isPending || aiPending || improvingField === 'title'}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] px-2.5 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 hover:text-blue-700 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed active:scale-95 transition-all duration-150 touch-manipulation border border-blue-200 hover:border-blue-300"
                title={improvingField === 'title' ? t.common.improving : (textHistory.title.length > 0 ? 'Refine with AI (max 3 versions)' : t.common.improveWithAITooltip)}
                aria-label={improvingField === 'title' ? t.common.improving : (textHistory.title.length > 0 ? 'Refine with AI' : t.common.improveWithAITooltip)}
              >
                {improvingField === 'title' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {textHistory.title.length > 0 ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </>
                )}
                <span className="hidden sm:block ml-1.5">
                  {improvingField === 'title' ? t.common.improving : (textHistory.title.length > 0 ? 'Refine' : 'AI')}
                </span>
                </button>
              )}
              
              {/* Title Version History */}
              {textHistory.title.length > 1 && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border">
                  <span className="text-xs text-gray-600 font-medium">Versions:</span>
                  <div className="flex gap-1">
                    {textHistory.title.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => switchToVersion('title', index)}
                        className={`px-2 py-1 text-xs rounded transition-all duration-150 ${
                          currentVersion.title === index
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {index === 0 ? 'Original' : `AI v${index}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
            {/* Description AI Controls */}
            {aiEnabled && editingItem.description.trim().length >= 30 && textHistory.description.length < 4 && (
              <div className="flex justify-end">
                <button
                  onClick={() => handleImproveText('description', textHistory.description.length > 0)}
                  disabled={isPending || aiPending || improvingField === 'description'}
                  className="flex items-center justify-center min-w-[44px] min-h-[44px] px-2.5 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 hover:text-blue-700 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed active:scale-95 transition-all duration-150 touch-manipulation border border-blue-200 hover:border-blue-300"
                  title={improvingField === 'description' ? t.common.improving : (textHistory.description.length > 0 ? 'Refine with AI (max 3 versions)' : t.common.improveWithAITooltip)}
                  aria-label={improvingField === 'description' ? t.common.improving : (textHistory.description.length > 0 ? 'Refine with AI' : t.common.improveWithAITooltip)}
                >
                  {improvingField === 'description' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {textHistory.description.length > 0 ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    </>
                  )}
                  <span className="hidden sm:block ml-1.5">
                    {improvingField === 'description' 
                      ? t.common.improving 
                      : (textHistory.description.length > 0 ? 'Refine' : t.common.improveWithAI)
                    }
                  </span>
                  <span className="sm:hidden ml-1.5">
                    {textHistory.description.length > 0 ? 'Refine' : 'AI'}
                  </span>
                </button>
              </div>
            )}
            
            {/* Description Version History */}
            {textHistory.description.length > 1 && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border mt-2">
                <span className="text-xs text-gray-600 font-medium">Versions:</span>
                <div className="flex gap-1 flex-wrap">
                  {textHistory.description.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => switchToVersion('description', index)}
                      className={`px-2 py-1 text-xs rounded transition-all duration-150 ${
                        currentVersion.description === index
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {index === 0 ? 'Original' : `AI v${index}`}
                    </button>
                  ))}
                </div>
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