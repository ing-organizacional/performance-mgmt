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
  const [filterDepartment, setFilterDepartment] = useState('')
  
  // Modal state
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithDetails | undefined>(undefined)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ user: UserWithDetails } | null>(null)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState<{ user: UserWithDetails, formData: FormData } | null>(null)
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

  // Get unique departments from users
  const departments = Array.from(
    new Set(initialUsers
      .map(user => user.department)
      .filter((dept): dept is string => dept !== null && dept !== undefined))
  ).sort()

  const filteredUsers = initialUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === '' || user.role === filterRole
    const matchesDepartment = filterDepartment === '' || user.department === filterDepartment
    
    return matchesSearch && matchesRole && matchesDepartment
  })

  // Event handlers
  const handleFormSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = editingUser 
        ? await updateUser(editingUser.id, formData)
        : await createUser(formData)

      if (result.success) {
        const message = result.messageKey ? t.users[result.messageKey as keyof typeof t.users] : result.message
        success(message)
        setShowUserForm(false)
        setEditingUser(undefined)
        setRequiresPinOnly(false)
        router.refresh() // Refresh server data
      } else {
        const errorMessage = result.messageKey ? t.users[result.messageKey as keyof typeof t.users] || result.message : result.message
        error(errorMessage)
      }
    })
  }

  const handleDeleteUser = async (userId: string) => {
    if (!showDeleteConfirm) return

    startTransition(async () => {
      const result = await deleteUser(userId)
      
      if (result.success) {
        const message = result.messageKey ? t.users[result.messageKey as keyof typeof t.users] : result.message
        success(message)
        setShowDeleteConfirm(null)
        router.refresh() // Refresh server data
      } else {
        let errorMessage = result.message
        
        // Translate error message if messageKey is provided
        if (result.messageKey) {
          if (result.messageKey === 'cannotDeleteUserManagesEmployees' && result.messageData) {
            errorMessage = t.users.cannotDeleteUserManagesEmployees.replace('{count}', String((result.messageData as { count: number }).count))
          } else if (result.messageKey === 'cannotDeleteUserHasEvaluations' && result.messageData) {
            const issues = []
            const data = result.messageData as {
              employeeEvaluationsCount: number
              managerEvaluationsCount: number
              evaluationAssignmentsCount: number
              partialAssessmentsCount: number
            }
            
            if (data.employeeEvaluationsCount > 0) {
              issues.push(t.users.evaluationsAsEmployee.replace('{count}', String(data.employeeEvaluationsCount)))
            }
            if (data.managerEvaluationsCount > 0) {
              issues.push(t.users.evaluationsAsManager.replace('{count}', String(data.managerEvaluationsCount)))
            }
            if (data.evaluationAssignmentsCount > 0) {
              issues.push(t.users.evaluationAssignments.replace('{count}', String(data.evaluationAssignmentsCount)))
            }
            if (data.partialAssessmentsCount > 0) {
              issues.push(t.users.partialAssessments.replace('{count}', String(data.partialAssessmentsCount)))
            }
            
            errorMessage = t.users.cannotDeleteUserHasEvaluations.replace('{details}', issues.join(', '))
          } else {
            errorMessage = t.users[result.messageKey as keyof typeof t.users] || result.message
          }
        }
        
        error(errorMessage)
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

  const handleArchiveUserClick = (user: UserWithDetails) => {
    // Check if manager has active direct reports
    if (user.role === 'manager' && user._count.employees > 0) {
      error(`${t.users.cannotArchiveManager} - ${t.users.manages} ${user._count.employees} ${t.users.activeEmployees}`)
      return
    }
    // Show archive confirmation modal
    setShowArchiveConfirm({ user, formData: new FormData() })
  }

  const handleCloseUserForm = () => {
    setShowUserForm(false)
    setEditingUser(undefined)
    setRequiresPinOnly(false)
  }

  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirm(null)
  }

  const handleArchiveUser = async (reason?: string) => {
    if (!showArchiveConfirm) return

    startTransition(async () => {
      // Use the dedicated archiveUser function instead of updateUser
      const { archiveUser } = await import('@/lib/actions/users')
      const result = await archiveUser(showArchiveConfirm.user.id, reason)
      
      if (result.success) {
        const message = result.messageKey ? t.users[result.messageKey as keyof typeof t.users] : result.message
        success(message)
        setShowUserForm(false)
        setEditingUser(undefined)
        setRequiresPinOnly(false)
        setShowArchiveConfirm(null)
        router.refresh() // Refresh server data
      } else {
        const errorMessage = result.messageKey ? t.users[result.messageKey as keyof typeof t.users] || result.message : result.message
        error(errorMessage)
      }
    })
  }

  const handleCloseArchiveConfirm = () => {
    setShowArchiveConfirm(null)
  }

  return {
    // State
    searchTerm,
    setSearchTerm,
    filterRole,
    setFilterRole,
    filterDepartment,
    setFilterDepartment,
    departments,
    showUserForm,
    editingUser,
    showDeleteConfirm,
    showArchiveConfirm,
    requiresPinOnly,
    setRequiresPinOnly,
    isPending,
    toasts,
    filteredUsers,
    
    // Handlers
    handleFormSubmit,
    handleDeleteUser,
    handleArchiveUser,
    handleEditUser,
    handleAddUser,
    handleArchiveUserClick,
    handleCloseUserForm,
    handleCloseDeleteConfirm,
    handleCloseArchiveConfirm,
    removeToast,
    getRoleDisplayName
  }
}