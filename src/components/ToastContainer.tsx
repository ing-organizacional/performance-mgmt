'use client'

import Toast from './Toast'
import { ToastMessage } from '@/hooks/useToast'

interface ToastContainerProps {
  toasts: ToastMessage[]
  onRemoveToast: (id: string) => void
}

export default function ToastContainer({ toasts, onRemoveToast }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => onRemoveToast(toast.id)}
        />
      ))}
    </div>
  )
}