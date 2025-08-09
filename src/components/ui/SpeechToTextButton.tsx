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
  }, [finalTranscript]) // Remove function props from dependencies to prevent infinite loops

  // Handle errors
  useEffect(() => {
    if (error) {
      if (error === 'network-error' || error === 'network') {
        // For network errors on localhost, provide specific guidance
        if (window.location.hostname === 'localhost') {
          onError?.('🛠️ Development Mode: Speech recognition requires a trusted certificate. Try using Chrome with --ignore-certificate-errors flag or test on a deployed version.')
        } else {
          onError?.('Network error: Please check your internet connection and try again.')
        }
      } else {
        onError?.(error)
      }
      setIsRecording(false)
    }
  }, [error]) // Remove onError from dependencies to prevent infinite loops

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
      setIsRecording(true) // Set immediately for UI feedback
      
      // Add a small delay to ensure microphone permissions are ready
      setTimeout(() => {
        startListening()
      }, 100)
    }
  }

  // Show disabled button if not supported for debugging
  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex items-center justify-center p-2 rounded-lg transition-all duration-200 touch-manipulation relative bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed ${className}`}
        title="Speech recognition not supported in this browser"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6" />
        </svg>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleToggleRecording}
      disabled={disabled}
      className={`inline-flex items-center justify-center p-2 rounded-lg transition-all duration-200 touch-manipulation relative ${
        isRecording
          ? 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-lg ring-4 ring-red-200'
          : 'bg-blue-100 text-blue-600 hover:bg-blue-200 active:bg-blue-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'} ${className}`}
      title={isRecording ? (t.speech?.stopRecording || 'Recording - Tap to stop') : (t.speech?.startRecording || 'Start voice recording')}
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
      
      {/* Recording indicators */}
      {isRecording && (
        <>
          {/* Pulsing dot */}
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full" />
          
          {/* Recording badge */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap shadow-lg animate-pulse">
            🎤 {t.speech?.listening || 'Listening...'}
          </div>
        </>
      )}
    </button>
  )
}