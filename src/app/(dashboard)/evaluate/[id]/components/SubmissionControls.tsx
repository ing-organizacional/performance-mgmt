import { useLanguage } from '@/contexts/LanguageContext'

interface SubmissionControlsProps {
  currentStep: number
  totalSteps: number
  isCurrentItemValid: () => boolean
  onPrevious: () => void
  onNext: () => void
}

export function SubmissionControls({
  currentStep,
  totalSteps,
  isCurrentItemValid,
  onPrevious,
  onNext
}: SubmissionControlsProps) {
  const { t } = useLanguage()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3">
      <div className="flex gap-3">
        {currentStep > 0 && (
          <button
            onClick={onPrevious}
            className="flex-1 py-3 px-4 min-h-[44px] border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 active:scale-95 active:bg-gray-100 transition-all duration-150 touch-manipulation"
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">{t.common?.previous || 'Previous'}</span>
            </div>
          </button>
        )}
        {currentStep < totalSteps - 1 && (
          <button
            onClick={onNext}
            disabled={!isCurrentItemValid()}
            className="flex-1 py-3 px-4 min-h-[44px] bg-primary text-white rounded-lg font-medium hover:bg-primary/90 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-150 touch-manipulation shadow-sm"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm">{t.common?.next || 'Next'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        )}
      </div>
    </div>
  )
}