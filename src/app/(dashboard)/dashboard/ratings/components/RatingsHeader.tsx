import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { useExport } from '@/hooks/useExport'
import { ChevronLeft, Download } from 'lucide-react'

interface RatingsHeaderProps {
  departmentCount: number
}

export function RatingsHeader({ departmentCount }: RatingsHeaderProps) {
  const { t } = useLanguage()
  const { isExporting, exportCompany } = useExport()

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          {/* Left Section - Navigation & Title */}
          <div className="flex items-center gap-4 lg:gap-6">
            <Link
              href="/dashboard"
              className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation shadow-sm"
              title={t.common.back}
              aria-label={t.common.back}
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl lg:text-3xl font-bold text-gray-900">
                {t.dashboard.departmentRatings}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {departmentCount} {t.dashboard.completeDepartments.toLowerCase()}
              </p>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-3 lg:gap-4">
            <button
              onClick={() => exportCompany('pdf')}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 lg:px-6 py-3 min-h-[44px] bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              title={`Export All Departments - ${t.dashboard.departmentRatings}`}
            >
              {isExporting && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              )}
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{isExporting ? t.dashboard.exporting : t.dashboard.exportPDF}</span>
            </button>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  )
}