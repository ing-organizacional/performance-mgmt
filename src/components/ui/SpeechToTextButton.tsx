'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'

interface SpeechToTextButtonProps {
  onTranscript: (text: string) => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
}

export default function SpeechToTextButton({
  onTranscript,
  onError,
  className = '',
  disabled = false
}: SpeechToTextButtonProps) {
  const { language, t } = useLanguage()
  const [isRecording, setIsRecording] = useState(false)

  // Set language based on current UI language
  const speechLanguage = language === 'es' ? 'es-ES' : 'en-US'

  const {
    isSupported,
    isListening,
    finalTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition({
    language: speechLanguage,
    continuous: false,
    interimResults: true
  })

  // Handle transcript updates
  useEffect(() => {
    if (finalTranscript) {
      onTranscript(finalTranscript.trim())
      resetTranscript()
      setIsRecording(false)
    }
  }, [finalTranscript, onTranscript, resetTranscript])

  // Handle errors
  useEffect(() => {
    if (error) {
      onError?.(error)
      setIsRecording(false)
    }
  }, [error, onError])

  // Handle listening state changes
  useEffect(() => {
    if (!isListening && isRecording) {
      setIsRecording(false)
    }
  }, [isListening, isRecording])

  const handleToggleRecording = () => {
    if (!isSupported) {
      onError?.(t.speech?.speechNotSupported || 'Speech recognition not supported')
      return
    }

    if (isRecording) {
      stopListening()
      setIsRecording(false)
    } else {
      resetTranscript()
      startListening()
      setIsRecording(true)
    }
  }

  // Don't render if not supported
  if (!isSupported) {
    return null
  }

  return (
    <button
      type="button"
      onClick={handleToggleRecording}
      disabled={disabled}
      className={`inline-flex items-center justify-center p-2 rounded-lg transition-all duration-200 touch-manipulation relative ${
        isRecording
          ? 'bg-red-100 text-red-600 hover:bg-red-200 active:bg-red-300 animate-pulse'
          : 'bg-blue-100 text-blue-600 hover:bg-blue-200 active:bg-blue-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'} ${className}`}
      title={isRecording ? (t.speech?.stopRecording || 'Stop recording') : (t.speech?.startRecording || 'Start recording')}
    >
      {isRecording ? (
        // Recording icon
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <rect x="6" y="6" width="8" height="8" rx="1" />
        </svg>
      ) : (
        // Microphone icon
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )}
      
      {/* Recording indicator */}
      {isRecording && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
      )}
    </button>
  )
}