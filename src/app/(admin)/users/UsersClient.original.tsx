'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState, useTransition } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { ToastContainer } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { createUser, updateUser, deleteUser } from '@/lib/actions/users'
import type { User, Company } from '@/types'

interface UserWithDetails extends User {
  company: Company
  manager?: Pick<User, 'name' | 'email'> | null
  _count: {
    employees: number
    evaluationsReceived: number
  }
}

interface UsersClientProps {
  users: UserWithDetails[]
  companies: Company[]
  managers: Pick<User, 'id' | 'name' | 'email'>[]
}

export default function UsersClient({ users: initialUsers, companies, managers }: UsersClientProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const { toasts, success, error, removeToast } = useToast()
  const [isPending, startTransition] = useTransition()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithDetails | undefined>(undefined)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ user: UserWithDetails } | null>(null)
  const [requiresPinOnly, setRequiresPinOnly] = useState(false)

  const handleFormSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = editingUser 
        ? await updateUser(editingUser.id, formData)
        : await createUser(formData)

      if (result.success) {
        success(result.message)
        setShowUserForm(false)
        setEditingUser(undefined)
        router.refresh() // Refresh server data
      } else {
        error(result.message)
      }
    })
  }

  const handleDeleteUser = async (userId: string) => {
    if (!showDeleteConfirm) return

    startTransition(async () => {
      const result = await deleteUser(userId)
      
      if (result.success) {
        success(result.message)
        setShowDeleteConfirm(null)
        router.refresh() // Refresh server data
      } else {
        error(result.message)
      }
    })
  }

  const handleEditUser = (user: UserWithDetails) => {
    setEditingUser(user)
    setRequiresPinOnly(user.requiresPinOnly ?? false)
    setShowUserForm(true)
  }

  const handleAddUser = () => {
    setEditingUser(undefined)
    setRequiresPinOnly(false)
    setShowUserForm(true)
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

  const filteredUsers = initialUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === '' || user.role === filterRole
    
    return matchesSearch && matchesRole
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Desktop-First Professional Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-8xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left Section - Navigation & Title */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation shadow-sm"
                title={t.common?.back || 'Go back'}
                aria-label={t.common?.back || 'Go back'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="min-w-0">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {t.users.userManagement || 'User Management'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {t.users.manageUsersDescription || 'Manage users, roles, and permissions'}
                </p>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleAddUser}
                disabled={isPending}
                className="flex items-center gap-2 px-6 py-3 min-h-[44px] bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>{t.users.addUser || 'Add User'}</span>
              </button>
              <button
                onClick={() => router.push('/users/advanced')}
                className="hidden lg:flex items-center gap-2 px-6 py-3 min-h-[44px] bg-white text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm touch-manipulation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{t.users.advanced || 'Advanced'}</span>
              </button>
              <LanguageSwitcher />
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-red-500 text-white rounded-xl hover:bg-red-600 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm touch-manipulation"
                title={t.auth?.signOut || 'Sign Out'}
                aria-label={t.auth?.signOut || 'Sign Out'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop-First Search and Filters */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-[120px] z-30 shadow-sm">
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
                  placeholder={t.users.searchUsers || "Search users by name, email, or username..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md hover:border-gray-300 touch-manipulation"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 min-w-[32px] min-h-[32px] text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 touch-manipulation"
                    title={t.users.clearSearch || 'Clear search'}
                    aria-label={t.users.clearSearch || 'Clear search'}
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
                className="appearance-none px-6 py-3 pr-10 min-h-[44px] min-w-[160px] text-base text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md hover:border-gray-300 touch-manipulation"
              >
                <option value="">{t.users.allRoles || 'All Roles'}</option>
                <option value="hr">{t.auth.hr || 'HR'}</option>
                <option value="manager">{t.auth.manager || 'Manager'}</option>
                <option value="employee">{t.auth.employee || 'Employee'}</option>
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
                {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
              </span>
            </div>
          </div>
          
          {/* Mobile Results Count */}
          <div className="lg:hidden mt-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl">
            <span className="text-sm font-medium text-gray-600">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
            </span>
          </div>
        </div>
      </div>

      {/* Desktop-First Users List */}
      <main className="max-w-8xl mx-auto px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          {/* List Header */}
          <div className="px-8 py-6 border-b border-gray-200/60 bg-gradient-to-r from-gray-50/50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {t.users.userManagement || 'User Management'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} {searchTerm || filterRole ? 'found' : 'total'}
                </p>
              </div>
              
              {/* Quick Stats - Desktop Only */}
              <div className="hidden lg:flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {initialUsers.filter(u => u.role === 'hr').length}
                  </div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                    {t.auth.hr || 'HR'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {initialUsers.filter(u => u.role === 'manager').length}
                  </div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                    {t.auth.manager || 'Managers'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {initialUsers.filter(u => u.role === 'employee').length}
                  </div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                    {t.auth.employee || 'Employees'}
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
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                {t.users.noUsersFound || 'No users found'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterRole 
                  ? 'Try adjusting your search or filters'
                  : 'No users have been created yet'}
              </p>
              {!searchTerm && !filterRole && (
                <button
                  onClick={handleAddUser}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t.users.addUser || 'Add User'}
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
                          }`} title={user.active ? 'Active' : 'Inactive'}>
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
                              {user.email || user.username || 'No contact'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="truncate">
                              {user.company?.name || 'No company'}
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
                                {t.users.reportsTo || 'Reports to'}: <span className="font-medium">{user.manager.name}</span>
                              </span>
                            </div>
                          )}
                          
                          {user.employeeId && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                              </svg>
                              <span className="truncate">
                                ID: <span className="font-medium">{user.employeeId}</span>
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
                            <span className="text-blue-600">{user._count.employees === 1 ? 'report' : 'reports'}</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-lg border border-green-200">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-semibold">{user._count.evaluationsReceived}</span>
                            <span className="text-green-600">{user._count.evaluationsReceived === 1 ? 'evaluation' : 'evaluations'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced Action Buttons */}
                    <div className="flex items-center gap-2 ml-6 shrink-0">
                      <button
                        onClick={() => handleEditUser(user)}
                        disabled={isPending}
                        className="flex items-center justify-center min-w-[44px] min-h-[44px] p-3 text-gray-600 bg-white border border-gray-200 rounded-xl hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                        title={t.users.editUserTitle || 'Edit user'}
                        aria-label={t.users.editUserTitle || 'Edit user'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm({ user })}
                        disabled={isPending}
                        className="flex items-center justify-center min-w-[44px] min-h-[44px] p-3 text-gray-600 bg-white border border-gray-200 rounded-xl hover:text-red-600 hover:bg-red-50 hover:border-red-200 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                        title={t.users.deleteUserTitle || 'Delete user'}
                        aria-label={t.users.deleteUserTitle || 'Delete user'}
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

      {/* Desktop-First User Form Modal */}
      {showUserForm && (
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
                      {editingUser ? (t.users.editUser || 'Edit User') : (t.users.addUser || 'Add User')}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {editingUser 
                        ? `Update ${editingUser.name}'s information` 
                        : 'Create a new user account'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowUserForm(false)
                    setEditingUser(undefined)
                    setRequiresPinOnly(false)
                  }}
                  disabled={isPending}
                  className="flex items-center justify-center min-w-[44px] min-h-[44px] p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 disabled:opacity-50 touch-manipulation"
                  title="Close modal"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Enhanced Modal Body */}
            <div className="px-8 py-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            <form id="user-form" action={handleFormSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">{t.users.name || 'Name'} *</label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={editingUser?.name}
                  className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 touch-manipulation"
                  placeholder={t.users.namePlaceholder || 'Enter full name'}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">{t.users.email || 'Email'}</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={editingUser?.email || ''}
                  className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 touch-manipulation"
                  placeholder={t.users.emailPlaceholder || 'Enter email address'}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">{t.users.username || 'Username'}</label>
                <input
                  name="username"
                  type="text"
                  defaultValue={editingUser?.username || ''}
                  className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 touch-manipulation"
                  placeholder={t.users.usernamePlaceholder || 'Enter username'}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">{t.users.role || 'Role'} *</label>
                <select
                  name="role"
                  required
                  defaultValue={editingUser?.role}
                  className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 touch-manipulation"
                >
                  <option value="">{t.users.selectRole || 'Select role'}</option>
                  <option value="hr">{t.auth.hr || 'HR'}</option>
                  <option value="manager">{t.auth.manager || 'Manager'}</option>
                  <option value="employee">{t.auth.employee || 'Employee'}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">{t.users.company || 'Company'} *</label>
                <select
                  name="companyId"
                  required
                  defaultValue={editingUser?.companyId}
                  className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 touch-manipulation"
                >
                  <option value="">{t.users.selectCompany || 'Select company'}</option>
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
                  className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 touch-manipulation"
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
                  placeholder={t.users.departmentPlaceholder}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">{t.users.position}</label>
                <input
                  name="position"
                  type="text"
                  defaultValue={editingUser?.position || ''}
                  className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 touch-manipulation"
                  placeholder={t.users.positionPlaceholder}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">{t.users.employeeId}</label>
                <input
                  name="employeeId"
                  type="text"
                  defaultValue={editingUser?.employeeId || ''}
                  className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 touch-manipulation"
                  placeholder={t.users.employeeIdPlaceholder}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">{t.users.personID}</label>
                <input
                  name="personID"
                  type="text"
                  defaultValue={editingUser?.personID || ''}
                  className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 touch-manipulation"
                  placeholder={t.users.personIdPlaceholder}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">{t.users.userType} *</label>
                <select
                  name="userType"
                  defaultValue={editingUser?.userType || 'office'}
                  className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 touch-manipulation"
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
                  className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 touch-manipulation"
                >
                  <option value="email">{t.users.email}</option>
                  <option value="username">{t.users.username}</option>
                  <option value="qr">QR Code</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">{t.users.shift}</label>
                <input
                  name="shift"
                  type="text"
                  defaultValue={editingUser?.shift || ''}
                  className="w-full px-4 py-3 min-h-[44px] text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-200 shadow-sm hover:border-gray-300 touch-manipulation"
                  placeholder={t.users.shiftPlaceholder}
                />
              </div>

              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    name="active"
                    type="checkbox"
                    defaultChecked={editingUser?.active ?? true}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2 transition-colors touch-manipulation"
                  />
                  <span className="text-sm font-bold text-gray-900">{t.users.activeUser || 'Active User'}</span>
                </label>
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
                  <span className="text-sm font-bold text-gray-900">{t.users.requiresPinOnly || 'Requires PIN Only'}</span>
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
                    placeholder={t.users.fourDigitPin}
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
                onClick={() => {
                  setShowUserForm(false)
                  setEditingUser(undefined)
                  setRequiresPinOnly(false)
                }}
                disabled={isPending}
                className="px-6 py-3 min-h-[44px] text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                {t.common?.cancel || 'Cancel'}
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
                {isPending ? (t.common?.saving || 'Saving...') : (editingUser ? (t.users.updateUser || 'Update User') : (t.users.createUser || 'Create User'))}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-xl max-w-lg w-full">
            {/* Enhanced Warning Header */}
            <div className="px-8 py-6 border-b border-gray-200/60 bg-gradient-to-r from-red-50/50 to-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.882 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-900">
                    {t.users.deleteUser || 'Delete User'}
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>
            
            {/* Enhanced Warning Content */}
            <div className="px-8 py-6">
              <div className="mb-6">
                <p className="text-base text-gray-700 mb-4">
                  {t.users.deleteConfirmMessage || 'Are you sure you want to delete'} <strong className="text-gray-900">{showDeleteConfirm.user.name}</strong>?
                </p>
                
                {/* User Info Preview */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                      {showDeleteConfirm.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {showDeleteConfirm.user.name}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {showDeleteConfirm.user.email || showDeleteConfirm.user.username} • {getRoleDisplayName(showDeleteConfirm.user.role)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.882 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="text-sm text-red-800">
                      <p className="font-semibold mb-1">This will permanently:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Delete all user data and account access</li>
                        <li>Remove {showDeleteConfirm.user._count.evaluationsReceived} evaluation records</li>
                        <li>Unassign {showDeleteConfirm.user._count.employees} direct reports</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Action Footer */}
            <div className="px-8 py-6 border-t border-gray-200/60 bg-gradient-to-r from-gray-50/50 to-white flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={isPending}
                className="px-6 py-3 min-h-[44px] text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                {t.common?.cancel || 'Cancel'}
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm.user.id)}
                disabled={isPending}
                className="px-6 py-3 min-h-[44px] text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation flex items-center gap-2"
              >
                {isPending && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                )}
                {isPending ? (t.users.deleting || 'Deleting...') : (t.users.deleteUser || 'Delete User')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}