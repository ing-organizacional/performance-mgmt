import { NextResponse } from 'next/server'
import { z } from 'zod'

export * from './schemas'

// Validation error response helper
export function validationError(message: string, details?: string[]): NextResponse {
  return NextResponse.json({
    success: false,
    error: message,
    details
  }, { status: 400 })
}

// Parse and validate query parameters
export function validateQueryParams<T>(
  schema: z.ZodSchema<T>, 
  searchParams: URLSearchParams
): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })
    
    const parsed = schema.parse(params)
    return { success: true, data: parsed }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err) => `${err.path.join('.')}: ${err.message}`)
      return { 
        success: false, 
        response: validationError('Invalid query parameters', errors)
      }
    }
    return { 
      success: false, 
      response: validationError('Invalid query parameter format')
    }
  }
}

// Parse and validate JSON body
export async function validateJsonBody<T>(
  schema: z.ZodSchema<T>, 
  request: Request
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json()
    const parsed = schema.parse(body)
    return { success: true, data: parsed }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err) => `${err.path.join('.')}: ${err.message}`)
      return { 
        success: false, 
        response: validationError('Invalid request body', errors)
      }
    }
    if (error instanceof SyntaxError) {
      return { 
        success: false, 
        response: validationError('Invalid JSON format')
      }
    }
    return { 
      success: false, 
      response: validationError('Request body validation failed')
    }
  }
}

// Validate FormData (for file uploads)
export async function validateFormData<T>(
  schema: z.ZodSchema<T>,
  formData: FormData
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const data: Record<string, unknown> = {}
    
    // Convert FormData to object
    formData.forEach((value, key) => {
      if (value instanceof File) {
        data[key] = {
          name: value.name,
          size: value.size,
          type: value.type,
          file: value
        }
      } else {
        data[key] = value
      }
    })
    
    const parsed = schema.parse(data)
    return { success: true, data: parsed }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err) => `${err.path.join('.')}: ${err.message}`)
      return { 
        success: false, 
        response: validationError('Invalid form data', errors)
      }
    }
    return { 
      success: false, 
      response: validationError('Form data validation failed')
    }
  }
}

// File validation helper
export function validateFile(file: File, maxSize: number = 10 * 1024 * 1024, allowedTypes: string[] = ['text/csv']): { valid: true } | { valid: false; error: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' }
  }
  
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB` }
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type must be one of: ${allowedTypes.join(', ')}` }
  }
  
  return { valid: true }
}

// CSV parsing helper with validation
export async function parseCSV<T>(
  file: File, 
  rowSchema: z.ZodSchema<T>,
  options: {
    skipHeader?: boolean
    maxRows?: number
    allowPartialValidation?: boolean
  } = {}
): Promise<{ success: true; data: T[]; errors: string[] } | { success: false; error: string }> {
  try {
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length === 0) {
      return { success: false, error: 'CSV file is empty' }
    }
    
    const startIndex = options.skipHeader ? 1 : 0
    if (options.skipHeader && lines.length < 2) {
      return { success: false, error: 'CSV must have header row and at least one data row' }
    }
    
    const headers = options.skipHeader ? 
      lines[0].split(',').map(h => h.trim().replace(/['"]/g, '')) : 
      null
    
    const validRows: T[] = []
    const errors: string[] = []
    const maxRows = options.maxRows || 1000
    
    for (let i = startIndex; i < Math.min(lines.length, startIndex + maxRows); i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''))
      
      if (headers && values.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch (expected ${headers.length}, got ${values.length})`)
        if (!options.allowPartialValidation) continue
      }
      
      try {
        let rowData: Record<string, string> = {}
        if (headers) {
          headers.forEach((header, index) => {
            if (values[index] && values[index] !== '') {
              rowData[header] = values[index]
            }
          })
        } else {
          // If no headers, assume values array maps to schema properties
          rowData = values.reduce((acc, val, idx) => {
            acc[`field${idx}`] = val
            return acc
          }, {} as Record<string, string>)
        }
        
        const parsed = rowSchema.parse(rowData)
        validRows.push(parsed)
      } catch (error) {
        if (error instanceof z.ZodError) {
          const rowErrors = error.issues.map((err) => `${err.path.join('.')}: ${err.message}`)
          errors.push(`Row ${i + 1}: ${rowErrors.join('; ')}`)
        } else {
          errors.push(`Row ${i + 1}: Parsing failed`)
        }
      }
    }
    
    if (validRows.length === 0 && !options.allowPartialValidation) {
      return { success: false, error: 'No valid rows found in CSV' }
    }
    
    return { success: true, data: validRows, errors }
  } catch (error) {
    console.error('CSV parsing error:', error)
    return { success: false, error: 'Failed to parse CSV file' }
  }
}