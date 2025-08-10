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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
      <div className="flex gap-3">
        {currentStep > 0 && (
          <button
            onClick={onPrevious}
            className="flex-1 py-4 px-6 min-h-[50px] border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 active:scale-95 active:bg-gray-100 transition-all duration-150 touch-manipulation"
          >
            {t.common?.previous || 'Previous'}
          </button>
        )}
        {currentStep < totalSteps - 1 && (
          <button
            onClick={onNext}
            disabled={!isCurrentItemValid()}
            className="flex-1 py-4 px-6 min-h-[50px] bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:scale-95 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-150 touch-manipulation"
          >
            {t.common?.next || 'Next'}
          </button>
        )}
      </div>
    </div>
  )
}