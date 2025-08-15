/**
 * Toast Notification Hook
 * 
 * Provides a comprehensive toast notification system with:
 * - Multiple toast types (success, error, info, warning)
 * - Auto-dismissal with configurable duration
 * - Queue management for multiple simultaneous toasts
 * - Type-safe message handling with unique IDs
 * - Imperative API for easy integration with Server Actions
 * - Memory-efficient state management with useCallback optimization
 */

'use client'

import { useState, useCallback } from 'react'

export interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info', duration?: number) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastMessage = {
      id,
      message,
      type,
      duration
    }
    
    setToasts(prev => [...prev, newToast])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const success = useCallback((message: string, duration?: number) => {
    addToast(message, 'success', duration)
  }, [addToast])

  const error = useCallback((message: string, duration?: number) => {
    addToast(message, 'error', duration)
  }, [addToast])

  const warning = useCallback((message: string, duration?: number) => {
    addToast(message, 'warning', duration)
  }, [addToast])

  const info = useCallback((message: string, duration?: number) => {
    addToast(message, 'info', duration)
  }, [addToast])

  return {
    toasts,
    success,
    error,
    warning,
    info,
    removeToast
  }
}