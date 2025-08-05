'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface SpeechRecognitionOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
}

interface SpeechRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
}

interface UseSpeechRecognitionReturn {
  isSupported: boolean
  isListening: boolean
  transcript: string
  interimTranscript: string
  finalTranscript: string
  confidence: number
  error: string | null
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
}

// Extend Window interface to include webkit prefix
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function useSpeechRecognition(
  options: SpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    language = 'es-ES',
    continuous = false,
    interimResults = true,
    maxAlternatives = 1
  } = options

  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)

  // Check browser support on mount
  useEffect(() => {
    const SpeechRecognition = 
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognition) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()
    } else {
      setIsSupported(false)
    }
  }, [])

  // Configure recognition settings
  useEffect(() => {
    if (!recognitionRef.current) return

    const recognition = recognitionRef.current

    recognition.lang = language
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.maxAlternatives = maxAlternatives

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onerror = (event: any) => {
      setError(event.error)
      setIsListening(false)
      
      // Handle specific error cases with generic English messages
      // (Component using this hook should provide proper translations)
      switch (event.error) {
        case 'network':
          setError('network-error')
          break
        case 'not-allowed':
          setError('microphone-access-denied')
          break
        case 'no-speech':
          setError('no-speech-detected')
          break
        case 'audio-capture':
          setError('audio-not-supported')
          break
        default:
          setError(`speech-error-${event.error}`)
      }
    }

    recognition.onresult = (event: any) => {
      let interimTranscriptValue = ''
      let finalTranscriptValue = finalTranscript

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcriptText = result[0].transcript

        if (result.isFinal) {
          finalTranscriptValue += transcriptText + ' '
          setConfidence(result[0].confidence)
        } else {
          interimTranscriptValue += transcriptText
        }
      }

      setInterimTranscript(interimTranscriptValue)
      setFinalTranscript(finalTranscriptValue)
      setTranscript(finalTranscriptValue + interimTranscriptValue)
    }

    // Cleanup function
    return () => {
      if (recognition && isListening) {
        recognition.stop()
      }
    }
  }, [language, continuous, interimResults, maxAlternatives, finalTranscript, isListening])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) return
    
    try {
      setError(null)
      recognitionRef.current.start()
    } catch (error) {
      setError('Failed to start speech recognition')
    }
  }, [isSupported])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return
    
    try {
      recognitionRef.current.stop()
    } catch (error) {
      setError('Failed to stop speech recognition')
    }
  }, [isListening])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setFinalTranscript('')
    setConfidence(0)
    setError(null)
  }, [])

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    finalTranscript,
    confidence,
    error,
    startListening,
    stopListening,
    resetTranscript
  }
}