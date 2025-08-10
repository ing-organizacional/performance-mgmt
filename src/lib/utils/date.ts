/**
 * Date utility functions for handling Date objects and string dates
 */

/**
 * Safely converts a date to ISO string, handling both Date objects and strings
 * @param date - Date object, string, or null/undefined
 * @returns ISO string or null
 */
export function toISOStringSafe(date: Date | string | null | undefined): string | null {
  if (!date) return null
  
  if (date instanceof Date) {
    return date.toISOString()
  }
  
  if (typeof date === 'string') {
    // If it's already a string, assume it's an ISO string or valid date string
    return date
  }
  
  return null
}

/**
 * Safely converts a date to Date object, handling both Date objects and strings
 * @param date - Date object, string, or null/undefined
 * @returns Date object or null
 */
export function toDateSafe(date: Date | string | null | undefined): Date | null {
  if (!date) return null
  
  if (date instanceof Date) {
    return date
  }
  
  if (typeof date === 'string') {
    return new Date(date)
  }
  
  return null
}