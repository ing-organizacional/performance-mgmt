// API request and response types
// Server actions and API route type definitions

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  errors?: Record<string, string[]>
}

export interface TeamMember {
  id: string
  name: string
  email: string | null
  department: string | null
  status: 'completed' | 'pending' | 'not_started'
}

// Server action result types
export interface ServerActionResult {
  success: boolean
  message?: string
  error?: string
  errors?: Record<string, string[]>
}

export interface CreateUserResult extends ServerActionResult {
  user?: {
    id: string
    name: string
    email: string | null
  }
}

export interface UpdateUserResult extends ServerActionResult {
  user?: {
    id: string
    name: string
  }
}

export interface CycleOperationResult extends ServerActionResult {
  cycle?: {
    id: string
    name: string
    status: string
  }
}

// Export formats
export interface ExportOptions {
  format: 'pdf' | 'excel'
  includeComments?: boolean
  dateRange?: {
    startDate: string
    endDate: string
  }
}