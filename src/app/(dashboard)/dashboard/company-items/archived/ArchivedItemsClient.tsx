'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { Target, Star, ChevronLeft, Archive, Calendar, User, Search, X } from 'lucide-react'

interface ArchivedCompanyEvaluationItem {
  id: string
  title: string
  description: string
  type: 'okr' | 'competency'
  level: 'company'
  createdBy: string
  creatorRole: string
  active: boolean
  createdAt: string
  archivedAt: string | null
  archivedBy: string
  archivedReason: string
}

interface ArchivedItemsClientProps {
  archivedItems: ArchivedCompanyEvaluationItem[]
  archivedCount: {
    okrs: number
    competencies: number
  }
}

export default function ArchivedItemsClient({ archivedItems, archivedCount }: ArchivedItemsClientProps) {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')

  const totalItems = archivedCount.okrs + archivedCount.competencies

  // Filter items based on search term
  const filteredItems = archivedItems.filter(item => {
    const searchLower = searchTerm.toLowerCase()
    return (
      item.title.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower) ||
      item.createdBy.toLowerCase().includes(searchLower) ||
      item.archivedBy.toLowerCase().includes(searchLower) ||
      item.archivedReason.toLowerCase().includes(searchLower) ||
      item.type.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50/20 to-indigo-50/30">
      {/* Desktop-First Professional Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-8xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex items-center justify-between">
            {/* Left Section - Navigation & Title */}
            <div className="flex items-center gap-3 md:gap-6">
              <Link
                href="/dashboard/company-items"
                className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation shadow-sm"
                title={t.common?.back || 'Go back'}
                aria-label={t.common?.back || 'Go back'}
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-900">
                  {t.companyItems?.archivedItemsTitle || 'Archived Items'}
                </h1>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1 hidden sm:block">
                  {totalItems} {t.companyItems?.archivedItems?.toLowerCase() || 'archived items'}
                </p>
              </div>
            </div>

            {/* Right Section - Language Switcher */}
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-8xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        {/* Stats Summary and Search */}
        <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200/60 shadow-sm mb-6">
          <div className="p-4 md:p-6">
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{archivedCount.okrs}</div>
                  <div className="text-xs text-gray-600">{t.companyItems?.archivedOKRs || 'Archived OKRs'}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{archivedCount.competencies}</div>
                  <div className="text-xs text-gray-600">{t.companyItems?.archivedCompetencies || 'Archived Competencies'}</div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                placeholder={t.companyItems?.searchArchived || 'Search archived items...'}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Archived Items List */}
        {filteredItems.length > 0 ? (
          <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200/60 shadow-sm">
            <div className="p-4 md:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  {t.companyItems?.existingItemsTitle || 'Company Items'} 
                  <span className="text-gray-500 font-normal">
                    ({filteredItems.length}{searchTerm && ` of ${archivedItems.length}`})
                  </span>
                </h2>
              </div>
            </div>
            
            <div className="space-y-0">
              {filteredItems.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`p-4 ${
                    index !== filteredItems.length - 1 ? 'border-b border-gray-100' : ''
                  } hover:bg-gray-50/50 transition-colors duration-150`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      item.type === 'okr' ? 'bg-primary/10' : 'bg-amber-100'
                    }`}>
                      {item.type === 'okr' ? 
                        <Target className="w-4 h-4 text-primary" /> : 
                        <Star className="w-4 h-4 text-amber-500" />
                      }
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header with badges and title */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
                          <Archive className="h-3 w-3" />
                          {t.companyItems?.archived || 'Archived'}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
                          {item.type === 'okr' ? 'OKR' : t.evaluations?.competency || 'Competency'}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
                          {t.companyItems?.companyWide || 'Company-Wide'}
                        </span>
                      </div>
                      
                      {/* Title */}
                      <h3 className="font-semibold text-gray-900 text-base leading-tight mb-2">
                        {item.title}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-gray-600 text-sm leading-relaxed mb-3 line-clamp-2">
                        {item.description}
                      </p>
                      
                      {/* Compact metadata */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{t.companyItems?.createdBy || 'Created by'} {item.createdBy}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Archive className="h-3 w-3" />
                          <span>{t.companyItems?.archivedBy || 'Archived by'} {item.archivedBy}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{item.archivedAt ? new Date(item.archivedAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                      
                      {/* Archive reason */}
                      <div className="mt-2 text-xs text-gray-500 italic">
                        {t.companyItems?.reason || 'Reason'}: {item.archivedReason}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200/60 shadow-sm">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {searchTerm ? (
                  <Search className="w-8 h-8 text-amber-600" />
                ) : (
                  <Archive className="w-8 h-8 text-amber-600" />
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {searchTerm ? (t.companyItems?.noMatchingItems || 'No matching items found') : (t.companyItems?.noArchivedItems || 'No archived items found')}
              </h3>
              <p className="text-gray-600 text-sm">
                {searchTerm ? (
                  <>{t.companyItems?.searchHelp || 'Try adjusting your search terms or'} <button onClick={() => setSearchTerm('')} className="text-amber-600 hover:text-amber-700 underline">{t.companyItems?.clearSearch || 'clear the search'}</button> {t.companyItems?.seeAllArchived || 'to see all archived items'}.</>
                ) : (
                  t.companyItems?.noArchivedItemsDescription || 'When company-wide items are archived, they will appear here with their full details and history.'
                )}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}