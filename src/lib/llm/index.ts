import { getLLMConfig } from './config'
import { OpenAIProvider, AnthropicProvider, OllamaProvider, type LLMProvider } from './providers'

/**
 * Factory function to create the appropriate LLM provider
 */
export const createLLMProvider = (): LLMProvider => {
  const config = getLLMConfig()
  
  switch (config.provider) {
    case 'openai':
      return new OpenAIProvider()
    case 'anthropic':
      return new AnthropicProvider()
    case 'ollama':
      return new OllamaProvider()
    default:
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
  const provider = createLLMProvider()
  return await provider.improveText(text, type, context)
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