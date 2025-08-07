'use client'

import { useLanguage } from '@/contexts/LanguageContext'

interface SearchFilterBarProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  searchPlaceholder?: string
  filterValue: string
  setFilterValue: (value: string) => void
  filterOptions: Array<{ value: string; label: string }>
  filterLabel?: string
  className?: string
  children?: React.ReactNode
}

export default function SearchFilterBar({
  searchTerm,
  setSearchTerm,
  searchPlaceholder,
  filterValue,
  setFilterValue,
  filterOptions,
  filterLabel,
  className = '',
  children
}: SearchFilterBarProps) {
  const { t } = useLanguage()

  return (
    <div className={`bg-white border-b border-gray-200 sticky top-20 z-10 px-4 py-3 ${className}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col gap-3">
          {/* Search and Filter Row */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={searchPlaceholder || "Search..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 text-sm text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                    title={t.users?.clearSearch || 'Clear search'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <select 
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          {/* Additional content (like view toggle) */}
          {children && (
            <div className="flex items-center justify-center">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}