/**
 * Star Rating Component
 * 
 * Interactive star rating component for performance evaluations with accessibility support.
 * Provides visual feedback for rating selections and supports multiple sizes for different
 * UI contexts. Optimized for both desktop and mobile interactions.
 * 
 * Key Features:
 * - 5-star rating system with individual star selection
 * - Multiple size variants (small, medium, large) for UI flexibility
 * - Full accessibility support with ARIA labels and keyboard navigation
 * - Touch-optimized interaction zones for mobile devices
 * - Smooth hover and active state animations
 * - Disabled state support for read-only contexts
 * - Memoized rendering for performance optimization
 * 
 * Accessibility:
 * - Semantic button elements with descriptive ARIA labels
 * - Keyboard navigation support for all rating options
 * - High contrast visual states for better visibility
 * - Screen reader compatible with clear rating announcements
 * 
 * Performance:
 * - React.memo optimization to prevent unnecessary re-renders
 * - Efficient event handling with useCallback hooks
 * - CSS-based animations for smooth performance
 */

'use client'

import { memo, useCallback } from 'react'

interface StarRatingProps {
  rating: number | null
  onRatingChange: (rating: number) => void
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
}

const StarRating = memo(function StarRating({ 
  rating, 
  onRatingChange, 
  disabled = false,
  size = 'large'
}: StarRatingProps) {
  const sizeClasses = {
    small: 'p-2 min-h-[36px] min-w-[36px] w-6 h-6',
    medium: 'p-2.5 min-h-[40px] min-w-[40px] w-8 h-8', 
    large: 'p-3 min-h-[44px] min-w-[44px] w-10 h-10'
  }

  const handleStarClick = useCallback((starValue: number) => {
    if (!disabled) {
      onRatingChange(starValue)
    }
  }, [onRatingChange, disabled])

  return (
    <div className="flex gap-2 justify-center">
      {[1, 2, 3, 4, 5].map((star) => {
        const isSelected = rating && rating >= star
        
        return (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            disabled={disabled}
            className={`flex items-center justify-center rounded-lg transition-colors duration-150 touch-manipulation ${sizeClasses[size]} ${
              isSelected
                ? 'text-yellow-500 bg-yellow-100'
                : disabled 
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-50 active:bg-yellow-100'
            }`}
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          >
            <svg 
              className={sizeClasses[size].split(' ').slice(-2).join(' ')} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        )
      })}
    </div>
  )
})

export default StarRating