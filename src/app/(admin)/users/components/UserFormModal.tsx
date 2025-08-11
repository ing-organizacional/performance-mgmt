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

interface UserFormModalProps {
  isOpen: boolean
  editingUser?: UserWithDetails
  companies: Company[]
  managers: Pick<User, 'id' | 'name' | 'email'>[]
  requiresPinOnly: boolean
  setRequiresPinOnly: (value: boolean) => void
  isPending: boolean
  onClose: () => void
  onSubmit: (formData: FormData) => void
}

export function UserFormModal({
  isOpen,
  editingUser,
  companies,
  managers,
  requiresPinOnly,
  setRequiresPinOnly,
  isPending,
  onClose,
  onSubmit
}: UserFormModalProps) {
  const { t } = useLanguage()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Enhanced Modal Header */}
        <div className="px-8 py-6 border-b border-gray-200/60 bg-gradient-to-r from-gray-50/50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={editingUser ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingUser ? t.users.editUser : t.users.addUser}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {editingUser 
                    ? t.users.updateUserInformation.replace('{name}', editingUser.name) 
                    : t.users.createNewUserAccount}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isPending}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 disabled:opacity-50 touch-manipulation"
              title={t.users.closeModal}
              aria-label={t.users.closeModal}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Enhanced Modal Body */}
        <div className="px-8 py-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          <form id="user-form" action={onSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">{t.users.name} *</label>
              <input
                name="name"
                type="text"
                required
                defaultValue={editingUser?.name}
                className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 touch-manipulation"
                placeholder={t.users.enterFullName}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">{t.users.email}</label>
              <input
                name="email"
                type="email"
                defaultValue={editingUser?.email || ''}
                className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 touch-manipulation"
                placeholder={t.users.enterEmailAddress}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">{t.users.username}</label>
              <input
                name="username"
                type="text"
                defaultValue={editingUser?.username || ''}
                className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 touch-manipulation"
                placeholder={t.users.enterUsername}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">{t.users.role} *</label>
              <select
                name="role"
                required
                defaultValue={editingUser?.role}
                className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 cursor-pointer touch-manipulation"
              >
                <option value="">{t.users.selectRole}</option>
                <option value="hr">{t.auth.hr}</option>
                <option value="manager">{t.auth.manager}</option>
                <option value="employee">{t.auth.employee}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">{t.users.company} *</label>
              <select
                name="companyId"
                required
                defaultValue={editingUser?.companyId}
                className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 cursor-pointer touch-manipulation"
              >
                <option value="">{t.users.selectCompany}</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">{t.users.manager}</label>
              <select
                name="managerId"
                defaultValue={editingUser?.managerId || ''}
                className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 cursor-pointer touch-manipulation"
              >
                <option value="">{t.users.noManager}</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>{manager.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">{t.users.department}</label>
              <input
                name="department"
                type="text"
                defaultValue={editingUser?.department || ''}
                className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 touch-manipulation"
                placeholder={t.users.enterDepartment}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">{t.users.position}</label>
              <input
                name="position"
                type="text"
                defaultValue={editingUser?.position || ''}
                className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 touch-manipulation"
                placeholder={t.users.enterPosition}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">{t.users.employeeId}</label>
              <input
                name="employeeId"
                type="text"
                defaultValue={editingUser?.employeeId || ''}
                className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 touch-manipulation"
                placeholder={t.users.enterEmployeeId}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">{t.users.personID}</label>
              <input
                name="personID"
                type="text"
                defaultValue={editingUser?.personID || ''}
                className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 touch-manipulation"
                placeholder={t.users.enterPersonId}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">{t.users.userType} *</label>
              <select
                name="userType"
                defaultValue={editingUser?.userType || 'office'}
                className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 cursor-pointer touch-manipulation"
              >
                <option value="office">{t.users.officeWorker}</option>
                <option value="operational">{t.users.operationalWorker}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">{t.users.loginMethod} *</label>
              <select
                name="loginMethod"
                defaultValue={editingUser?.loginMethod || 'email'}
                className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 cursor-pointer touch-manipulation"
              >
                <option value="email">{t.users.email}</option>
                <option value="username">{t.users.username}</option>
                <option value="qr">{t.users.qrCode}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">{t.users.shift}</label>
              <input
                name="shift"
                type="text"
                defaultValue={editingUser?.shift || ''}
                className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 touch-manipulation"
                placeholder={t.users.enterShift}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                {editingUser ? t.users.newPassword : `${t.users.password} *`}
              </label>
              <input
                name="password"
                type="password"
                required={!editingUser}
                className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 touch-manipulation"
                placeholder={t.users.enterPassword}
              />
            </div>

            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  name="requiresPinOnly"
                  type="checkbox"
                  checked={requiresPinOnly}
                  onChange={(e) => setRequiresPinOnly(e.target.checked)}
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2 transition-colors touch-manipulation"
                />
                <span className="text-sm font-bold text-gray-900">{t.users.requiresPinOnly}</span>
              </label>
            </div>

            {requiresPinOnly && (
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">{t.users.pinCode} *</label>
                <input
                  name="pinCode"
                  type="password"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  defaultValue={editingUser?.pinCode ? '****' : ''}
                  className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 touch-manipulation"
                  placeholder={t.users.enterFourDigitPin}
                  required
                />
              </div>
            )}

          </form>
        </div>
        
        {/* Enhanced Modal Footer */}
        <div className="px-8 py-6 border-t border-gray-200/60 bg-gradient-to-r from-gray-50/50 to-white flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-6 py-3 min-h-[44px] text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            {t.users.cancel}
          </button>
          <button
            type="submit"
            form="user-form"
            disabled={isPending}
            className="px-6 py-3 min-h-[44px] text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation flex items-center gap-2"
          >
            {isPending && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            )}
            {isPending ? t.users.saving : (editingUser ? t.users.updateUser : t.users.createUser)}
          </button>
        </div>
      </div>
    </div>
  )
}