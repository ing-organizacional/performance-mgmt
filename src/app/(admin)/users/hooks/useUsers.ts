import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
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

interface UseUsersProps {
  initialUsers: UserWithDetails[]
}

export function useUsers({ initialUsers }: UseUsersProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const { toasts, success, error, removeToast } = useToast()
  const [isPending, startTransition] = useTransition()
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  
  // Modal state
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithDetails | undefined>(undefined)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ user: UserWithDetails } | null>(null)
  const [requiresPinOnly, setRequiresPinOnly] = useState(false)

  // Helper functions
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

  // Event handlers
  const handleFormSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = editingUser 
        ? await updateUser(editingUser.id, formData)
        : await createUser(formData)

      if (result.success) {
        success(result.message)
        setShowUserForm(false)
        setEditingUser(undefined)
        setRequiresPinOnly(false)
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

  const handleDeleteUserClick = (user: UserWithDetails) => {
    setShowDeleteConfirm({ user })
  }

  const handleCloseUserForm = () => {
    setShowUserForm(false)
    setEditingUser(undefined)
    setRequiresPinOnly(false)
  }

  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirm(null)
  }

  return {
    // State
    searchTerm,
    setSearchTerm,
    filterRole,
    setFilterRole,
    showUserForm,
    editingUser,
    showDeleteConfirm,
    requiresPinOnly,
    setRequiresPinOnly,
    isPending,
    toasts,
    filteredUsers,
    
    // Handlers
    handleFormSubmit,
    handleDeleteUser,
    handleEditUser,
    handleAddUser,
    handleDeleteUserClick,
    handleCloseUserForm,
    handleCloseDeleteConfirm,
    removeToast,
    getRoleDisplayName
  }
}