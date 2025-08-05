'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import UserForm from '@/components/UserForm'
import ToastContainer from '@/components/ToastContainer'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/hooks/useConfirm'
import type { User, Company } from '@/types'

interface UserWithDetails extends User {
  company: Company
  manager?: Pick<User, 'name' | 'email'> | null
  _count: {
    employees: number
    evaluationsReceived: number
  }
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const { toasts, success, error, removeToast } = useToast()
  const { confirmState, confirm } = useConfirm()
  const [users, setUsers] = useState<UserWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithDetails | undefined>(undefined)
  const [companies, setCompanies] = useState<Company[]>([])
  const [managers, setManagers] = useState<Pick<User, 'id' | 'name' | 'email'>[]>([])

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    const userRole = session.user?.role
    if (userRole !== 'hr') {
      router.push('/dashboard')
      return
    }

    fetchUsers()
    fetchCompanies()
  }, [session, status, router])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/admin/companies')
      if (response.ok) {
        const data = await response.json()
        setCompanies(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const fetchManagers = useCallback(async () => {
    try {
      const managerUsers = users.filter(user => user.role === 'manager' || user.role === 'hr')
      setManagers(managerUsers)
    } catch (error) {
      console.error('Error filtering managers:', error)
    }
  }, [users])

  useEffect(() => {
    if (users.length > 0) {
      fetchManagers()
    }
  }, [users, fetchManagers])

  const handleSaveUser = async (userData: Partial<User> & { password?: string }) => {
    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users'
      const method = editingUser ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        await fetchUsers() // Refresh the list
        setShowUserForm(false)
        setEditingUser(undefined)
        success(editingUser ? 'User updated successfully' : 'User created successfully')
      } else {
        const errorData = await response.json()
        error(`Error: ${errorData.error}`)
      }
    } catch {
      error('Failed to save user')
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmed = await confirm({
      title: 'Delete User',
      message: `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchUsers() // Refresh the list
        success('User deleted successfully')
      } else {
        const errorData = await response.json()
        error(`Error: ${errorData.error}`)
      }
    } catch {
      error('Failed to delete user')
    }
  }

  const handleEditUser = (user: UserWithDetails) => {
    setEditingUser(user)
    setShowUserForm(true)
  }

  const handleAddUser = () => {
    setEditingUser(undefined)
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === '' || user.role === filterRole
    
    return matchesSearch && matchesRole
  })

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t.common.loading}</div>
      </div>
    )
  }

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
                <p className="text-xs text-gray-500">{users.length} {t.users.totalUsers}</p>
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
          
          {/* Actions Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddUser}
                className="flex items-center justify-center space-x-1 px-2 py-2 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-200 active:scale-95 transition-all duration-150 touch-manipulation whitespace-nowrap tracking-tighter leading-none"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                <span>{t.users.addUser}</span>
              </button>
              <button
                onClick={() => router.push('/users/advanced')}
                className="flex items-center justify-center space-x-1 px-2 py-2 bg-orange-100 text-orange-700 text-xs font-medium rounded-lg hover:bg-orange-200 active:scale-95 transition-all duration-150 touch-manipulation whitespace-nowrap tracking-tighter leading-none"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                <span>{t.users.advanced}</span>
              </button>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder={t.users.searchUsers}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
            <div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="">{t.users.allRoles}</option>
                <option value="hr">{t.auth.hr}</option>
                <option value="manager">{t.auth.manager}</option>
                <option value="employee">{t.auth.employee}</option>
              </select>
            </div>
          </div>
        </div>

        {/* User List Section */}
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        user.role === 'hr' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {user.active ? t.users.active : t.users.inactive}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {user.email || user.username} • {user.company.name}
                    </p>
                    {user.department && (
                      <p className="text-xs text-gray-500">
                        {t.users.department}: {user.department}
                      </p>
                    )}
                    {user.manager && (
                      <p className="text-xs text-gray-500">
                        {t.users.manager}: {user.manager.name}
                      </p>
                    )}
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      {user._count.employees > 0 && (
                        <span className="flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                          <span>{t.users.manages} {user._count.employees}</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                        </svg>
                        <span>{user._count.evaluationsReceived} {t.users.evaluationsReceived}</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-1 ml-3">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    title={t.common.edit}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id, user.name)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    title={t.common.delete}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <p className="text-gray-500">{t.users.noUsersFound}</p>
            </div>
          )}
        </div>
      </div>

      {/* User Form Modal */}
      {showUserForm && (
        <UserForm
          user={editingUser}
          onSave={handleSaveUser}
          onCancel={() => {
            setShowUserForm(false)
            setEditingUser(undefined)
          }}
          companies={companies}
          managers={managers}
        />
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.options.title}
        message={confirmState.options.message}
        confirmText={confirmState.options.confirmText}
        cancelText={confirmState.options.cancelText}
        type={confirmState.options.type}
        onConfirm={confirmState.onConfirm}
        onCancel={confirmState.onCancel}
      />
    </div>
  )
}