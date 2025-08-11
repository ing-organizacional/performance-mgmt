import { useLanguage } from '@/contexts/LanguageContext'
import { Trash2, X, AlertTriangle, Loader2 } from 'lucide-react'
import type { User, Company } from '@/types'

interface ArchivedUserWithDetails extends User {
  company: Company
  manager?: Pick<User, 'name' | 'email'> | null
  _count: {
    employees: number
    evaluationsReceived: number
  }
  evaluationsReceived: Array<{
    id: string
    status: string
    overallRating?: number | null
    periodType: string
    periodDate: string
    createdAt: string
    managerComments?: string | null
    manager: {
      name: string
      email: string | null
    }
  }>
}

interface DeleteArchivedUserModalProps {
  isOpen: boolean
  user: ArchivedUserWithDetails | null
  isPending: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteArchivedUserModal({
  isOpen,
  user,
  isPending,
  onClose,
  onConfirm
}: DeleteArchivedUserModalProps) {
  const { t } = useLanguage()

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-xl max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-gray-200/60 bg-gradient-to-r from-red-50/80 to-orange-50/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {t.users.deleteUser}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {user.name} - {user.employeeId || 'N/A'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isPending}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 disabled:opacity-50 touch-manipulation"
              title={t.users.close}
              aria-label={t.users.close}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-8 py-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4 p-4 bg-red-50 rounded-xl border border-red-200">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">
                  {t.users.deleteUserWarning}
                </p>
                <p className="text-sm text-gray-600">
                  {t.users.areYouSureDelete} <strong>{user.name}</strong>? {t.users.thisWillPermanently}
                </p>
              </div>
            </div>

            {/* Safe Delete Info */}
            <div className="bg-green-50 rounded-xl border border-green-200 p-4">
              <p className="text-sm font-medium text-green-800 mb-2">
                ✅ {t.users.noDataCanBeDeleted}
              </p>
              <ul className="text-xs text-green-700 space-y-1">
                <li>• No evaluation history to preserve</li>
                <li>• No managed employees affected</li>
                <li>• Safe to permanently remove</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isPending}
              className="px-6 py-3 min-h-[44px] text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="px-6 py-3 min-h-[44px] text-base font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4" />
                  {t.users.deleting}
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  {t.users.deleteUser}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}