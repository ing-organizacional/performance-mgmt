'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui'
import { unarchiveUser } from '@/lib/actions/users'
import type { User, Company } from '@/types'

interface ArchivedUserWithDetails extends User {
  company: Company
  manager?: Pick<User, 'name' | 'email'> | null
  // Archive snapshot fields
  archivedAt: Date | null
  archivedReason: string | null
  archivedManagerName: string | null
  archivedManagerEmail: string | null
  archivedDepartment: string | null
  archivedPosition: string | null
  archivedCompanyName: string | null
  evaluationsReceived: Array<{
    id: string
    periodType: string
    periodDate: string
    overallRating: number | null
    managerComments: string | null
    status: string
    createdAt: Date
    manager: {
      name: string
      email: string | null
    }
  }>
  _count: {
    employees: number
    evaluationsReceived: number
  }
}

interface ArchiveClientProps {
  archivedUsers: ArchivedUserWithDetails[]
  companies: Company[]
  managers: Pick<User, 'id' | 'name' | 'email'>[]
}

export default function ArchiveClient({ 
  archivedUsers
}: ArchiveClientProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { toasts, success, error, removeToast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  // Filter archived users by search term
  const filteredUsers = archivedUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.archivedDepartment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.archivedManagerName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const handleUnarchiveUser = (userId: string) => {
    if (!confirm('Are you sure you want to unarchive this user? They will be restored to active status.')) {
      return
    }

    startTransition(async () => {
      const result = await unarchiveUser(userId)
      
      if (result.success) {
        success(result.message)
        router.refresh()
      } else {
        error(result.message)
      }
    })
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'hr':
        return t.auth.hr
      case 'manager':
        return t.auth.manager
      case 'employee':
        return t.auth.employee
      default:
        return role
    }
  }

  const formatDate = (date: Date | null | string) => {
    if (!date) return 'N/A'
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString()
  }

  const toggleUserExpansion = (userId: string) => {
    setExpandedUser(expandedUser === userId ? null : userId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Archive Header with Visual Indicators */}
      <header className="sticky top-0 z-50 bg-orange-600/90 backdrop-blur-xl border-b border-orange-700/50 shadow-sm">
        <div className="max-w-8xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left Section - Navigation & Title */}
            <div className="flex items-center gap-6">
              <Link
                href="/users"
                className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-white/20 text-white rounded-xl hover:bg-white/30 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation shadow-sm"
                title={t.common.back}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">
                    Employee Archive
                  </h1>
                  <div className="px-3 py-1 bg-white/20 rounded-full">
                    <span className="text-sm font-medium text-white">ARCHIVED</span>
                  </div>
                </div>
                <p className="text-sm text-orange-100">
                  {filteredUsers.length} archived employees - Historical records only
                </p>
              </div>
            </div>

            {/* Right Section - User Count */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {archivedUsers.length}
                </div>
                <div className="text-sm text-orange-100">
                  Total Archived
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-[92px] z-30 shadow-sm">
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
                  placeholder="Search archived employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500/50 transition-all duration-200 shadow-sm hover:shadow-md hover:border-gray-300 touch-manipulation"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 min-w-[32px] min-h-[32px] text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 touch-manipulation"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            {/* Results Count */}
            <div className="flex items-center px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl">
              <span className="text-sm font-medium text-orange-700">
                {filteredUsers.length} archived {filteredUsers.length === 1 ? 'employee' : 'employees'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-8xl mx-auto px-6 lg:px-8 py-8">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            {searchTerm ? (
              <>
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">No archived employees found</h3>
                <p className="text-gray-600">Try adjusting your search terms or clear the search to see all archived employees.</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">No archived employees</h3>
                <p className="text-gray-600">All employees are currently active. Archived employees will appear here.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-white/90 backdrop-blur-md rounded-2xl border border-orange-200/60 shadow-sm overflow-hidden">
                {/* User Header */}
                <div className="p-6 bg-gradient-to-r from-orange-50/80 to-red-50/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                      {/* Employee Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-14 h-14 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm opacity-60">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                      </div>
                      
                      {/* Employee Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 truncate">{user.name}</h3>
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-xl text-xs font-medium border border-orange-200 shrink-0">
                            ARCHIVED
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium border border-gray-200 shrink-0">
                            {getRoleDisplayName(user.role)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>{user.email || user.username || 'No contact'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 4h1m4 0h1M9 16h1" />
                            </svg>
                            <span>{user.archivedDepartment || 'No department'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Archived: {formatDate(user.archivedAt)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Manager: {user.archivedManagerName || 'No manager'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 ml-6">
                      <button
                        onClick={() => toggleUserExpansion(user.id)}
                        className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-white text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm touch-manipulation border border-gray-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>{expandedUser === user.id ? 'Hide' : 'View'} History</span>
                      </button>
                      
                      <button
                        onClick={() => handleUnarchiveUser(user.id)}
                        disabled={isPending}
                        className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>{isPending ? 'Restoring...' : 'Unarchive'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Evaluation History */}
                {expandedUser === user.id && (
                  <div className="px-6 py-6 border-t border-orange-200/60 bg-white">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">
                      Evaluation History ({user._count.evaluationsReceived})
                    </h4>
                    
                    {user.evaluationsReceived.length === 0 ? (
                      <p className="text-gray-600 py-4">No evaluations on record.</p>
                    ) : (
                      <div className="space-y-4">
                        {user.evaluationsReceived.slice(0, 10).map(evaluation => (
                          <div key={evaluation.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-gray-900">
                                  {evaluation.periodType} {evaluation.periodDate}
                                </span>
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                  evaluation.status === 'completed' 
                                    ? 'bg-green-100 text-green-700'
                                    : evaluation.status === 'submitted'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {evaluation.status}
                                </span>
                                {evaluation.overallRating && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                                    Rating: {evaluation.overallRating}/5
                                  </span>
                                )}
                              </div>
                              <span className="text-sm text-gray-500">
                                {formatDate(evaluation.createdAt)}
                              </span>
                            </div>
                            
                            <div className="text-sm text-gray-600 mb-2">
                              <strong>Manager:</strong> {evaluation.manager.name}
                            </div>
                            
                            {evaluation.managerComments && (
                              <div className="text-sm text-gray-700 bg-white rounded-lg p-3 border">
                                <strong>Comments:</strong> {evaluation.managerComments}
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {user.evaluationsReceived.length > 10 && (
                          <p className="text-sm text-gray-600 text-center py-2">
                            ... and {user.evaluationsReceived.length - 10} more evaluations
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}