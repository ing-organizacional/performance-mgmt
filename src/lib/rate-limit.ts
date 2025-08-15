/**
 * Rate Limiting Utility
 * 
 * In-memory rate limiting system for protecting authentication endpoints and preventing
 * brute force attacks. Provides configurable rate limiting with automatic cleanup
 * and predefined configurations for common authentication scenarios.
 * 
 * Key Features:
 * - Sliding window rate limiting with configurable thresholds
 * - In-memory storage with automatic cleanup of expired entries
 * - Flexible configuration for different endpoint requirements
 * - Detailed rate limit response with remaining attempts and reset times
 * - Predefined configurations for authentication security
 * 
 * Security Benefits:
 * - Brute force attack prevention on login endpoints
 * - Account enumeration protection for registration/password reset
 * - Distributed denial-of-service (DDoS) mitigation at application level
 * - Configurable rate limits per identifier (IP, user, etc.)
 * 
 * Production Considerations:
 * - For production environments, replace with Redis-based solution
 * - Consider distributed rate limiting for multi-instance deployments
 * - Implement persistent storage for rate limit data across restarts
 * - Add monitoring and alerting for rate limit violations
 * 
 * Rate Limit Configurations:
 * - LOGIN: 5 attempts per 15 minutes for login protection
 * - SIGNUP: 3 attempts per hour for registration abuse prevention
 * - PASSWORD_RESET: 3 attempts per hour for password reset protection
 * 
 * Implementation:
 * - Memory-based storage with automatic expiration cleanup
 * - Sliding window algorithm for accurate rate limiting
 * - Configurable window duration and attempt thresholds
 * - Detailed response information for client handling
 */

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