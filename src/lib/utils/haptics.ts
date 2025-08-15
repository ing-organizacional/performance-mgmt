// Simulate haptic feedback for mobile devices
export const hapticFeedback = {
  light: () => {
    // For mobile devices with haptic support
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
  },
  
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20)
    }
  },
  
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 10, 30])
    }
  },
  
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 25, 50])
    }
  }
}