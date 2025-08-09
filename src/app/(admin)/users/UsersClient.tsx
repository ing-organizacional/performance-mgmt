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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 py-3">
          {/* Title Section */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-gray-900 truncate">{t.users.userManagement}</h1>
                <p className="text-xs text-gray-500">{t.users.manageUsersDescription}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center justify-center w-9 h-9 bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-95 transition-all duration-150 touch-manipulation ml-3"
              title={t.auth.signOut}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <button
                onClick={handleAddUser}
                disabled={isPending}
                className="flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 active:scale-95 transition-all duration-150 touch-manipulation whitespace-nowrap disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>{t.users.addUser}</span>
              </button>
              <button
                onClick={() => router.push('/users/advanced')}
                className="flex items-center justify-center space-x-1 px-3 py-2 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 active:scale-95 transition-all duration-150 touch-manipulation whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{t.users.advanced}</span>
              </button>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-4 py-4 bg-white border-b border-gray-200">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={t.users.searchUsers || "Search users..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  title={t.users.clearSearch}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{t.users.allRoles}</option>
            <option value="hr">{t.auth.hr}</option>
            <option value="manager">{t.auth.manager}</option>
            <option value="employee">{t.auth.employee}</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="px-4 py-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {t.users.usersCount} ({filteredUsers.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <div key={user.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* User Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{user.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                          user.role === 'hr' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getRoleDisplayName(user.role)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <span className="truncate">
                          {user.email || user.username}
                        </span>
                        {user.department && (
                          <>
                            <span>•</span>
                            <span className="truncate">{user.department}</span>
                          </>
                        )}
                        {user.position && (
                          <>
                            <span>•</span>
                            <span className="truncate">{user.position}</span>
                          </>
                        )}
                        {user.employeeId && (
                          <>
                            <span>•</span>
                            <span className="truncate">ID: {user.employeeId}</span>
                          </>
                        )}
                      </div>
                      
                      {user.manager && (
                        <p className="text-xs text-gray-500 mb-1 truncate">
                          {t.users.reportsTo} {user.manager.name}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {user._count.employees} {t.users.reports}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {user._count.evaluationsReceived} {t.users.evaluations}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 ml-4 shrink-0">
                    <button
                      onClick={() => handleEditUser(user)}
                      disabled={isPending}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50"
                      title={t.users.editUserTitle}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm({ user })}
                      disabled={isPending}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                      title={t.users.deleteUserTitle}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Form Modal */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingUser ? t.users.editUser : t.users.addUser}
                </h3>
                <button
                  onClick={() => {
                    setShowUserForm(false)
                    setEditingUser(undefined)
                    setRequiresPinOnly(false)
                  }}
                  disabled={isPending}
                  className="p-2 -mr-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="px-4 py-4">
            <form id="user-form" action={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t.users.name} *</label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={editingUser?.name}
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  placeholder={t.users.namePlaceholder}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t.users.email}</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={editingUser?.email || ''}
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  placeholder={t.users.emailPlaceholder}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t.users.username}</label>
                <input
                  name="username"
                  type="text"
                  defaultValue={editingUser?.username || ''}
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  placeholder={t.users.usernamePlaceholder}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t.users.role} *</label>
                <select
                  name="role"
                  required
                  defaultValue={editingUser?.role}
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">{t.users.selectRole}</option>
                  <option value="hr">{t.auth.hr}</option>
                  <option value="manager">{t.auth.manager}</option>
                  <option value="employee">{t.auth.employee}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t.users.company} *</label>
                <select
                  name="companyId"
                  required
                  defaultValue={editingUser?.companyId}
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">{t.users.selectCompany}</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t.users.manager}</label>
                <select
                  name="managerId"
                  defaultValue={editingUser?.managerId || ''}
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">{t.users.noManager}</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>{manager.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t.users.department}</label>
                <input
                  name="department"
                  type="text"
                  defaultValue={editingUser?.department || ''}
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  placeholder={t.users.departmentPlaceholder}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t.users.position}</label>
                <input
                  name="position"
                  type="text"
                  defaultValue={editingUser?.position || ''}
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  placeholder={t.users.positionPlaceholder}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t.users.employeeId}</label>
                <input
                  name="employeeId"
                  type="text"
                  defaultValue={editingUser?.employeeId || ''}
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  placeholder={t.users.employeeIdPlaceholder}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t.users.personID}</label>
                <input
                  name="personID"
                  type="text"
                  defaultValue={editingUser?.personID || ''}
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  placeholder={t.users.personIdPlaceholder}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t.users.userType} *</label>
                <select
                  name="userType"
                  defaultValue={editingUser?.userType || 'office'}
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="office">{t.users.officeWorker}</option>
                  <option value="operational">{t.users.operationalWorker}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t.users.loginMethod} *</label>
                <select
                  name="loginMethod"
                  defaultValue={editingUser?.loginMethod || 'email'}
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="email">{t.users.email}</option>
                  <option value="username">{t.users.username}</option>
                  <option value="qr">QR Code</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t.users.shift}</label>
                <input
                  name="shift"
                  type="text"
                  defaultValue={editingUser?.shift || ''}
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  placeholder={t.users.shiftPlaceholder}
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    name="active"
                    type="checkbox"
                    defaultChecked={editingUser?.active ?? true}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-gray-900">{t.users.activeUser}</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {editingUser ? t.users.newPassword : `${t.users.password} *`}
                </label>
                <input
                  name="password"
                  type="password"
                  required={!editingUser}
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  placeholder={t.users.enterPassword}
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    name="requiresPinOnly"
                    type="checkbox"
                    checked={requiresPinOnly}
                    onChange={(e) => setRequiresPinOnly(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-gray-900">{t.users.requiresPinOnly}</span>
                </label>
              </div>

              {requiresPinOnly && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">{t.users.pinCode} *</label>
                  <input
                    name="pinCode"
                    type="password"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    defaultValue={editingUser?.pinCode ? '****' : ''}
                    className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    placeholder={t.users.fourDigitPin}
                    required
                  />
                </div>
              )}

            </form>
            </div>
            
            {/* Modal Footer */}
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowUserForm(false)
                  setEditingUser(undefined)
                  setRequiresPinOnly(false)
                }}
                disabled={isPending}
                className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:scale-95 transition-all duration-150 touch-manipulation disabled:opacity-50"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                form="user-form"
                disabled={isPending}
                className="px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all duration-150 touch-manipulation disabled:opacity-50"
              >
                {isPending ? t.common.saving : (editingUser ? t.users.updateUser : t.users.createUser)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm max-w-md w-full">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{t.users.deleteUser}</h3>
            </div>
            
            <div className="px-4 py-4">
              <p className="text-sm text-gray-600">
                {t.users.deleteConfirmMessage} <strong>{showDeleteConfirm.user.name}</strong>? 
                {t.users.actionCannotBeUndone}
              </p>
            </div>

            <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={isPending}
                className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:scale-95 transition-all duration-150 touch-manipulation disabled:opacity-50"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm.user.id)}
                disabled={isPending}
                className="px-3 py-2 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-95 transition-all duration-150 touch-manipulation disabled:opacity-50"
              >
                {isPending ? t.users.deleting : t.users.deleteUser}
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