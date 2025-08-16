'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui'
import { unarchiveUser, deleteUser } from '@/lib/actions/users'
import { ChevronLeft, Archive, Search, X, History, RotateCcw, CheckCircle, Trash2 } from 'lucide-react'
import { DeleteArchivedUserModal } from './components'
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
  const [filterDepartment, setFilterDepartment] = useState('')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [userToDelete, setUserToDelete] = useState<ArchivedUserWithDetails | null>(null)

  // Get unique departments from archived users
  const departments = Array.from(
    new Set(archivedUsers
      .map(user => user.archivedDepartment || user.department)
      .filter((dept): dept is string => dept !== null && dept !== undefined))
  ).sort()

  // Filter archived users by search term and department
  const filteredUsers = archivedUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.archivedDepartment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.archivedManagerName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDepartment = !filterDepartment || 
      (user.archivedDepartment || user.department) === filterDepartment
    
    return matchesSearch && matchesDepartment
  })

  const handleUnarchiveUser = (userId: string) => {
    if (!confirm(`${t.users.areYouSureDelete.replace('delete', 'unarchive')} ${t.users.thisWillPermanently.replace('delete all user data', 'restore them to active status')}.`)) {
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

  const handleDeleteUser = (user: ArchivedUserWithDetails) => {
    setUserToDelete(user)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    if (!userToDelete) return

    startTransition(async () => {
      const result = await deleteUser(userToDelete.id)
      
      if (result.success) {
        const message = result.messageKey ? t.users[result.messageKey as keyof typeof t.users] : result.message
        success(message)
        setShowDeleteConfirm(false)
        setUserToDelete(null)
        router.refresh()
      } else {
        const errorMessage = result.messageKey ? t.users[result.messageKey as keyof typeof t.users] || result.message : result.message
        error(errorMessage)
      }
    })
  }

  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirm(false)
    setUserToDelete(null)
  }

  // Check if user can be safely deleted (no evaluation data)
  const canBeDeleted = (user: ArchivedUserWithDetails) => {
    return user._count.evaluationsReceived === 0 && user._count.employees === 0
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
                href="/dashboard"
                className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-white/20 text-white rounded-xl hover:bg-white/30 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation shadow-sm"
                title={t.common.back}
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Archive className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">
                    {t.users.archivedEmployees}
                  </h1>
                </div>
                <p className="text-sm text-orange-100">
                  {filteredUsers.length} {filteredUsers.length === 1 ? t.users.user : t.users.users} - {t.users.noArchivedEmployeesDescription.replace('All employees are currently active. Archived employees will appear here.', 'Historical records only')}
                </p>
              </div>
            </div>

            {/* Right Section - Language Toggle & User Count */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {archivedUsers.length}
                </div>
                <div className="text-sm text-orange-100">
                  {t.users.totalLabel} {t.status.archived}
                </div>
              </div>
              <div className="border-l border-orange-500/30 pl-4">
                <LanguageSwitcher variant="orange-header" />
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
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder={t.users.searchUsers}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500/50 transition-all duration-200 shadow-sm hover:shadow-md hover:border-gray-300 touch-manipulation"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 min-w-[32px] min-h-[32px] text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 touch-manipulation"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Department Filter */}
            <div className="w-full lg:w-48">
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500/50 transition-all duration-200 shadow-sm hover:shadow-md hover:border-gray-300 touch-manipulation cursor-pointer"
              >
                <option value="">{t.users.department}</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            {/* Results Count */}
            <div className="flex items-center px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl">
              <span className="text-sm font-medium text-orange-700">
                {filteredUsers.length} {filteredUsers.length === 1 ? t.users.user : t.users.users}
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
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t.users.noArchivedEmployeesFound}</h3>
                <p className="text-gray-600">{t.users.noArchivedEmployeesFoundDescription}</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t.users.noArchivedEmployees}</h3>
                <p className="text-gray-600">{t.users.noArchivedEmployeesDescription}</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-white/90 backdrop-blur-md rounded-2xl border border-orange-200/60 shadow-sm overflow-hidden">
                {/* User Header - Compact */}
                <div className="p-4 bg-gradient-to-r from-orange-50/80 to-red-50/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Employee Avatar - Smaller */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm opacity-60">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                      </div>
                      
                      {/* Employee Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-bold text-gray-900 truncate">{user.name}</h3>
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium border border-orange-200 shrink-0">
                            {t.status.archived.toUpperCase()}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium border border-gray-200 shrink-0">
                            {getRoleDisplayName(user.role)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>{user.email || user.username || t.users.noContact}</span>
                          <span>•</span>
                          <span>{user.archivedDepartment || t.users.noDept}</span>
                          <span>•</span>
                          <span>{t.users.archivedOn}: {formatDate(user.archivedAt)}</span>
                          {user.archivedManagerName && (
                            <>
                              <span>•</span>
                              <span>{t.users.manager}: {user.archivedManagerName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons - Compact */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => toggleUserExpansion(user.id)}
                        className="flex items-center gap-1 px-3 py-2 min-h-[36px] bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm touch-manipulation border border-gray-200 text-sm"
                      >
                        <History className="w-3 h-3" />
                        <span>{expandedUser === user.id ? t.users.hideEvaluationHistory : t.users.showEvaluationHistory}</span>
                      </button>
                      
                      <button
                        onClick={() => handleUnarchiveUser(user.id)}
                        disabled={isPending}
                        className="flex items-center gap-1 px-3 py-2 min-h-[36px] bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{isPending ? t.users.unarchivingEmployee : t.users.unarchiveEmployee}</span>
                      </button>

                      {canBeDeleted(user) && (
                        <button
                          onClick={() => handleDeleteUser(user)}
                          disabled={isPending}
                          className="flex items-center gap-1 px-3 py-2 min-h-[36px] bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-all duration-200 shadow-sm touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          title={t.users.noDataCanBeDeleted}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{t.users.delete}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Evaluation History - Compact */}
                {expandedUser === user.id && (
                  <div className="px-4 py-4 border-t border-orange-200/60 bg-white">
                    <h4 className="text-base font-bold text-gray-900 mb-3">
                      {t.users.evaluationHistory} ({user._count.evaluationsReceived})
                    </h4>
                    
                    {user.evaluationsReceived.length === 0 ? (
                      <p className="text-sm text-gray-600 py-2">{t.users.noEvaluations}.</p>
                    ) : (
                      <div className="space-y-2">
                        {user.evaluationsReceived.slice(0, 10).map(evaluation => (
                          <div key={evaluation.id} className="bg-gray-50/80 rounded-lg p-3 border border-gray-200/60">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="font-medium text-gray-900 text-sm truncate">
                                  {evaluation.periodType} {evaluation.periodDate}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${
                                  evaluation.status === 'completed' 
                                    ? 'bg-green-100 text-green-700'
                                    : evaluation.status === 'submitted'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {evaluation.status}
                                </span>
                                {evaluation.overallRating && (
                                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium shrink-0">
                                    {evaluation.overallRating}/5
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 shrink-0 ml-2">
                                {formatDate(evaluation.createdAt)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-600 mb-1.5">
                              <span><strong>Manager:</strong> {evaluation.manager.name}</span>
                            </div>
                            
                            {evaluation.managerComments && (
                              <div className="text-xs text-gray-700 bg-white/60 rounded p-2 border border-gray-200/40">
                                <span className="font-medium">Comments:</span> {evaluation.managerComments.length > 120 ? evaluation.managerComments.substring(0, 120) + '...' : evaluation.managerComments}
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {user.evaluationsReceived.length > 10 && (
                          <p className="text-xs text-gray-600 text-center py-1 bg-gray-50/50 rounded">
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

      {/* Delete Confirmation Modal */}
      <DeleteArchivedUserModal
        isOpen={showDeleteConfirm}
        user={userToDelete}
        isPending={isPending}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}