import { useLanguage } from '@/contexts/LanguageContext'

interface ExportErrorDisplayProps {
  exportError: string
}

export function ExportErrorDisplay({ exportError }: ExportErrorDisplayProps) {
  const { t } = useLanguage()

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-red-900 mb-1">{t.dashboard.exportError}</h3>
          <p className="text-sm text-red-700">
            {exportError === 'Evaluation not found or access denied' ? t.dashboard.evaluationNotFound :
             exportError === 'Export failed' ? t.dashboard.exportFailed :
             exportError === 'No evaluations found' ? t.dashboard.noEvaluationsFound :
             exportError === 'Access denied - HR role required' ? t.dashboard.hrRoleRequired :
             exportError === 'Access denied - Manager or HR role required' ? t.dashboard.managerOrHrRequired :
             exportError}
          </p>
        </div>
      </div>
    </div>
  )
}