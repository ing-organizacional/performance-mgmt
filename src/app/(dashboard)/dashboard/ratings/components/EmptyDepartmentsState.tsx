import { useLanguage } from '@/contexts/LanguageContext'

export function EmptyDepartmentsState() {
  const { t } = useLanguage()

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 p-12 shadow-sm text-center">
      <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{t.dashboard.noDepartmentsFound}</h3>
      <p className="text-gray-600">{t.dashboard.addEmployeesWithDepartments}</p>
    </div>
  )
}