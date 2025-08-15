/**
 * LLM Provider Configuration System
 * 
 * Multi-provider LLM configuration supporting:
 * - OpenAI: GPT-5, GPT-5-mini for cloud-based AI
 * - Anthropic: Claude-3-Haiku, Sonnet, Opus for advanced reasoning
 * - Ollama: Local LLM deployment for privacy-focused organizations
 * - Environment-based configuration with sensible defaults
 * - Runtime provider switching and model selection
 * - Token limits and temperature control for consistent outputs
 */

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
      return process.env.OPENAI_MODEL || 'gpt-5-mini'
    case 'anthropic':
      return process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307'
    case 'ollama':
      return process.env.OLLAMA_MODEL || 'llama3.1'
    default:
      return 'gpt-5-mini'
  }
}