'use client'

import { useLanguage } from '@/contexts/LanguageContext'

interface CreateCycleModalProps {
  onClose: () => void
  onSubmit: (formData: FormData) => void
  isPending: boolean
}

export function CreateCycleModal({ onClose, onSubmit, isPending }: CreateCycleModalProps) {
  const { t } = useLanguage()

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="px-8 py-6 border-b border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {t.dashboard.createCycle || 'Create New Cycle'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Set up a new performance evaluation cycle
              </p>
            </div>
          </div>
        </div>
        
        <form action={onSubmit} className="px-8 py-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t.dashboard.cycleName || 'Cycle Name'} *
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g., 2025 Annual Review"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {t.dashboard.startDate || 'Start Date'} *
              </label>
              <input
                name="startDate"
                type="date"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {t.dashboard.endDate || 'End Date'} *
              </label>
              <input
                name="endDate"
                type="date"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200/50">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-6 py-3 min-h-[44px] text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              {t.common?.cancel || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-3 min-h-[44px] bg-primary text-white rounded-xl hover:bg-primary/90 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation shadow-sm"
            >
              {isPending ? (t.dashboard.creating || 'Creating...') : (t.dashboard.createCycle || 'Create Cycle')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}