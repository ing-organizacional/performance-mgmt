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

interface UsersListProps {
  filteredUsers: UserWithDetails[]
  initialUsers: UserWithDetails[]
  searchTerm: string
  filterRole: string
  isPending: boolean
  onAddUser: () => void
  onEditUser: (user: UserWithDetails) => void
  onDeleteUser: (user: UserWithDetails) => void
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
  onDeleteUser,
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
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t.users.addUser}
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200/60">
            {filteredUsers.map((user) => (
              <div key={user.id} className="px-8 py-6 hover:bg-gray-50/50 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    {/* Enhanced User Avatar */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        {/* Status Indicator */}
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-sm ${
                          user.active ? 'bg-green-500' : 'bg-gray-400'
                        }`} title={user.active ? t.users.active : t.users.inactive}>
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 truncate">{user.name}</h3>
                        <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wide shrink-0 ${
                          user.role === 'hr' ? 'bg-primary/10 text-primary border border-primary/20' :
                          user.role === 'manager' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}>
                          {getRoleDisplayName(user.role)}
                        </span>
                      </div>
                      
                      {/* Contact & Basic Info */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                          <span className="truncate font-medium">
                            {user.email || user.username || t.users.noContact}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="truncate">
                            {user.company?.name || t.users.noCompany}
                          </span>
                        </div>
                      </div>
                      
                      {/* Department & Position - Enhanced Layout */}
                      {(user.department || user.position) && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-3">
                          {user.department && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <span className="truncate font-medium">{user.department}</span>
                            </div>
                          )}
                          
                          {user.position && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V4a2 2 0 00-2-2H8a2 2 0 00-2 2v2m8 0h4l-4 18-4-18h4zm-8 0h4v18H8V6z" />
                              </svg>
                              <span className="truncate font-medium">{user.position}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Manager & Employee ID */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-3">
                        {user.manager && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="truncate">
                              {t.users.reportsTo}: <span className="font-medium">{user.manager.name}</span>
                            </span>
                          </div>
                        )}
                        
                        {user.employeeId && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                            <span className="truncate">
                              {t.users.id}: <span className="font-medium">{user.employeeId}</span>
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Performance Stats */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="font-semibold">{user._count.employees}</span>
                          <span className="text-blue-600">{user._count.employees === 1 ? t.users.report : t.users.reports}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-lg border border-green-200">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-semibold">{user._count.evaluationsReceived}</span>
                          <span className="text-green-600">{user._count.evaluationsReceived === 1 ? t.users.evaluation : t.users.evaluations}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Action Buttons */}
                  <div className="flex items-center gap-2 ml-6 shrink-0">
                    <button
                      onClick={() => onEditUser(user)}
                      disabled={isPending}
                      className="flex items-center justify-center min-w-[44px] min-h-[44px] p-3 text-gray-600 bg-white border border-gray-200 rounded-xl hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                      title={t.users.editUser}
                      aria-label={t.users.editUser}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDeleteUser(user)}
                      disabled={isPending}
                      className="flex items-center justify-center min-w-[44px] min-h-[44px] p-3 text-gray-600 bg-white border border-gray-200 rounded-xl hover:text-red-600 hover:bg-red-50 hover:border-red-200 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                      title={t.users.deleteUser}
                      aria-label={t.users.deleteUser}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
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