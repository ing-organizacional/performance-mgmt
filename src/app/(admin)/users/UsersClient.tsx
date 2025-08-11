'use client'

import { ToastContainer } from '@/components/ui'
import type { User, Company } from '@/types'

// Import custom hooks
import { useUsers } from './hooks'

// Import components
import { 
  UsersHeader, 
  UsersFilters, 
  UsersList, 
  UserFormModal, 
  DeleteUserModal,
  ArchiveUserModal
} from './components'

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
  // Custom hook for all business logic
  const {
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
  } = useUsers({ initialUsers })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Desktop-First Professional Header */}
      <UsersHeader 
        onAddUser={handleAddUser}
        isPending={isPending}
      />

      {/* Desktop-First Search and Filters */}
      <UsersFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterRole={filterRole}
        setFilterRole={setFilterRole}
        filterDepartment={filterDepartment}
        setFilterDepartment={setFilterDepartment}
        departments={departments}
        filteredUsers={filteredUsers}
      />

      {/* Desktop-First Users List */}
      <UsersList
        filteredUsers={filteredUsers}
        initialUsers={initialUsers}
        searchTerm={searchTerm}
        filterRole={filterRole}
        isPending={isPending}
        onAddUser={handleAddUser}
        onEditUser={handleEditUser}
        onArchiveUser={handleArchiveUserClick}
        getRoleDisplayName={getRoleDisplayName}
      />

      {/* Desktop-First User Form Modal */}
      <UserFormModal
        isOpen={showUserForm}
        editingUser={editingUser}
        companies={companies}
        managers={managers}
        requiresPinOnly={requiresPinOnly}
        setRequiresPinOnly={setRequiresPinOnly}
        isPending={isPending}
        onClose={handleCloseUserForm}
        onSubmit={handleFormSubmit}
      />

      {/* Enhanced Delete Confirmation Modal */}
      <DeleteUserModal
        isOpen={!!showDeleteConfirm}
        user={showDeleteConfirm?.user}
        isPending={isPending}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleDeleteUser}
        getRoleDisplayName={getRoleDisplayName}
      />

      {/* Archive Confirmation Modal */}
      <ArchiveUserModal
        isOpen={!!showArchiveConfirm}
        user={showArchiveConfirm?.user}
        isPending={isPending}
        onClose={handleCloseArchiveConfirm}
        onConfirm={handleArchiveUser}
        getRoleDisplayName={getRoleDisplayName}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}