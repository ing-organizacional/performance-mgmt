import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { getSystemPrompt } from './prompts'

/**
 * Abstract interface for LLM providers
 */
export interface LLMProvider {
  improveText(text: string, type: 'objective' | 'key-result' | 'competency' | 'competency-description', context?: string, isIteration?: boolean, department?: string): Promise<string>
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

  async improveText(text: string, type: 'objective' | 'key-result' | 'competency' | 'competency-description', context?: string, isIteration?: boolean, department?: string): Promise<string> {
    try {
      const systemPrompt = getSystemPrompt(type, isIteration, department)
      const userPrompt = context ? `Context: ${context}\n\nOriginal: ${text}` : `Original: ${text}`

      const model = process.env.OPENAI_MODEL || 'gpt-5-mini'
      const isGPT5Model = model.startsWith('gpt-5')
      
      const requestParams: {
        model: string
        messages: Array<{ role: 'system' | 'user'; content: string }>
        max_completion_tokens: number
        temperature?: number
      } = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: parseInt(process.env.LLM_MAX_TOKENS || '500')
      }
      
      // GPT-5 models only support default temperature (1), don't set custom temperature
      if (!isGPT5Model) {
        requestParams.temperature = parseFloat(process.env.LLM_TEMPERATURE || '0.3')
      }

      console.log('🚀 [OpenAI] Sending request:', {
        model: requestParams.model,
        systemPromptLength: requestParams.messages[0].content.length,
        userPromptLength: requestParams.messages[1].content.length,
        maxTokens: requestParams.max_completion_tokens,
        temperature: requestParams.temperature || 'default (1.0)'
      })

      const response = await this.client.chat.completions.create(requestParams)

      console.log('📥 [OpenAI] Response received:', {
        choices: response.choices?.length || 0,
        finishReason: response.choices[0]?.finish_reason,
        usage: response.usage,
        hasContent: !!response.choices[0]?.message?.content
      })

      const improvedText = response.choices[0]?.message?.content?.trim()
      
      if (!improvedText) {
        console.warn('⚠️ [OpenAI] Empty response received, using original text')
        return text
      }

      console.log('✅ [OpenAI] Text improvement result:', {
        originalLength: text.length,
        improvedLength: improvedText.length,
        originalText: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        improvedText: improvedText.substring(0, 50) + (improvedText.length > 50 ? '...' : ''),
        unchanged: text.trim() === improvedText.trim()
      })

      return improvedText
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw new Error('Failed to improve text with OpenAI')
    }
  }
}

/**
 * Anthropic provider implementation (Claude)
 */
export class AnthropicProvider implements LLMProvider {
  private client: Anthropic

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('AI_CONFIG_MISSING')
    }
    
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })
  }

  async improveText(text: string, type: 'objective' | 'key-result' | 'competency' | 'competency-description', context?: string, isIteration?: boolean, department?: string): Promise<string> {
    try {
      const systemPrompt = getSystemPrompt(type, isIteration, department)
      const userPrompt = context ? `Context: ${context}\n\nOriginal: ${text}` : `Original: ${text}`

      console.log('🤖 [Anthropic] Starting text improvement request')
      console.log('🔧 [Anthropic] Configuration:', {
        model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
        textLength: text.length,
        type: type,
        hasContext: !!context,
        maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '500')
      })

      const response = await this.client.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
        max_tokens: parseInt(process.env.LLM_MAX_TOKENS || '500'),
        temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.3'),
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      })

      console.log('📥 [Anthropic] Response received:', {
        stopReason: response.stop_reason,
        usage: response.usage,
        contentBlocks: response.content.length
      })

      // Extract text from response content blocks
      const improvedText = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('')
        .trim()

      if (!improvedText) {
        console.warn('⚠️ [Anthropic] Empty response received, using original text')
        return text
      }

      console.log('✅ [Anthropic] Text improvement successful:', {
        originalLength: text.length,
        improvedLength: improvedText.length,
        originalText: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        improvedText: improvedText.substring(0, 100) + (improvedText.length > 100 ? '...' : ''),
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens
      })

      return improvedText
    } catch (error) {
      console.error('💥 [Anthropic] Fatal error during text improvement:', error)
      
      if (error instanceof Error) {
        console.error('🔍 [Anthropic] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 3).join('\n') // Limit stack trace
        })
      }
      
      throw new Error('Failed to improve text with Anthropic')
    }
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

  async improveText(text: string, type: 'objective' | 'key-result' | 'competency' | 'competency-description', context?: string, isIteration?: boolean, department?: string): Promise<string> {
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
      const systemPrompt = getSystemPrompt(type, isIteration, department)
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