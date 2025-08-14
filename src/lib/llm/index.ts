import { getLLMConfig } from './config'
import { OpenAIProvider, AnthropicProvider, OllamaProvider, type LLMProvider } from './providers'

/**
 * Factory function to create the appropriate LLM provider
 */
export const createLLMProvider = (): LLMProvider => {
  const config = getLLMConfig()
  
  console.log('🏭 [LLM Factory] Creating provider:', config.provider)
  
  switch (config.provider) {
    case 'openai':
      console.log('🤖 [LLM Factory] Initializing OpenAI provider')
      return new OpenAIProvider()
    case 'anthropic':
      console.log('🤖 [LLM Factory] Initializing Anthropic provider')
      return new AnthropicProvider()
    case 'ollama':
      console.log('🤖 [LLM Factory] Initializing Ollama provider')
      return new OllamaProvider()
    default:
      console.error('❌ [LLM Factory] Unsupported provider:', config.provider)
      throw new Error(`Unsupported LLM provider: ${config.provider}`)
  }
}

/**
 * Main function used by Server Actions to improve text
 * Automatically uses the configured provider
 */
export const improveText = async (
  text: string, 
  type: 'objective' | 'key-result' | 'competency', 
  context?: string
): Promise<string> => {
  console.log('🎯 [LLM] Text improvement request:', {
    textLength: text.length,
    type: type,
    hasContext: !!context,
    textPreview: text.substring(0, 50) + (text.length > 50 ? '...' : '')
  })
  
  const startTime = Date.now()
  try {
    const provider = createLLMProvider()
    const result = await provider.improveText(text, type, context)
    
    const duration = Date.now() - startTime
    console.log(`✅ [LLM] Text improvement completed in ${duration}ms:`, {
      originalLength: text.length,
      improvedLength: result.length,
      resultPreview: result.substring(0, 50) + (result.length > 50 ? '...' : '')
    })
    
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`❌ [LLM] Text improvement failed after ${duration}ms:`, error)
    throw error
  }
}

/**
 * Health check for the configured LLM provider
 */
export const checkLLMHealth = async (): Promise<{ 
  provider: string, 
  status: 'healthy' | 'error', 
  error?: string 
}> => {
  const config = getLLMConfig()
  
  try {
    const provider = createLLMProvider()
    await provider.improveText("Test objective", "objective")
    return { provider: config.provider, status: 'healthy' }
  } catch (error) {
    return { 
      provider: config.provider, 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Re-export types for convenience
export type { LLMProvider } from './providers'
export { type LLMConfig, type LLMProviderType } from './config'