/**
 * Prisma Database Client Configuration
 * 
 * Provides a singleton Prisma client instance for database operations.
 * In development, reuses the same client instance to prevent connection pool exhaustion
 * during hot reloads. In production, creates a fresh client instance.
 * 
 * IMPORTANT: Always use this client for database operations throughout the application
 * to ensure proper connection management and prevent multiple client instances.
 */

import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma: PrismaClient | undefined
}

export const prisma = globalThis.__prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}