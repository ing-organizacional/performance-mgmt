'use client'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'gray' | 'red'
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'blue' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }
  
  const colorClasses = {
    blue: 'border-blue-600',
    green: 'border-green-600',
    orange: 'border-orange-600', 
    purple: 'border-purple-600',
    gray: 'border-gray-600',
    red: 'border-red-600'
  }

  return (
    <div 
      className={`${sizeClasses[size]} ${colorClasses[color]} border-2 border-t-transparent rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  )
}