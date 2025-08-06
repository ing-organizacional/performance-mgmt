'use server'

// Note: updateCycleStatus has been consolidated into /app/admin/cycles/actions.ts
// Import directly from there in components that need it

// Wrapper function to convert object parameters to FormData and use the main createCycle function
export async function createCycle(data: {
  name: string
  startDate: string
  endDate: string
}) {
  // Import the main function dynamically to avoid circular dependencies
  const { createCycle: adminCreateCycle } = await import('@/app/admin/cycles/actions')
  
  // Convert object to FormData
  const formData = new FormData()
  formData.append('name', data.name)
  formData.append('startDate', data.startDate)
  formData.append('endDate', data.endDate)
  
  // Call the main function and adapt the response format
  const result = await adminCreateCycle(formData)
  
  // Convert the response format to match what CycleSelector expects
  if (!result.success) {
    return { 
      success: false, 
      error: result.message || 'Failed to create cycle'
    }
  }
  
  return { success: true }
}