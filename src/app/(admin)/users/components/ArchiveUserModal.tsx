import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Archive, X, AlertTriangle, Loader2 } from 'lucide-react'
import type { User, Company } from '@/types'

interface UserWithDetails extends User {
  company: Company
  manager?: Pick<User, 'name' | 'email'> | null
  _count: {
    employees: number
    evaluationsReceived: number
  }
}

interface ArchiveUserModalProps {
  isOpen: boolean
  user?: UserWithDetails
  isPending: boolean
  onClose: () => void
  onConfirm: (reason?: string) => void
  getRoleDisplayName: (role: string) => string
}

export function ArchiveUserModal({
  isOpen,
  user,
  isPending,
  onClose,
  onConfirm,
  getRoleDisplayName
}: ArchiveUserModalProps) {
  const { t } = useLanguage()
  const [reason, setReason] = useState('')

  if (!isOpen || !user) return null

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined)
    setReason('')
  }

  const handleClose = () => {
    onClose()
    setReason('')
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-xl max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-gray-200/60 bg-gradient-to-r from-orange-50/80 to-red-50/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Archive className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {t.users.archiveEmployee}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {user.name} - {getRoleDisplayName(user.role)}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
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
            <div className="flex items-center gap-3 mb-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">
                  {t.users.archiveEmployeeTitle}
                </p>
                <p className="text-sm text-gray-600">
                  {t.users.archiveEmployeeDescription.replace('{name}', user.name)}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                {t.users.archiveReason}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 min-h-[80px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500/50 transition-all duration-200 shadow-sm hover:border-gray-300 resize-none touch-manipulation"
                placeholder={t.users.archiveReasonPlaceholder}
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-2">
                {t.users.archiveReasonNote}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleClose}
              disabled={isPending}
              className="px-6 py-3 min-h-[44px] text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isPending}
              className="px-6 py-3 min-h-[44px] text-base font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4" />
                  {t.users.archiving}
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4" />
                  {t.users.archiveEmployee}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}