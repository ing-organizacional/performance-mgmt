'use client'

import { useEffect, useRef, useState } from 'react'

interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
}

interface SwipeOptions {
  threshold?: number // Minimum distance for a swipe (default: 50)
  preventDefaultTouchmoveEvent?: boolean // Prevent scrolling during swipe
  trackMouse?: boolean // Track mouse events as well as touch
}

export function useSwipe(
  handlers: SwipeHandlers,
  options: SwipeOptions = {}
) {
  const {
    threshold = 50,
    preventDefaultTouchmoveEvent = false,
    trackMouse = false
  } = options

  const elementRef = useRef<HTMLElement>(null)
  const [isSwiping, setIsSwiping] = useState(false)
  
  const startPos = useRef({ x: 0, y: 0 })
  const currentPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    let isPointerDown = false

    const handleStart = (clientX: number, clientY: number) => {
      isPointerDown = true
      setIsSwiping(false)
      startPos.current = { x: clientX, y: clientY }
      currentPos.current = { x: clientX, y: clientY }
    }

    const handleMove = (clientX: number, clientY: number) => {
      if (!isPointerDown) return

      currentPos.current = { x: clientX, y: clientY }
      const deltaX = Math.abs(clientX - startPos.current.x)
      const deltaY = Math.abs(clientY - startPos.current.y)

      // Start swiping if we've moved enough
      if (!isSwiping && (deltaX > 10 || deltaY > 10)) {
        setIsSwiping(true)
      }

      if (preventDefaultTouchmoveEvent && isSwiping) {
        // Only prevent default if we're actually swiping horizontally
        if (deltaX > deltaY) {
          event?.preventDefault()
        }
      }
    }

    const handleEnd = () => {
      if (!isPointerDown) return
      isPointerDown = false

      const deltaX = currentPos.current.x - startPos.current.x
      const deltaY = currentPos.current.y - startPos.current.y
      
      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      // Only trigger swipe if we moved far enough and horizontal movement is dominant
      if (absDeltaX > threshold && absDeltaX > absDeltaY) {
        if (deltaX > 0) {
          handlers.onSwipeRight?.()
        } else {
          handlers.onSwipeLeft?.()
        }
      } else if (absDeltaY > threshold && absDeltaY > absDeltaX) {
        if (deltaY > 0) {
          handlers.onSwipeDown?.()
        } else {
          handlers.onSwipeUp?.()
        }
      }

      setIsSwiping(false)
    }

    // Touch events
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      handleStart(touch.clientX, touch.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      handleMove(touch.clientX, touch.clientY)
    }

    const handleTouchEnd = () => {
      handleEnd()
    }

    // Mouse events (if enabled)
    const handleMouseDown = (e: MouseEvent) => {
      handleStart(e.clientX, e.clientY)
    }

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY)
    }

    const handleMouseUp = () => {
      handleEnd()
    }

    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultTouchmoveEvent })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    if (trackMouse) {
      element.addEventListener('mousedown', handleMouseDown)
      element.addEventListener('mousemove', handleMouseMove)
      element.addEventListener('mouseup', handleMouseUp)
      element.addEventListener('mouseleave', handleMouseUp) // Handle mouse leaving element
    }

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)

      if (trackMouse) {
        element.removeEventListener('mousedown', handleMouseDown)
        element.removeEventListener('mousemove', handleMouseMove)
        element.removeEventListener('mouseup', handleMouseUp)
        element.removeEventListener('mouseleave', handleMouseUp)
      }
    }
  }, [handlers, threshold, preventDefaultTouchmoveEvent, trackMouse, isSwiping])

  return {
    elementRef,
    isSwiping
  }
}