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
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
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
            <div className="flex items-center space-x-3">
              <button
                onClick={handleAddUser}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 active:scale-95 transition-all duration-150 touch-manipulation"
              >
                Add User
              </button>
              <button
                onClick={() => router.push('/users/advanced')}
                className="px-3 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 active:scale-95 transition-all duration-150 touch-manipulation"
              >
                {t.users.advanced}
              </button>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Main Content with top padding to account for fixed header */}
      <div className="pt-28 px-4 py-6 space-y-6">
        {/* User Management Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder={t.users.searchUsers}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
            <div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{t.users.allRoles}</option>
                <option value="hr">{t.auth.hr}</option>
                <option value="manager">{t.auth.manager}</option>
                <option value="employee">{t.auth.employee}</option>
              </select>
            </div>
          </div>

          {/* User List */}
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-900">{user.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'hr' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.active ? t.users.active : t.users.inactive}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      <p>{user.email || user.username} • {user.company.name}</p>
                      {user.department && <p>{t.users.department}: {user.department}</p>}
                      {user.manager && <p>{t.users.manager}: {user.manager.name}</p>}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {user._count.employees > 0 && <span>{t.users.manages} {user._count.employees} employees • </span>}
                      {user._count.evaluationsReceived} {t.users.evaluationsReceived}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                    >
                      {t.common.edit}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.name)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                    >
                      {t.common.delete}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {t.users.noUsersFound}
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