'use client'

import { useState, useTransition } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useToast } from '@/hooks/useToast'
import { changePassword } from '@/lib/actions/users'
import type { User } from 'next-auth'

interface ChangePasswordModalProps {
  user: User
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ChangePasswordModal({ isOpen, onClose, onSuccess }: ChangePasswordModalProps) {
  const { t } = useLanguage()
  const { success, error } = useToast()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleFormSubmit = async (formData: FormData) => {
    // Clear previous errors
    setErrors({})
    
    startTransition(async () => {
      const result = await changePassword(formData)

      if (result.success) {
        success(t.settings?.passwordUpdated || result.message || 'Password updated successfully')
        onSuccess()
        onClose()
      } else {
        // Handle validation errors
        if (result.errors) {
          setErrors(result.errors)
        }
        const errorMessage = result.message || 'Failed to update password'
        error(errorMessage)
      }
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              {t.settings?.changePassword || 'Change Password'}
            </h3>
            <button
              onClick={onClose}
              disabled={isPending}
              className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="px-4 py-3">
          <form id="password-form" action={handleFormSubmit} className="space-y-3">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t.settings?.currentPassword || 'Current Password'} *
              </label>
              <div className="relative">
                <input
                  name="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  className="w-full px-3 py-2 pr-10 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  placeholder={t.settings?.currentPasswordPlaceholder || "Enter your current password"}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878A3 3 0 0112 9c.2 0 .393.02.586.057m0 0a3.001 3.001 0 013.411 2.987M19 12c0 1.042-.154 2.036-.432 2.965m-.818 1.532A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029M9.878 9.878l4.242 4.242M14.12 14.12L12 16.24" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-xs text-red-600 mt-1">{errors.currentPassword[0]}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t.settings?.newPassword || 'New Password'} *
              </label>
              <div className="relative">
                <input
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 pr-10 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  placeholder={t.settings?.newPasswordPlaceholder || "Enter your new password (min 8 characters)"}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878A3 3 0 0112 9c.2 0 .393.02.586.057m0 0a3.001 3.001 0 013.411 2.987M19 12c0 1.042-.154 2.036-.432 2.965m-.818 1.532A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029M9.878 9.878l4.242 4.242M14.12 14.12L12 16.24" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-xs text-red-600 mt-1">{errors.newPassword[0]}</p>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t.settings?.confirmPassword || 'Confirm New Password'} *
              </label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 pr-10 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  placeholder={t.settings?.confirmPasswordPlaceholder || "Confirm your new password"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878A3 3 0 0112 9c.2 0 .393.02.586.057m0 0a3.001 3.001 0 013.411 2.987M19 12c0 1.042-.154 2.036-.432 2.965m-.818 1.532A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029M9.878 9.878l4.242 4.242M14.12 14.12L12 16.24" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">{errors.confirmPassword[0]}</p>
              )}
            </div>

            {/* Security note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>{t.settings?.passwordSecurityNote || 'Security Note: Your new password should be at least 8 characters long and contain a mix of letters, numbers, and symbols.'}</strong>
              </p>
            </div>
          </form>
        </div>

        <div className="px-4 py-3 border-t border-gray-200 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:scale-95 transition-all duration-150 touch-manipulation disabled:opacity-50"
          >
            {t.common?.cancel || 'Cancel'}
          </button>
          <button
            type="submit"
            form="password-form"
            disabled={isPending}
            className="px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:scale-95 transition-all duration-150 touch-manipulation disabled:opacity-50"
          >
            {isPending ? (t.common?.saving || 'Saving...') : (t.settings?.changePassword || 'Change Password')}
          </button>
        </div>
      </div>
    </div>
  )
}