import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { useExport } from '@/hooks/useExport'

interface RatingsHeaderProps {
  departmentCount: number
}

export function RatingsHeader({ departmentCount }: RatingsHeaderProps) {
  const { t } = useLanguage()
  const { isExporting, exportCompany } = useExport()

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="max-w-8xl mx-auto px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Left Section - Navigation & Title */}
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation shadow-sm"
              title={t.common.back}
              aria-label={t.common.back}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            
            <div className="min-w-0">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {t.dashboard.departmentRatings}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {departmentCount} {t.dashboard.completeDepartments.toLowerCase()}
              </p>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => exportCompany('pdf')}
              disabled={isExporting}
              className="flex items-center gap-2 px-6 py-3 min-h-[44px] bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              title={`Export All Departments - ${t.dashboard.departmentRatings}`}
            >
              {isExporting && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              )}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{isExporting ? t.dashboard.exporting : t.dashboard.exportPDF}</span>
            </button>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  )
}