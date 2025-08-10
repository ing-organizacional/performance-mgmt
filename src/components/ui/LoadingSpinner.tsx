'use client'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'green' | 'orange' | 'gray' | 'red'
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'primary' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }
  
  const colorClasses = {
    primary: 'border-primary',
    green: 'border-green-500',
    orange: 'border-amber-500',
    gray: 'border-gray-600',
    red: 'border-red-500'
  }

  return (
    <div 
      className={`${sizeClasses[size]} ${colorClasses[color]} border-2 border-t-transparent rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  )
}