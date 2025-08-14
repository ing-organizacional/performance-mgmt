import OpenAI from 'openai'
import { getSystemPrompt } from './prompts'

/**
 * Abstract interface for LLM providers
 */
export interface LLMProvider {
  improveText(text: string, type: 'objective' | 'key-result' | 'competency', context?: string): Promise<string>
}

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider implements LLMProvider {
  private client: OpenAI

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('AI_CONFIG_MISSING')
    }
    
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  async improveText(text: string, type: 'objective' | 'key-result' | 'competency', context?: string): Promise<string> {
    try {
      const systemPrompt = getSystemPrompt(type)
      const userPrompt = context ? `Context: ${context}\n\nOriginal: ${text}` : `Original: ${text}`

      const response = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: parseInt(process.env.LLM_MAX_TOKENS || '500'),
        temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.3')
      })

      return response.choices[0]?.message?.content?.trim() || text
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw new Error('Failed to improve text with OpenAI')
    }
  }
}

/**
 * Anthropic provider implementation (future)
 */
export class AnthropicProvider implements LLMProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async improveText(text: string, type: 'objective' | 'key-result' | 'competency', context?: string): Promise<string> {
    // TODO: Implement when @anthropic-ai/sdk is added
    throw new Error('Anthropic provider not yet implemented')
  }
}

/**
 * Ollama provider implementation (future)
 */
export class OllamaProvider implements LLMProvider {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  }

  async improveText(text: string, type: 'objective' | 'key-result' | 'competency', context?: string): Promise<string> {
    try {
      const systemPrompt = getSystemPrompt(type)
      const userPrompt = context ? `Context: ${context}\n\nOriginal: ${text}` : `Original: ${text}`
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || 'llama3.1',
          prompt: fullPrompt,
          stream: false
        })
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.response?.trim() || text
    } catch (error) {
      console.error('Ollama API error:', error)
      throw new Error('Failed to improve text with Ollama')
    }
  }
}