'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import UserForm from '@/components/UserForm'

interface User {
  id: string
  name: string
  email?: string
  username?: string
  role: string
  department?: string
  userType: string
  managerId?: string
  companyId: string
  active: boolean
  company: {
    name: string
    code: string
  }
  manager?: {
    name: string
    email?: string
  }
  _count: {
    employees: number
    evaluationsReceived: number
  }
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined)
  const [companies, setCompanies] = useState([])
  const [managers, setManagers] = useState<any[]>([])

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    const userRole = (session.user as any)?.role
    if (userRole !== 'hr') {
      router.push('/dashboard')
      return
    }

    fetchUsers()
    fetchCompanies()
  }, [session, status, router])

  useEffect(() => {
    if (users.length > 0) {
      fetchManagers()
    }
  }, [users])

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

  const fetchManagers = async () => {
    try {
      const managerUsers = users.filter(user => user.role === 'manager' || user.role === 'hr')
      setManagers(managerUsers)
    } catch (error) {
      console.error('Error filtering managers:', error)
    }
  }

  const handleSaveUser = async (userData: any) => {
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
        alert(editingUser ? 'User updated successfully' : 'User created successfully')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Failed to save user')
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchUsers() // Refresh the list
        alert('User deleted successfully')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Failed to delete user')
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setShowUserForm(true)
  }

  const handleAddUser = () => {
    setEditingUser(undefined)
    setShowUserForm(true)
  }

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        alert(`${t.users.successfullyImported} ${result.imported} users`)
        fetchUsers() // Refresh the list
      } else {
        const error = await response.json()
        alert(`${t.users.importFailed}: ${error.error}`)
      }
    } catch (error) {
      alert(t.users.uploadFailed)
    } finally {
      setUploading(false)
      // Reset file input
      event.target.value = ''
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
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{t.users.userManagement}</h1>
                <p className="text-sm text-gray-600 mt-1">{users.length} {t.users.totalUsers}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Add User
              </button>
              <LanguageSwitcher />
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-lg hover:bg-green-700 active:scale-95 transition-all duration-150 touch-manipulation"
                title={t.auth.signOut}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
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
                <option value="hr">HR</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
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
                        {user.role}
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

        {/* CSV Upload Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.users.importUsersCSV}</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700 mb-2">
                {t.users.uploadCSVFile}
              </label>
              <input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                disabled={uploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              {uploading && (
                <p className="text-sm text-blue-600 mt-2">{t.users.uploadingProcessing}</p>
              )}
            </div>
            <div className="text-xs text-gray-500">
              <p className="font-medium mb-1">{t.users.csvFormat}</p>
              <p>name,email,username,role,department,userType,password,managerEmail,companyCode</p>
              <p className="mt-2">
                <a 
                  href="/example-users.csv" 
                  download 
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {t.users.downloadExample}
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Prisma Studio Option */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.users.databaseManagement}</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {t.users.advancedOperations}
              </p>
            </div>
            <button
              onClick={() => window.open('http://localhost:5555', '_blank')}
              className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              {t.users.openPrismaStudio}
            </button>
          </div>
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
    </div>
  )
}