'use client'

import { useState, useEffect } from 'react'
import type { UserFormProps, UserFormData } from '@/types'

export default function UserForm({ user, onSave, onCancel, companies = [], managers = [] }: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    id: user?.id,
    name: user?.name || '',
    email: user?.email || null,
    username: user?.username || null,
    role: user?.role || 'employee',
    department: user?.department || null,
    userType: user?.userType || 'office',
    managerId: user?.managerId || null,
    companyId: user?.companyId || companies[0]?.id || '',
    active: user?.active ?? true,
    passwordHash: user?.passwordHash || null,
    pinCode: user?.pinCode || null,
    loginMethod: user?.loginMethod || 'email',
    requiresPinOnly: user?.requiresPinOnly || false,
    employeeId: user?.employeeId || null,
    shift: user?.shift || null,
    lastLogin: user?.lastLogin || null,
    password: ''
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.companyId) {
      newErrors.companyId = 'Company is required'
    }

    if (formData.userType === 'office' && !formData.email?.trim()) {
      newErrors.email = 'Email is required for office workers'
    }

    if (formData.userType === 'operational' && !formData.username?.trim()) {
      newErrors.username = 'Username is required for operational workers'
    }

    if (!user && !formData.password?.trim()) {
      newErrors.password = 'Password is required for new users'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      // Clean up data based on user type
      const userData = { ...formData }
      if (userData.userType === 'office') {
        userData.username = null
      } else {
        userData.email = null
      }

      onSave(userData)
    } catch (error) {
      console.error('Error saving user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  useEffect(() => {
    if (user) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [user])

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300" />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white w-full max-w-2xl sm:rounded-lg shadow-xl sm:max-h-[90vh] max-h-screen overflow-y-auto transform transition-transform duration-300">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {user ? 'Edit User' : 'Add New User'}
              </h2>
              <button
                onClick={onCancel}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-6 pt-6">

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="John Smith"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* User Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Worker Type *
              </label>
              <select
                value={formData.userType}
                onChange={(e) => handleChange('userType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="office">Office Worker (uses email/password)</option>
                <option value="operational">Operational Worker (uses username/PIN)</option>
              </select>
            </div>

            {/* Email or Username based on type */}
            {formData.userType === 'office' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="john@company.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username || ''}
                  onChange={(e) => handleChange('username', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="john.smith"
                />
                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {user ? 'New Password (leave blank to keep current)' : 'Password *'}
              </label>
              <input
                type="password"
                value={formData.password || ''}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={formData.userType === 'operational' ? '4-digit PIN' : 'Password'}
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="hr">HR</option>
              </select>
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company *
              </label>
              <select
                value={formData.companyId}
                onChange={(e) => handleChange('companyId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.companyId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} ({company.code})
                  </option>
                ))}
              </select>
              {errors.companyId && <p className="text-red-500 text-sm mt-1">{errors.companyId}</p>}
            </div>

            {/* Manager */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manager (optional)
              </label>
              <select
                value={formData.managerId || ''}
                onChange={(e) => handleChange('managerId', e.target.value || '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="">No Manager</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name} {manager.email && `(${manager.email})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department (optional)
              </label>
              <input
                type="text"
                value={formData.department || ''}
                onChange={(e) => handleChange('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Operations, Sales, Manufacturing..."
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => handleChange('active', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                Active User
              </label>
            </div>

            {/* Form Actions */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-4 -mx-6 px-6 pb-6">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors touch-manipulation"
                >
                  {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
                </button>
              </div>
            </div>
          </form>
          </div>
        </div>
      </div>
    </>
  )
}