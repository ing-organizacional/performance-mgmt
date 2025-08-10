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
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-4">
      <div className="flex gap-3">
        {currentStep > 0 && (
          <button
            onClick={onPrevious}
            className="flex-1 py-4 px-6 min-h-[56px] border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 active:scale-95 active:bg-gray-100 transition-all duration-150 touch-manipulation"
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t.common?.previous || 'Previous'}
            </div>
          </button>
        )}
        {currentStep < totalSteps - 1 && (
          <button
            onClick={onNext}
            disabled={!isCurrentItemValid()}
            className="flex-1 py-4 px-6 min-h-[56px] bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-150 touch-manipulation shadow-sm"
          >
            <div className="flex items-center justify-center gap-2">
              {t.common?.next || 'Next'}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        )}
      </div>
    </div>
  )
}