import { useLanguage } from '@/contexts/LanguageContext'
import type { User, Company } from '@/types'

interface UserWithDetails extends User {
  company: Company
  manager?: Pick<User, 'name' | 'email'> | null
  _count: {
    employees: number
    evaluationsReceived: number
  }
}

interface DeleteUserModalProps {
  isOpen: boolean
  user?: UserWithDetails
  isPending: boolean
  onClose: () => void
  onConfirm: (userId: string) => void
  getRoleDisplayName: (role: string) => string
}

export function DeleteUserModal({
  isOpen,
  user,
  isPending,
  onClose,
  onConfirm,
  getRoleDisplayName
}: DeleteUserModalProps) {
  const { t } = useLanguage()

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-xl max-w-lg w-full">
        {/* Enhanced Warning Header */}
        <div className="px-8 py-6 border-b border-gray-200/60 bg-gradient-to-r from-red-50/50 to-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.882 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-red-900">
                {t.users.deleteUser}
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {t.users.deleteUserWarning}
              </p>
            </div>
          </div>
        </div>
        
        {/* Enhanced Warning Content */}
        <div className="px-8 py-6">
          <div className="mb-6">
            <p className="text-base text-gray-700 mb-4">
              {t.users.areYouSureDelete} <strong className="text-gray-900">{user.name}</strong>?
            </p>
            
            {/* User Info Preview */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {user.email || user.username} • {getRoleDisplayName(user.role)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.882 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="text-sm text-red-800">
                  <p className="font-semibold mb-1">{t.users.thisWillPermanently}</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>{t.users.deleteAllUserData}</li>
                    <li>{t.users.removeEvaluationRecords.replace('{count}', user._count.evaluationsReceived.toString())}</li>
                    <li>{t.users.unassignDirectReports.replace('{count}', user._count.employees.toString())}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Action Footer */}
        <div className="px-8 py-6 border-t border-gray-200/60 bg-gradient-to-r from-gray-50/50 to-white flex justify-end gap-4">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-6 py-3 min-h-[44px] text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            {t.users.cancel}
          </button>
          <button
            onClick={() => onConfirm(user.id)}
            disabled={isPending}
            className="px-6 py-3 min-h-[44px] text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation flex items-center gap-2"
          >
            {isPending && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            )}
            {isPending ? t.users.deleting : t.users.deleteUser}
          </button>
        </div>
      </div>
    </div>
  )
}