'use client'

import { useState, useCallback } from 'react'

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    options: ConfirmOptions
    onConfirm: () => void
    onCancel: () => void
  }>({
    isOpen: false,
    options: {
      title: '',
      message: '',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      type: 'danger'
    },
    onConfirm: () => {},
    onCancel: () => {}
  })

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options: {
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          type: 'danger',
          ...options
        },
        onConfirm: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }))
          resolve(true)
        },
        onCancel: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }))
          resolve(false)
        }
      })
    })
  }, [])

  const closeConfirm = useCallback(() => {
    setConfirmState(prev => ({ ...prev, isOpen: false }))
  }, [])

  return {
    confirmState,
    confirm,
    closeConfirm
  }
}