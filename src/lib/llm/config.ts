export type LLMProviderType = 'openai' | 'anthropic' | 'ollama'

export interface LLMConfig {
  provider: LLMProviderType
  model?: string
  maxTokens?: number
  temperature?: number
}

/**
 * Get LLM configuration from environment variables
 */
export const getLLMConfig = (): LLMConfig => {
  const provider = (process.env.LLM_PROVIDER || 'ollama') as LLMProviderType
  const config = {
    provider,
    model: getModelForProvider(provider),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '500'),
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.3')
  }
  
  console.log('🔧 [LLM Config] Configuration loaded:', config)
  
  return config
}

/**
 * Get default model for each provider
 */
const getModelForProvider = (provider: LLMProviderType): string => {
  switch (provider) {
    case 'openai':
      return process.env.OPENAI_MODEL || 'gpt-4o-mini'
    case 'anthropic':
      return process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307'
    case 'ollama':
      return process.env.OLLAMA_MODEL || 'llama3.1'
    default:
      return 'gpt-4o-mini'
  }
}