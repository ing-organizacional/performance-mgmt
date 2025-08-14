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
    const model = process.env.OLLAMA_MODEL || 'llama3.1:8b-instruct-q5_K_M'
    
    console.log('🤖 [Ollama] Starting text improvement request')
    console.log('🔧 [Ollama] Configuration:', {
      baseUrl: this.baseUrl,
      model: model,
      textLength: text.length,
      type: type,
      hasContext: !!context
    })

    try {
      const systemPrompt = getSystemPrompt(type)
      const userPrompt = context ? `Context: ${context}\n\nOriginal: ${text}` : `Original: ${text}`

      console.log('📝 [Ollama] Generated prompts:', {
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length,
        hasContext: !!context
      })

      // According to Ollama API docs, use system and prompt separately for better results
      const requestBody = {
        model: model,
        prompt: userPrompt,
        system: systemPrompt,
        stream: false,
        options: {
          temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.3'),
          num_predict: parseInt(process.env.LLM_MAX_TOKENS || '500'),
          top_k: 40,
          top_p: 0.9,
          repeat_penalty: 1.1
        }
      }

      console.log('🚀 [Ollama] Sending request to:', `${this.baseUrl}/api/generate`)
      console.log('📊 [Ollama] Request body:', {
        model: requestBody.model,
        promptLength: requestBody.prompt.length,
        systemLength: requestBody.system.length,
        stream: requestBody.stream,
        options: requestBody.options
      })

      const startTime = Date.now()
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const duration = Date.now() - startTime
      console.log(`⏱️ [Ollama] Request completed in ${duration}ms`)
      console.log('📥 [Ollama] Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [Ollama] API error response:', errorText)
        throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('📄 [Ollama] Response data keys:', Object.keys(data))
      console.log('📊 [Ollama] Response stats:', {
        hasResponse: !!data.response,
        responseLength: data.response?.length || 0,
        done: data.done,
        totalDuration: data.total_duration,
        loadDuration: data.load_duration,
        promptEvalCount: data.prompt_eval_count,
        evalCount: data.eval_count
      })

      const improvedText = data.response?.trim() || text
      
      // Validate that we got a meaningful response
      if (!data.response || data.response.trim().length === 0) {
        console.warn('⚠️ [Ollama] Empty response received, using original text')
        return text
      }

      console.log('✅ [Ollama] Text improvement successful:', {
        originalLength: text.length,
        improvedLength: improvedText.length,
        originalText: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        improvedText: improvedText.substring(0, 100) + (improvedText.length > 100 ? '...' : ''),
        evaluationTime: `${data.eval_duration / 1000000}ms`,
        tokensPerSecond: data.eval_count && data.eval_duration ? 
          Math.round((data.eval_count * 1000000000) / data.eval_duration) : 'N/A'
      })

      return improvedText
    } catch (error) {
      console.error('💥 [Ollama] Fatal error during text improvement:', error)
      
      if (error instanceof Error) {
        console.error('🔍 [Ollama] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 3).join('\n') // Limit stack trace
        })
      }
      
      throw new Error('Failed to improve text with Ollama')
    }
  }
}