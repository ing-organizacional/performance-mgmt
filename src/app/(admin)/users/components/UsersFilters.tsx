import { useLanguage } from '@/contexts/LanguageContext'
import type { User } from '@/types'

interface UsersFiltersProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  filterRole: string
  setFilterRole: (role: string) => void
  filteredUsers: User[]
}

export function UsersFilters({
  searchTerm,
  setSearchTerm,
  filterRole,
  setFilterRole,
  filteredUsers
}: UsersFiltersProps) {
  const { t } = useLanguage()

  return (
    <div className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-[92px] z-30 shadow-sm border-t-0">
      <div className="max-w-8xl mx-auto px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder={t.users.searchUsersByNameEmail}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md hover:border-gray-300 touch-manipulation"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 min-w-[32px] min-h-[32px] text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 touch-manipulation"
                  title={t.users.clearSearch}
                  aria-label={t.users.clearSearch}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Role Filter */}
          <div className="relative">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="appearance-none px-6 py-3 pr-10 min-h-[44px] min-w-[160px] text-base text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md hover:border-gray-300 cursor-pointer touch-manipulation"
            >
              <option value="">{t.users.allRoles}</option>
              <option value="hr">{t.auth.hr}</option>
              <option value="manager">{t.auth.manager}</option>
              <option value="employee">{t.auth.employee}</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {/* Results Count - Desktop Only */}
          <div className="hidden lg:flex items-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
            <span className="text-sm font-medium text-gray-600">
              {filteredUsers.length} {filteredUsers.length === 1 ? t.users.user : t.users.users}
            </span>
          </div>
        </div>
        
        {/* Mobile Results Count */}
        <div className="lg:hidden mt-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl">
          <span className="text-sm font-medium text-gray-600">
            {filteredUsers.length} {filteredUsers.length === 1 ? t.users.user : t.users.users} {t.users.found}
          </span>
        </div>
      </div>
    </div>
  )
}