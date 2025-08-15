/**
 * User Management Validation Schemas
 * 
 * Defines Zod validation schemas for user management operations
 * including creation, updates, and password changes.
 */

import { z } from 'zod'

export const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  username: z.string().min(1, 'Username is required').optional().or(z.literal('')),
  role: z.enum(['hr', 'manager', 'employee'], { 
    message: 'Role must be hr, manager, or employee'
  }),
  companyId: z.string().min(1, 'Company is required'),
  managerId: z.string().optional().or(z.literal('')),
  userType: z.enum(['office', 'operational']).default('office'),
  department: z.string().optional().or(z.literal('')),
  position: z.string().optional().or(z.literal('')),
  employeeId: z.string().optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  pinCode: z.string().optional().or(z.literal('')),
  active: z.boolean().default(true)
})

export const editUserSchema = userSchema.omit({ active: true }).extend({
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal(''))
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export type UserSchemaType = z.infer<typeof userSchema>
export type EditUserSchemaType = z.infer<typeof editUserSchema>
export type ChangePasswordSchemaType = z.infer<typeof changePasswordSchema>