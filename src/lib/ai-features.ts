import { prisma } from '@/lib/prisma-client'

/**
 * Check if AI features are enabled for a specific company
 * Two-level check: global environment flag + company-specific setting
 */
export const isAIEnabled = async (companyId: string): Promise<boolean> => {
  // Global check first - master switch for entire deployment
  if (process.env.AI_FEATURES_ENABLED !== 'true') {
    return false
  }
  
  try {
    // Company-specific check
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { aiEnabled: true }
    })
    
    return company?.aiEnabled || false
  } catch (error) {
    console.error('Error checking AI features for company:', error)
    return false
  }
}

/**
 * Get AI feature configuration for a company
 * Returns granular feature flags for future use
 */
export const getAIFeatures = async (companyId: string): Promise<{
  enabled: boolean
  features: {
    textImprovement: boolean
    // Future features can be added here
  }
}> => {
  const enabled = await isAIEnabled(companyId)
  
  if (!enabled) {
    return {
      enabled: false,
      features: {
        textImprovement: false
      }
    }
  }

  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { aiFeatures: true }
    })

    // Parse granular features from JSON or use defaults
    const features = (company?.aiFeatures as Record<string, unknown>) || {}
    
    return {
      enabled: true,
      features: {
        textImprovement: features.textImprovement !== false // Default to true if AI is enabled
      }
    }
  } catch (error) {
    console.error('Error getting AI features for company:', error)
    return {
      enabled: false,
      features: {
        textImprovement: false
      }
    }
  }
}

/**
 * Enable or disable AI features for a company
 * Used by admin/HR users to toggle AI functionality
 */
export const setAIEnabled = async (companyId: string, enabled: boolean): Promise<boolean> => {
  try {
    await prisma.company.update({
      where: { id: companyId },
      data: { aiEnabled: enabled }
    })
    return true
  } catch (error) {
    console.error('Error setting AI enabled status:', error)
    return false
  }
}