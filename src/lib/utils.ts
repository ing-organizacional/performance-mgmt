/**
 * Utility Functions
 * 
 * Core utility functions for the application including:
 * - cn(): Combines and merges Tailwind CSS classes efficiently
 *   Uses clsx for conditional classes and tailwind-merge to resolve conflicts
 *   Essential for dynamic styling in React components
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}