// Simple in-memory rate limiting for authentication endpoints
// In production, use Redis or a proper rate limiting service

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

export interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const resetTime = now + config.windowMs
  
  const existing = rateLimitStore.get(identifier)
  
  if (!existing || now > existing.resetTime) {
    // New window, reset counter
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime
    })
    
    return {
      success: true,
      remaining: config.maxAttempts - 1,
      resetTime
    }
  }
  
  if (existing.count >= config.maxAttempts) {
    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      resetTime: existing.resetTime
    }
  }
  
  // Increment counter
  existing.count++
  
  return {
    success: true,
    remaining: config.maxAttempts - existing.count,
    resetTime: existing.resetTime
  }
}

// Specific rate limiting configs for different endpoints
export const AUTH_RATE_LIMITS = {
  LOGIN: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  SIGNUP: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  PASSWORD_RESET: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
} as const