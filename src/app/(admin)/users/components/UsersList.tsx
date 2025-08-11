import { useLanguage } from '@/contexts/LanguageContext'
import { Archive, Mail, Building2, Users, Briefcase, User as UserIcon, CreditCard, Edit, Plus, CheckCircle } from 'lucide-react'
import type { User, Company } from '@/types'

interface UserWithDetails extends User {
  company: Company
  manager?: Pick<User, 'name' | 'email'> | null
  _count: {
    employees: number
    evaluationsReceived: number
  }
}

interface UsersListProps {
  filteredUsers: UserWithDetails[]
  initialUsers: UserWithDetails[]
  searchTerm: string
  filterRole: string
  isPending: boolean
  onAddUser: () => void
  onEditUser: (user: UserWithDetails) => void
  onArchiveUser: (user: UserWithDetails) => void
  getRoleDisplayName: (role: string) => string
}

export function UsersList({
  filteredUsers,
  initialUsers,
  searchTerm,
  filterRole,
  isPending,
  onAddUser,
  onEditUser,
  onArchiveUser,
  getRoleDisplayName
}: UsersListProps) {
  const { t } = useLanguage()

  return (
    <main className="max-w-8xl mx-auto px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        {/* List Header */}
        <div className="px-8 py-6 border-b border-gray-200/60 bg-gradient-to-r from-gray-50/50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {t.users.userManagement}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {filteredUsers.length} {filteredUsers.length === 1 ? t.users.user : t.users.users} {searchTerm || filterRole ? t.users.found : t.users.total}
              </p>
            </div>
            
            {/* Quick Stats - Desktop Only */}
            <div className="hidden lg:flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {initialUsers.filter(u => u.role === 'hr').length}
                </div>
                <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                  {t.auth.hr}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {initialUsers.filter(u => u.role === 'manager').length}
                </div>
                <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                  {t.users.managersLabel}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {initialUsers.filter(u => u.role === 'employee').length}
                </div>
                <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                  {t.users.employees}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t.users.noUsersFound}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterRole 
                ? t.users.tryAdjustingSearch
                : t.users.noUsersCreated}
            </p>
            {!searchTerm && !filterRole && (
              <button
                onClick={onAddUser}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-sm"
              >
                <Plus className="w-5 h-5" />
                {t.users.addUser}
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200/60">
            {filteredUsers.map((user) => (
              <div key={user.id} className="px-6 py-4 hover:bg-gray-50/50 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Compact User Avatar */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        {/* Status Indicator */}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                          user.active ? 'bg-green-500' : 'bg-gray-400'
                        }`} title={user.active ? t.users.active : t.users.inactive}>
                        </div>
                      </div>
                    </div>
                    
                    {/* Compact User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-gray-900 truncate">{user.name}</h3>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wide shrink-0 ${
                          user.role === 'hr' ? 'bg-primary/10 text-primary border border-primary/20' :
                          user.role === 'manager' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}>
                          {getRoleDisplayName(user.role)}
                        </span>
                      </div>
                      
                      {/* Contact & Basic Info - Compact */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span className="truncate font-medium">
                            {user.email || user.username || t.users.noContact}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          <span className="truncate">
                            {user.company?.name || t.users.noCompany}
                          </span>
                        </div>
                        {user.department && (
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-gray-400" />
                            <span className="truncate font-medium">{user.department}</span>
                          </div>
                        )}
                        
                        {user.position && (
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                            <span className="truncate font-medium">{user.position}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Manager & Employee ID - Compact */}
                      {(user.manager || user.employeeId) && (
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 mt-1">
                          {user.manager && (
                            <div className="flex items-center gap-1.5">
                              <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                              <span className="truncate">
                                {t.users.reportsTo}: <span className="font-medium">{user.manager.name}</span>
                              </span>
                            </div>
                          )}
                          
                          {user.employeeId && (
                            <div className="flex items-center gap-1.5">
                              <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                              <span className="truncate">
                                {t.users.id}: <span className="font-medium">{user.employeeId}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Performance Stats - Compact */}
                      <div className="flex items-center gap-3 text-xs mt-1">
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                          <Users className="w-3 h-3" />
                          <span className="font-semibold">{user._count.employees}</span>
                          <span className="text-blue-600">{user._count.employees === 1 ? t.users.report : t.users.reports}</span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded border border-green-200">
                          <CheckCircle className="w-3 h-3" />
                          <span className="font-semibold">{user._count.evaluationsReceived}</span>
                          <span className="text-green-600">{user._count.evaluationsReceived === 1 ? t.users.evaluation : t.users.evaluations}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Compact Action Buttons */}
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <button
                      onClick={() => onEditUser(user)}
                      disabled={isPending}
                      className="flex items-center justify-center min-w-[36px] min-h-[36px] p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                      title={t.users.editUser}
                      aria-label={t.users.editUser}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onArchiveUser(user)}
                      disabled={isPending || (user.role === 'manager' && user._count.employees > 0)}
                      className="flex items-center justify-center min-w-[36px] min-h-[36px] p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                      title={user.role === 'manager' && user._count.employees > 0 
                        ? `${t.users.cannotArchiveManager} - ${t.users.manages} ${user._count.employees} ${t.users.activeEmployees}`
                        : t.users.archiveEmployee}
                      aria-label={t.users.archiveEmployee}
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}