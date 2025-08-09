import { z } from 'zod'

// Base validation schemas
export const companyIdSchema = z.string().cuid('Invalid company ID format')
export const userIdSchema = z.string().cuid('Invalid user ID format')
export const emailSchema = z.string().email('Invalid email format').optional()
export const usernameSchema = z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be less than 50 characters').optional()

// User role validation
export const userRoleSchema = z.enum(['employee', 'manager', 'hr'])

// User type validation  
export const userTypeSchema = z.enum(['office', 'operational'])

// Password validation with different rules for different user types
export const passwordSchema = z.string()
  .min(1, 'Password is required')
  .refine((password) => {
    // Check if it's a PIN (4-6 digits) or regular password (8+ chars)
    return /^\d{4,6}$/.test(password) || password.length >= 8
  }, 'Password must be either a 4-6 digit PIN or at least 8 characters')

// File validation
export const csvFileSchema = z.object({
  name: z.string().refine((name) => name.endsWith('.csv'), 'File must be a CSV'),
  size: z.number().max(10 * 1024 * 1024, 'File must be less than 10MB'), // 10MB limit
  type: z.string().refine((type) => 
    type === 'text/csv' || 
    type === 'application/csv' || 
    type === 'text/plain', 
    'File must be a CSV format'
  )
})

// Import user data validation
export const importUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  email: emailSchema,
  username: usernameSchema,
  role: userRoleSchema,
  department: z.string().max(100, 'Department must be less than 100 characters').optional(),
  userType: userTypeSchema.default('office'),
  password: passwordSchema.optional(),
  employeeId: z.string().max(50, 'Employee ID must be less than 50 characters').optional(),
  personID: z.string().max(50, 'Person ID must be less than 50 characters').optional(),
  managerPersonID: z.string().max(50, 'Manager Person ID must be less than 50 characters').optional(),
  managerEmployeeId: z.string().max(50, 'Manager Employee ID must be less than 50 characters').optional(),
  companyCode: z.string().min(1, 'Company code is required').max(20, 'Company code must be less than 20 characters').optional(),
  position: z.string().max(100, 'Position must be less than 100 characters').optional(),
  shift: z.string().max(50, 'Shift must be less than 50 characters').optional()
}).refine((data) => {
  // Ensure either email or username is provided
  return data.email || data.username
}, {
  message: 'Either email or username must be provided',
  path: ['email'] // Show error on email field
}).refine((data) => {
  // Office workers need email, operational workers need username
  if (data.userType === 'office' && !data.email) {
    return false
  }
  if (data.userType === 'operational' && !data.username) {
    return false
  }
  return true
}, {
  message: 'Office workers require email, operational workers require username',
  path: ['userType']
})

// Evaluation item validation
export const evaluationItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description must be less than 2000 characters'),
  type: z.enum(['okr', 'competency']),
  level: z.enum(['company', 'department', 'manager']),
  assignedTo: z.string().max(255, 'Assigned to must be less than 255 characters').optional(),
  evaluationDeadline: z.string().datetime().optional(),
  sortOrder: z.number().int().min(0, 'Sort order must be non-negative').default(0)
})

// Query parameter validation
export const paginationSchema = z.object({
  page: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1, 'Page must be at least 1')).default(1),
  limit: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100')).default(50),
  search: z.string().max(255, 'Search term must be less than 255 characters').optional(),
  department: z.string().max(100, 'Department filter must be less than 100 characters').optional(),
  role: userRoleSchema.optional(),
  active: z.enum(['true', 'false']).transform((val) => val === 'true').optional()
})

// Team query validation
export const teamQuerySchema = z.object({
  includeSubordinates: z.enum(['true', 'false']).transform((val) => val === 'true').default(false),
  includeMetrics: z.enum(['true', 'false']).transform((val) => val === 'true').default(true)
})

// Health check validation
export const healthCheckSchema = z.object({
  detailed: z.enum(['true', 'false']).transform((val) => val === 'true').default(false)
})

// Update last login validation
export const updateLastLoginSchema = z.object({
  userId: userIdSchema
})

// Evaluation item update validation
export const evaluationItemUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters').optional(),
  description: z.string().min(1, 'Description is required').max(2000, 'Description must be less than 2000 characters').optional(),
  evaluationDeadline: z.string().datetime().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0, 'Sort order must be non-negative').optional()
})

// Generic error response schema
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.array(z.string()).optional()
})

// Generic success response schema
export const successResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
  data: z.any().optional()
})

// Validation helper function
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const parsed = schema.parse(data)
    return { success: true, data: parsed }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err) => `${err.path.join('.')}: ${err.message}`)
      return { success: false, errors }
    }
    return { success: false, errors: ['Invalid input format'] }
  }
}

// Validation middleware helper
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (data: unknown) => {
    const result = validateSchema(schema, data)
    if (!result.success) {
      throw new Error(`Validation failed: ${result.errors.join(', ')}`)
    }
    return result.data
  }
}