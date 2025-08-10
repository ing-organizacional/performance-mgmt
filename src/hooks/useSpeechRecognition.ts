'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface SpeechRecognitionOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
}

// SpeechResult interface removed as it was unused

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

// Define proper SpeechRecognition types
interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

// Extend Window interface
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
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

  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Check browser support on mount
  useEffect(() => {
    console.log('Checking speech recognition support...')
    const SpeechRecognition = 
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognition) {
      console.log('Speech recognition supported')
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()
    } else {
      console.log('Speech recognition NOT supported')
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
      console.log('Speech recognition started')
      setIsListening(true)
      setError(null)
    }

    recognition.onend = () => {
      console.log('Speech recognition ended')
      setIsListening(false)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.log('Speech recognition error:', event.error)
      setError(event.error)
      setIsListening(false)
      
      // Special handling for localhost development network errors
      if (event.error === 'network' && window.location.hostname === 'localhost') {
        console.log('Network error on localhost - this is likely due to self-signed certificate issues')
        // Don't set a user-facing error for development network issues
        // The component will handle this gracefully
      }
      
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

    recognition.onresult = (event: SpeechRecognitionEvent) => {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, continuous, interimResults, maxAlternatives]) // State dependencies omitted to prevent infinite loops

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) return
    
    try {
      setError(null)
      console.log('Attempting to start speech recognition...')
      recognitionRef.current.start()
    } catch (error) {
      console.log('Error starting recognition:', error)
      setError('Failed to start speech recognition')
    }
  }, [isSupported])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return
    
    try {
      recognitionRef.current.stop()
    } catch {
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